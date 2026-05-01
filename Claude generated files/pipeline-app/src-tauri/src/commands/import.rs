use crate::AppDb;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ParsedMarkdownIdea {
    pub title:        String,
    pub category:     Option<String>,
    pub owner:        Option<String>,
    pub stage:        Option<String>,
    pub status:       Option<String>,
    pub horizon:      Option<String>,
    pub tags:         Vec<String>,
    pub created:      Option<String>,
    pub body:         String,
    pub raw:          String,
    pub source_file:  String,
    pub extra_fields: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportResult {
    pub imported: i64,
    pub skipped:  i64,
    pub updated:  i64,
    pub errors:   Vec<String>,
}

#[tauri::command]
pub async fn pick_import_files(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let paths = app
        .dialog()
        .file()
        .add_filter("Markdown", &["md"])
        .blocking_pick_files();
    match paths {
        Some(files) => Ok(files.iter().filter_map(|p| p.as_path().map(|p| p.to_string_lossy().to_string())).collect()),
        None => Ok(vec![]),
    }
}

#[tauri::command]
pub async fn pick_import_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let path = app.dialog().file().blocking_pick_folder();
    Ok(path.and_then(|p| p.as_path().map(|p| p.to_string_lossy().to_string())))
}

#[tauri::command]
pub async fn list_markdown_in_folder(folder: String) -> Result<Vec<String>, String> {
    let mut paths = Vec::new();
    collect_md_files(Path::new(&folder), &mut paths)?;
    Ok(paths)
}

fn collect_md_files(dir: &Path, out: &mut Vec<String>) -> Result<(), String> {
    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            let _ = collect_md_files(&path, out);
        } else if path.extension().and_then(|e| e.to_str()) == Some("md") {
            out.push(path.to_string_lossy().to_string());
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn parse_markdown_files(paths: Vec<String>) -> Result<Vec<ParsedMarkdownIdea>, String> {
    let mut results = Vec::new();
    for path in &paths {
        match fs::read_to_string(path) {
            Ok(content) => {
                let parsed = parse_markdown_content(&content, path);
                results.push(parsed);
            }
            Err(e) => return Err(format!("Failed to read {}: {}", path, e)),
        }
    }
    Ok(results)
}

fn parse_markdown_content(content: &str, source_file: &str) -> ParsedMarkdownIdea {
    let known = ["title","category","owner","stage","status","horizon","tags","created"];
    let mut title = None;
    let mut category = None;
    let mut owner = None;
    let mut stage = None;
    let mut status = None;
    let mut horizon = None;
    let mut tags: Vec<String> = vec![];
    let mut created = None;
    let mut extra_fields = serde_json::Map::new();
    let body;

    if content.starts_with("---") {
        let end = content[3..].find("\n---").map(|i| i + 3);
        if let Some(end_idx) = end {
            let frontmatter = &content[3..end_idx];
            let body_start = end_idx + 4;
            body = content[body_start..].trim_start().to_string();

            for line in frontmatter.lines() {
                if let Some(colon) = line.find(':') {
                    let key = line[..colon].trim().to_string();
                    let val = line[colon + 1..].trim().to_string();
                    match key.as_str() {
                        "title"    => title    = Some(val),
                        "category" => category = Some(val),
                        "owner"    => owner    = Some(val),
                        "stage"    => stage    = Some(val),
                        "status"   => status   = Some(val),
                        "horizon"  => horizon  = Some(val),
                        "created"  => created  = Some(val),
                        "tags"     => {
                            tags = val.trim_matches(|c| c == '[' || c == ']')
                                .split(',')
                                .map(|t| t.trim().trim_matches('"').to_string())
                                .filter(|t| !t.is_empty())
                                .collect();
                        }
                        k if !known.contains(&k) => {
                            extra_fields.insert(k.to_string(), serde_json::Value::String(val));
                        }
                        _ => {}
                    }
                }
            }
        } else {
            body = content.to_string();
        }
    } else {
        body = content.to_string();
    }

    let inferred_title = if title.is_none() {
        body.lines()
            .find(|l| l.starts_with("# "))
            .map(|l| l[2..].trim().to_string())
    } else {
        None
    };

    ParsedMarkdownIdea {
        title: title.or(inferred_title).unwrap_or_else(|| {
            std::path::Path::new(source_file)
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| source_file.to_string())
        }),
        category,
        owner,
        stage,
        status,
        horizon,
        tags,
        created,
        body,
        raw: content.to_string(),
        source_file: source_file.to_string(),
        extra_fields: serde_json::Value::Object(extra_fields),
    }
}

