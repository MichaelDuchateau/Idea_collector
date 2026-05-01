use crate::AppDb;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct ScorecardCriterion {
    pub id:          i64,
    pub name:        String,
    pub description: Option<String>,
    pub weight:      f64,
    pub sort_order:  i64,
    pub active:      bool,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct Score {
    pub id:           i64,
    pub idea_id:      i64,
    pub criterion_id: i64,
    pub value:        f64,
    pub notes:        Option<String>,
    pub scored_by:    String,
    pub scored_at:    String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScoresByCriterion {
    pub criterion:             ScorecardCriterion,
    pub scores:                Vec<Score>,
    pub average:               f64,
    pub weighted_contribution: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CriterionPayload {
    pub name:        String,
    pub description: Option<String>,
    pub weight:      f64,
    pub sort_order:  i64,
    pub active:      Option<bool>,
}

#[tauri::command]
pub async fn get_criteria(db: tauri::State<'_, AppDb>) -> Result<Vec<ScorecardCriterion>, String> {
    let pool = &db.0;
    sqlx::query_as::<_, ScorecardCriterion>(
        "SELECT id, name, description, weight, sort_order, active
         FROM scorecard_criteria ORDER BY sort_order"
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_scores_for_idea(
    db: tauri::State<'_, AppDb>,
    idea_id: i64,
) -> Result<Vec<ScoresByCriterion>, String> {
    let pool = &db.0;
    let criteria = sqlx::query_as::<_, ScorecardCriterion>(
        "SELECT id, name, description, weight, sort_order, active
         FROM scorecard_criteria WHERE active = 1 ORDER BY sort_order"
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let all_scores = sqlx::query_as::<_, Score>(
        "SELECT id, idea_id, criterion_id, value, notes, scored_by, scored_at
         FROM scores WHERE idea_id = ?"
    )
    .bind(idea_id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let result = criteria.into_iter().map(|c| {
        let scores: Vec<Score> = all_scores.iter().filter(|s| s.criterion_id == c.id).cloned().collect();
        let average = if scores.is_empty() { 0.0 } else {
            scores.iter().map(|s| s.value).sum::<f64>() / scores.len() as f64
        };
        let weighted_contribution = average * c.weight;
        ScoresByCriterion { criterion: c, scores, average, weighted_contribution }
    }).collect();

    Ok(result)
}

#[tauri::command]
pub async fn save_score(
    db: tauri::State<'_, AppDb>,
    idea_id: i64,
    criterion_id: i64,
    value: f64,
    notes: Option<String>,
    scored_by: String,
) -> Result<(), String> {
    let pool = &db.0;
    sqlx::query(
        "INSERT INTO scores (idea_id, criterion_id, value, notes, scored_by)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(idea_id, criterion_id, scored_by)
         DO UPDATE SET value = excluded.value, notes = excluded.notes, scored_at = datetime('now')"
    )
    .bind(idea_id).bind(criterion_id).bind(value).bind(&notes).bind(&scored_by)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn save_criterion(
    db: tauri::State<'_, AppDb>,
    payload: CriterionPayload,
) -> Result<i64, String> {
    let pool = &db.0;
    let r = sqlx::query(
        "INSERT INTO scorecard_criteria (name, description, weight, sort_order, active) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&payload.name).bind(&payload.description).bind(payload.weight)
    .bind(payload.sort_order).bind(payload.active.unwrap_or(true))
    .execute(pool).await.map_err(|e| e.to_string())?;
    Ok(r.last_insert_rowid())
}

#[tauri::command]
pub async fn update_criterion(
    db: tauri::State<'_, AppDb>,
    id: i64,
    payload: CriterionPayload,
) -> Result<(), String> {
    let pool = &db.0;
    sqlx::query(
        "UPDATE scorecard_criteria SET name=?, description=?, weight=?, sort_order=?, active=? WHERE id=?"
    )
    .bind(&payload.name).bind(&payload.description).bind(payload.weight)
    .bind(payload.sort_order).bind(payload.active.unwrap_or(true)).bind(id)
    .execute(pool).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn reorder_criteria(
    db: tauri::State<'_, AppDb>,
    ordered_ids: Vec<i64>,
) -> Result<(), String> {
    let pool = &db.0;
    for (idx, id) in ordered_ids.iter().enumerate() {
        sqlx::query("UPDATE scorecard_criteria SET sort_order = ? WHERE id = ?")
            .bind(idx as i64 + 1).bind(id)
            .execute(pool).await.map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn delete_criterion(db: tauri::State<'_, AppDb>, id: i64) -> Result<(), String> {
    let pool = &db.0;
    sqlx::query("DELETE FROM scorecard_criteria WHERE id = ?")
        .bind(id).execute(pool).await.map_err(|e| e.to_string())?;
    Ok(())
}
