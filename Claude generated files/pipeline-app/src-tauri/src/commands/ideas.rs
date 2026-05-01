use crate::AppDb;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct IdeaRow {
    pub id:             i64,
    pub title:          String,
    pub description:    Option<String>,
    pub status:         String,
    pub stage:          String,
    pub category:       Option<String>,
    pub owner:          Option<String>,
    pub horizon:        Option<String>,
    pub source_type:    String,
    pub created_at:     String,
    pub updated_at:     String,
    pub weighted_score: Option<f64>,
    pub scorer_count:   Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct IdeaDetail {
    pub id:             i64,
    pub title:          String,
    pub description:    Option<String>,
    pub raw_markdown:   Option<String>,
    pub status:         String,
    pub stage:          String,
    pub category:       Option<String>,
    pub owner:          Option<String>,
    pub horizon:        Option<String>,
    pub source_file:    Option<String>,
    pub source_type:    String,
    pub obsidian_path:  Option<String>,
    pub meta:           Option<String>,
    pub created_at:     String,
    pub updated_at:     String,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct IdeaCard {
    pub id:             i64,
    pub title:          String,
    pub status:         String,
    pub stage:          String,
    pub owner:          Option<String>,
    pub horizon:        Option<String>,
    pub weighted_score: Option<f64>,
    pub scorer_count:   Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct IdeaScoreSummary {
    pub idea_id:        i64,
    pub title:          String,
    pub stage:          String,
    pub status:         String,
    pub weighted_score: Option<f64>,
    pub scorer_count:   i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateIdeaPayload {
    pub title:         String,
    pub description:   Option<String>,
    pub raw_markdown:  Option<String>,
    pub status:        Option<String>,
    pub stage:         Option<String>,
    pub category:      Option<String>,
    pub owner:         Option<String>,
    pub horizon:       Option<String>,
    pub source_file:   Option<String>,
    pub source_type:   Option<String>,
    pub obsidian_path: Option<String>,
    pub meta:          Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateIdeaPayload {
    pub title:        Option<String>,
    pub description:  Option<String>,
    pub raw_markdown: Option<String>,
    pub status:       Option<String>,
    pub stage:        Option<String>,
    pub category:     Option<String>,
    pub owner:        Option<String>,
    pub horizon:      Option<String>,
    pub meta:         Option<String>,
}

#[tauri::command]
pub async fn get_ideas(
    db: tauri::State<'_, AppDb>,
    stage: Option<String>,
    status: Option<String>,
    search: Option<String>,
) -> Result<Vec<IdeaRow>, String> {
    let pool = &db.0;
    let rows = sqlx::query_as::<_, IdeaRow>(
        "SELECT i.id, i.title, i.description, i.status, i.stage, i.category, i.owner,
                i.horizon, i.source_type, i.created_at, i.updated_at,
                s.weighted_score, s.scorer_count
         FROM ideas i
         LEFT JOIN idea_scores_summary s ON s.idea_id = i.id
         WHERE (? IS NULL OR i.stage = ?)
           AND (? IS NULL OR i.status = ?)
           AND (? IS NULL OR i.title LIKE '%' || ? || '%' OR i.description LIKE '%' || ? || '%')
         ORDER BY i.updated_at DESC"
    )
    .bind(&stage).bind(&stage)
    .bind(&status).bind(&status)
    .bind(&search).bind(&search).bind(&search)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(rows)
}

#[tauri::command]
pub async fn get_idea(db: tauri::State<'_, AppDb>, id: i64) -> Result<IdeaDetail, String> {
    let pool = &db.0;
    let row = sqlx::query_as::<_, IdeaDetail>(
        "SELECT id, title, description, raw_markdown, status, stage, category, owner, horizon,
                source_file, source_type, obsidian_path, meta, created_at, updated_at
         FROM ideas WHERE id = ?"
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub async fn create_idea(
    db: tauri::State<'_, AppDb>,
    payload: CreateIdeaPayload,
) -> Result<i64, String> {
    let pool = &db.0;
    let result = sqlx::query(
        "INSERT INTO ideas (title, description, raw_markdown, status, stage, category, owner, horizon,
                            source_file, source_type, obsidian_path, meta)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(&payload.raw_markdown)
    .bind(payload.status.as_deref().unwrap_or("draft"))
    .bind(payload.stage.as_deref().unwrap_or("collection"))
    .bind(&payload.category)
    .bind(&payload.owner)
    .bind(&payload.horizon)
    .bind(&payload.source_file)
    .bind(payload.source_type.as_deref().unwrap_or("manual"))
    .bind(&payload.obsidian_path)
    .bind(&payload.meta)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(result.last_insert_rowid())
}

#[tauri::command]
pub async fn update_idea(
    db: tauri::State<'_, AppDb>,
    id: i64,
    payload: UpdateIdeaPayload,
) -> Result<(), String> {
    let pool = &db.0;
    sqlx::query(
        "UPDATE ideas SET
           title        = COALESCE(?, title),
           description  = COALESCE(?, description),
           raw_markdown = COALESCE(?, raw_markdown),
           status       = COALESCE(?, status),
           stage        = COALESCE(?, stage),
           category     = COALESCE(?, category),
           owner        = COALESCE(?, owner),
           horizon      = COALESCE(?, horizon),
           meta         = COALESCE(?, meta)
         WHERE id = ?"
    )
    .bind(&payload.title).bind(&payload.description).bind(&payload.raw_markdown)
    .bind(&payload.status).bind(&payload.stage).bind(&payload.category)
    .bind(&payload.owner).bind(&payload.horizon).bind(&payload.meta)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn delete_idea(db: tauri::State<'_, AppDb>, id: i64) -> Result<(), String> {
    let pool = &db.0;
    sqlx::query("DELETE FROM ideas WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn move_idea_stage(
    db: tauri::State<'_, AppDb>,
    id: i64,
    new_stage: String,
    actor: String,
) -> Result<(), String> {
    let pool = &db.0;
    let old_stage: String = sqlx::query_scalar("SELECT stage FROM ideas WHERE id = ?")
        .bind(id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("UPDATE ideas SET stage = ? WHERE id = ?")
        .bind(&new_stage).bind(id)
        .execute(pool).await.map_err(|e| e.to_string())?;

    let detail = serde_json::json!({ "from": old_stage, "to": new_stage });
    sqlx::query(
        "INSERT INTO activity_log (idea_id, event_type, detail, actor) VALUES (?, 'stage_changed', ?, ?)"
    )
    .bind(id).bind(detail.to_string()).bind(&actor)
    .execute(pool).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_pipeline_board(
    db: tauri::State<'_, AppDb>,
) -> Result<HashMap<String, Vec<IdeaCard>>, String> {
    let pool = &db.0;
    let rows = sqlx::query_as::<_, IdeaCard>(
        "SELECT i.id, i.title, i.status, i.stage, i.owner, i.horizon,
                s.weighted_score, s.scorer_count
         FROM ideas i
         LEFT JOIN idea_scores_summary s ON s.idea_id = i.id
         ORDER BY s.weighted_score DESC NULLS LAST"
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let mut board: HashMap<String, Vec<IdeaCard>> = HashMap::new();
    for stage in ["collection", "screening", "development", "gate", "build"] {
        board.insert(stage.to_string(), vec![]);
    }
    for card in rows {
        board.entry(card.stage.clone()).or_default().push(card);
    }
    Ok(board)
}

#[tauri::command]
pub async fn get_ideas_summary(
    db: tauri::State<'_, AppDb>,
) -> Result<Vec<IdeaScoreSummary>, String> {
    let pool = &db.0;
    let rows = sqlx::query_as::<_, IdeaScoreSummary>(
        "SELECT idea_id, title, stage, status,
                weighted_score, COALESCE(scorer_count, 0) AS scorer_count
         FROM idea_scores_summary
         ORDER BY weighted_score DESC NULLS LAST"
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(rows)
}