#[tauri::command]
pub async fn import_ideas(
    db: tauri::State<'_, AppDb>,
    ideas: Vec<ParsedMarkdownIdea>,
    actor: String,
) -> Result<ImportResult, String> {
    let pool = &db.0;
    let mut result = ImportResult { imported: 0, skipped: 0, updated: 0, errors: vec![] };

    for idea in &ideas {
        let existing: Option<i64> = sqlx::query_scalar(
            "SELECT id FROM ideas WHERE source_file = ? AND source_type = 'import'"
        )
        .bind(&idea.source_file)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?;

        let meta = serde_json::to_string(&idea.extra_fields).ok();

        if let Some(existing_id) = existing {
            sqlx::query(
                "UPDATE ideas SET title=?, description=?, raw_markdown=?, status=COALESCE(?,status),
                 stage=COALESCE(?,stage), category=?, owner=?, horizon=?, meta=? WHERE id=?"
            )
            .bind(&idea.title).bind(&idea.body).bind(&idea.raw)
            .bind(&idea.status).bind(&idea.stage)
            .bind(&idea.category).bind(&idea.owner).bind(&idea.horizon).bind(&meta)
            .bind(existing_id)
            .execute(pool).await.map_err(|e| e.to_string())?;

            sqlx::query(
                "INSERT INTO activity_log (idea_id, event_type, detail, actor) VALUES (?, 'updated', ?, ?)"
            )
            .bind(existing_id)
            .bind(serde_json::json!({"source": &idea.source_file}).to_string())
            .bind(&actor)
            .execute(pool).await.map_err(|e| e.to_string())?;

            result.updated += 1;
        } else {
            let id = sqlx::query(
                "INSERT INTO ideas (title, description, raw_markdown, status, stage, category, owner, horizon,
                                   source_file, source_type, meta)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'import', ?)"
            )
            .bind(&idea.title).bind(&idea.body).bind(&idea.raw)
            .bind(idea.status.as_deref().unwrap_or("draft"))
            .bind(idea.stage.as_deref().unwrap_or("collection"))
            .bind(&idea.category).bind(&idea.owner).bind(&idea.horizon)
            .bind(&idea.source_file).bind(&meta)
            .execute(pool).await.map_err(|e| e.to_string())?
            .last_insert_rowid();

            for tag_name in &idea.tags {
                let tag_id: i64 = sqlx::query_scalar(
                    "INSERT OR IGNORE INTO tags (name) VALUES (?); SELECT id FROM tags WHERE name = ?"
                )
                .bind(tag_name).bind(tag_name)
                .fetch_one(pool).await.unwrap_or(0);
                if tag_id > 0 {
                    let _ = sqlx::query("INSERT OR IGNORE INTO idea_tags (idea_id, tag_id) VALUES (?, ?)")
                        .bind(id).bind(tag_id).execute(pool).await;
                }
            }

            sqlx::query(
                "INSERT INTO activity_log (idea_id, event_type, detail, actor) VALUES (?, 'imported', ?, ?)"
            )
            .bind(id)
            .bind(serde_json::json!({"source": &idea.source_file}).to_string())
            .bind(&actor)
            .execute(pool).await.map_err(|e| e.to_string())?;

            result.imported += 1;
        }
    }

    Ok(result)
}
