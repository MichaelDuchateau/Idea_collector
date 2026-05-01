use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfExportOptions {
    pub include_scores: bool,
    pub include_charts: bool,
    pub stages:         Vec<String>,
    pub min_score:      Option<f64>,
}

#[tauri::command]
pub async fn export_pdf(
    _output_path: String,
    _options: PdfExportOptions,
) -> Result<(), String> {
    // PDF generation is handled on the frontend via jsPDF + html2canvas.
    // This command is a placeholder for future native PDF printing via shell.
    Ok(())
}
