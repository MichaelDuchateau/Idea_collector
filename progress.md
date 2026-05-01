# Progress Log — Pipeline App

## Session: 2026-04-30 (Session 1)
- Created planning files (task_plan.md, findings.md, progress.md)
- Read pipeline-app-handoff.md — captured all agreed decisions
- Identified blocker: technical spec not received (user message interrupted)

## Session: 2026-04-30 → 2026-05-01 (Sessions 2–5, main build)

### Phase 1 — Foundation ✅
- Scaffolded Tauri 2.0 + React 19 + TypeScript project
- Installed all npm and Cargo dependencies
- Created `migrations/001_initial.sql` (full DDL + seed data)
- Implemented DB init in `lib.rs` using `sqlx::SqlitePool` managed state
- Fixed migration panic: replaced `;` splitter with `sqlx::raw_sql()` for trigger support
- Implemented all commands: ideas.rs (8), scores.rs (7), import.rs (5), obsidian.rs (4), export.rs (stub), settings.rs (3)
- Built all Phase 1 components: IdeasTable, IdeaDetail, IdeaEditor, ImportModal, ImportPreview, Layout, Sidebar, TopBar
- TypeScript: 0 errors. cargo check: 0 errors.
- Pushed to GitHub

### Phase 2 — Scoring ✅
- ScorecardPanel with per-criterion sliders, notes field, live weighted score preview
- ScoreBreakdown showing per-criterion bars + individual scorer values
- ScoreBadge (green/amber/red/unscored colour-coded pill)
- ScorecardEditor and ThresholdEditor in Settings
- TypeScript: 0 errors. cargo check: 0 errors.
- Pushed to GitHub

### Phase 3 — Pipeline + Obsidian ✅
- PipelineBoard with react-beautiful-dnd, optimistic drag updates
- Removed React.StrictMode (react-beautiful-dnd incompatibility)
- ActivityLog component with event icons and relative timestamps
- ObsidianSettings + ObsidianSync components
- Batch folder import via recursive `list_markdown_in_folder` Rust command
- TypeScript: 0 errors. cargo check: 0 errors.
- Pushed to GitHub

### Phase 4 — Reports + Polish ✅
- Installed jsPDF + html2canvas; react-is (missing recharts peer dep)
- FunnelChart, ScoreDistribution, HorizonBreakdown, TopIdeasTable
- ReportsDashboard composing all 4 charts with PDF export button
- ReportsPage wired to store
- `src/lib/pdf.ts` — jsPDF + html2canvas screenshot of #reports-dashboard
- OnboardingModal: first-run name capture + criteria review
- BackupSettings component + get_db_path, backup_db, restore_db Rust commands
- Settings page: Backup tab added
- TypeScript: 0 errors. cargo check: 0 errors.
- Pushed to GitHub

## Session: 2026-05-01 (Help + CI)
- Rewrote `public/help/innovation-pipeline.html` — full 11-section user guide covering team usage patterns, scoring model, pipeline stages, import format, Obsidian sync, reports, backup, FAQ
- Created `.github/workflows/build.yml` — builds macOS arm64 + x86_64 + Windows on push to main; universal macOS binary + draft GitHub Release on version tags
- Updated planning files (this session)
- Pushed to GitHub

---

## Current State (as of 2026-05-01)
- App starts and runs: `cd "Claude generated files/pipeline-app" && npm run tauri dev`
- All 4 phases complete
- GitHub: https://github.com/MichaelDuchateau/Idea_collector.git (branch: main)
- To release: `git tag v0.1.0 && git push origin v0.1.0` → CI builds installers

## Known Issues / Remaining Considerations
- App icon is the default Tauri icon — needs a custom icon for production
- macOS builds are unsigned without Apple Developer certificates (set APPLE_* secrets in GitHub repo for signed builds)
- Restore DB closes pool but needs app restart — could be improved with a re-init flow
- No Windows cross-compile from macOS — CI handles Windows builds via GitHub Actions

## Error Log
| Date | Error | Resolution |
|------|-------|------------|
| 2026-04-30 | User message interrupted — spec not received | Re-sent in next session |
| 2026-04-30 | `create-tauri-app` requires interactive terminal | `--yes` flag |
| 2026-04-30 | react-beautiful-dnd peer dep conflict | `--legacy-peer-deps` |
| 2026-04-30 | `tauri_plugin_sql::DbPool` wrong type for state | `pub struct AppDb(pub sqlx::SqlitePool)` |
| 2026-04-30 | `tauri::Manager` not in scope | `use tauri::Manager` in lib.rs |
| 2026-04-30 | Migration panic "incomplete input" | `sqlx::raw_sql()` for multi-statement SQL |
| 2026-04-30 | `plugins.fs` scope config unknown field | Removed plugins section from tauri.conf.json |
| 2026-04-30 | react-beautiful-dnd broken in StrictMode | Removed `<React.StrictMode>` from main.tsx |
| 2026-05-01 | recharts missing `react-is` peer dep | `npm install react-is --legacy-peer-deps` |
| 2026-05-01 | Port 1420 in use on second `tauri dev` | `lsof -ti :1420 \| xargs kill -9` |
