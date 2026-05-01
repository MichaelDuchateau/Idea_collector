use crate::AppDb;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ConnectionResult {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ObsidianFile {
    pub path:     String,
    pub name:     String,
    pub modified: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncResult {
    pub synced:  i64,
    pub skipped: i64,
    pub errors:  Vec<String>,
}

#[tauri::command]
pub async fn obsidian_test_connection(
    api_url: String,
    api_key: String,
) -> Result<ConnectionResult, String> {
    let client = reqwest::Client::new();
    match client
        .get(format!("{}/", api_url))
        .header("Authorization", format!("Bearer {}", api_key))
        .timeout(std::time::Duration::from_secs(5))
        .send()
        .await
    {
        Ok(resp) if resp.status().is_success() => Ok(ConnectionResult {
            success: true,
            message: "Connected to Obsidian".to_string(),
        }),
        Ok(resp) => Ok(ConnectionResult {
            success: false,
            message: format!("Obsidian returned status {}", resp.status()),
        }),
        Err(e) => Ok(ConnectionResult {
            success: false,
            message: format!("Connection failed: {}", e),
        }),
    }
}

#[tauri::command]
pub async fn obsidian_list_pipeline_files(
    api_url: String,
    api_key: String,
    folder: String,
) -> Result<Vec<ObsidianFile>, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/vault/{}/", api_url, folder);
    let resp = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    let files = json["files"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .filter_map(|f| {
                    let path = f["path"].as_str()?;
                    if !path.ends_with(".md") { return None; }
                    Some(ObsidianFile {
                        path: path.to_string(),
                        name: std::path::Path::new(path)
                            .file_name()
                            .map(|n| n.to_string_lossy().to_string())
                            .unwrap_or_default(),
                        modified: f["stat"]["mtime"].as_i64().unwrap_or(0),
                    })
                })
                .collect()
        })
        .unwrap_or_default();
    Ok(files)
}

#[tauri::command]
pub async fn obsidian_get_file(
    api_url: String,
    api_key: String,
    path: String,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/vault/{}", api_url, path);
    let resp = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    resp.text().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn obsidian_sync(
    db: tauri::State<'_, AppDb>,
    actor: String,
) -> Result<SyncResult, String> {
    let pool = &db.0;
    let mut result = SyncResult { synced: 0, skipped: 0, errors: vec![] };

    let api_url: String = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'obsidian_api_url'")
        .fetch_one(pool).await.map_err(|e| e.to_string())?;
    let api_key: String = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'obsidian_api_key'")
        .fetch_one(pool).await.map_err(|e| e.to_string())?;
    let folder: String = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'obsidian_vault_folder'")
        .fetch_one(pool).await.map_err(|e| e.to_string())?;

    let files = obsidian_list_pipeline_files(api_url.clone(), api_key.clone(), folder).await?;

    for file in &files {
        match obsidian_get_file(api_url.clone(), api_key.clone(), file.path.clone()).await {
            Ok(content) => {
                let parsed = super::import::parse_markdown_files(vec![file.path.clone()]).await;
                if parsed.is_err() { result.errors.push(file.path.clone()); continue; }
                let existing: Option<i64> = sqlx::query_scalar(
                    "SELECT id FROM ideas WHERE obsidian_path = ?"
                )
                .bind(&file.path)
                .fetch_optional(pool)
                .await
                .unwrap_or(None);

                if let Some(existing_id) = existing {
                    let updated_at_ms: i64 = sqlx::query_scalar(
                        "SELECT CAST((julianday(updated_at) - julianday('1970-01-01')) * 86400000 AS INTEGER) FROM ideas WHERE id = ?"
                    )
                    .bind(existing_id)
                    .fetch_one(pool)
                    .await
                    .unwrap_or(0);

                    if file.modified > updated_at_ms {
                        sqlx::query(
                            "UPDATE ideas SET raw_markdown = ?, updated_at = datetime('now') WHERE id = ?"
                        )
                        .bind(&content).bind(existing_id)
                        .execute(pool).await.map_err(|e| e.to_string())?;
                        result.synced += 1;
                    } else {
                        result.skipped += 1;
                    }
                } else {
                    let _ = sqlx::query(
                        "INSERT INTO ideas (title, raw_markdown, source_type, obsidian_path, status, stage)
                         VALUES (?, ?, 'obsidian', ?, 'draft', 'collection')"
                    )
                    .bind(&file.name).bind(&content).bind(&file.path)
                    .execute(pool).await;

                    sqlx::query(
                        "INSERT INTO activity_log (event_type, detail, actor) VALUES ('obsidian_synced', ?, ?)"
                    )
                    .bind(serde_json::json!({"file": &file.path}).to_string())
                    .bind(&actor)
                    .execute(pool).await.map_err(|e| e.to_string())?;

                    result.synced += 1;
                }
            }
            Err(e) => result.errors.push(format!("{}: {}", file.path, e)),
        }
    }

    Ok(result)
}
