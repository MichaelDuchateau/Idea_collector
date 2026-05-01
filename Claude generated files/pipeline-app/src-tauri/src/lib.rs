mod commands;
mod db;

use sqlx::sqlite::SqlitePoolOptions;
use std::fs;
use tauri::Manager;

pub struct AppDb(pub sqlx::SqlitePool);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir()?;
            fs::create_dir_all(&app_dir)?;
            let db_path = app_dir.join("pipeline.db");
            let db_url = format!("sqlite://{}?mode=rwc", db_path.to_string_lossy());

            let pool = tauri::async_runtime::block_on(async {
                SqlitePoolOptions::new()
                    .max_connections(5)
                    .connect(&db_url)
                    .await
                    .expect("failed to open SQLite database")
            });

            tauri::async_runtime::block_on(async {
                run_migrations(&pool).await.expect("migration failed");
            });

            app.manage(AppDb(pool));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::ideas::get_ideas,
            commands::ideas::get_idea,
            commands::ideas::create_idea,
            commands::ideas::update_idea,
            commands::ideas::delete_idea,
            commands::ideas::move_idea_stage,
            commands::ideas::get_pipeline_board,
            commands::ideas::get_ideas_summary,
            commands::scores::get_criteria,
            commands::scores::get_scores_for_idea,
            commands::scores::save_score,
            commands::scores::save_criterion,
            commands::scores::update_criterion,
            commands::scores::reorder_criteria,
            commands::scores::delete_criterion,
            commands::import::pick_import_files,
            commands::import::pick_import_folder,
            commands::import::list_markdown_in_folder,
            commands::import::parse_markdown_files,
            commands::import::import_ideas,
            commands::obsidian::obsidian_test_connection,
            commands::obsidian::obsidian_list_pipeline_files,
            commands::obsidian::obsidian_get_file,
            commands::obsidian::obsidian_sync,
            commands::export::export_pdf,
            commands::settings::get_settings,
            commands::settings::save_setting,
            commands::settings::get_activity_log,
            commands::settings::get_db_path,
            commands::settings::backup_db,
            commands::settings::restore_db,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn run_migrations(pool: &sqlx::SqlitePool) -> Result<(), sqlx::Error> {
    let sql = include_str!("../../migrations/001_initial.sql");
    sqlx::raw_sql(sql).execute(pool).await?;
    Ok(())
}
