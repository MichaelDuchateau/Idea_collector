use crate::AppDb;
use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct SettingRow {
    pub key:   String,
    pub value: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppSettings {
    pub user_name:              String,
    pub score_threshold_green:  f64,
    pub score_threshold_amber:  f64,
    pub obsidian_enabled:       bool,
    pub obsidian_api_url:       String,
    pub obsidian_api_key:       String,
    pub obsidian_vault_folder:  String,
    pub obsidian_sync_interval: i64,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ActivityLogEntry {
    pub id:         i64,
    pub idea_id:    Option<i64>,
    pub event_type: String,
    pub detail:     Option<String>,
    pub actor:      Option<String>,
    pub created_at: String,
}

#[tauri::command]
pub async fn get_settings(db: tauri::State<'_, AppDb>) -> Result<AppSettings, String> {
    let pool = &db.0;
    let rows = sqlx::query_as::<_, SettingRow>("SELECT key, value FROM settings")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    let get = |key: &str| -> String {
        rows.iter()
            .find(|r| r.key == key)
            .and_then(|r| r.value.clone())
            .unwrap_or_default()
    };

    Ok(AppSettings {
        user_name:              get("user_name"),
        score_threshold_green:  get("score_threshold_green").parse().unwrap_or(75.0),
        score_threshold_amber:  get("score_threshold_amber").parse().unwrap_or(50.0),
        obsidian_enabled:       get("obsidian_enabled") == "true",
        obsidian_api_url:       get("obsidian_api_url"),
        obsidian_api_key:       get("obsidian_api_key"),
        obsidian_vault_folder:  get("obsidian_vault_folder"),
        obsidian_sync_interval: get("obsidian_sync_interval").parse().unwrap_or(300),
    })
}

#[tauri::command]
pub async fn save_setting(
    db: tauri::State<'_, AppDb>,
    key: String,
    value: String,
) -> Result<(), String> {
    let pool = &db.0;
    sqlx::query(
        "INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')"
    )
    .bind(&key).bind(&value)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_activity_log(
    db: tauri::State<'_, AppDb>,
    idea_id: Option<i64>,
    limit: Option<i64>,
) -> Result<Vec<ActivityLogEntry>, String> {
    let pool = &db.0;
    let lim = limit.unwrap_or(50);
    let rows = sqlx::query_as::<_, ActivityLogEntry>(
        "SELECT id, idea_id, event_type, detail, actor, created_at
         FROM activity_log
         WHERE (? IS NULL OR idea_id = ?)
         ORDER BY created_at DESC
         LIMIT ?"
    )
    .bind(idea_id).bind(idea_id).bind(lim)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(rows)
}

#[tauri::command]
pub async fn get_db_path(app: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("pipeline.db");
    Ok(db_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn backup_db(app: tauri::AppHandle, dest: String) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let src = app_dir.join("pipeline.db");
    std::fs::copy(&src, &dest).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn restore_db(
    app: tauri::AppHandle,
    db: tauri::State<'_, AppDb>,
    src: String,
) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let dest = app_dir.join("pipeline.db");

    // Close all connections before overwriting
    db.0.close().await;
    std::fs::copy(&src, &dest).map_err(|e| e.to_string())?;
    Ok(())
}
