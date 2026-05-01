# Task Plan: Pipeline Desktop App — Phase 1 Build

## Goal
Scaffold and build Phase 1 of the "Pipeline" Tauri 2.0 + React 18 + TypeScript desktop app in `Claude generated files/pipeline-app/` — covering project init, SQLite schema, ideas CRUD, markdown import, and basic UI layout.

## Current Phase
Phase 1 — COMPLETE ✅

## Phases

### Phase 0: Technical Spec Collection
- [x] Received complete technical spec (pipeline-app-claude-code-spec.md)
- **Status:** complete

### Phase 1: Project Initialization + Full Build
- [x] Created Tauri 2.0 + React 18 + TypeScript project in `Claude generated files/pipeline-app/`
- [x] Installed all npm dependencies (tauri plugins, CodeMirror, gray-matter, marked, Recharts, Zustand, React Router, Tailwind v3, axios, date-fns, react-beautiful-dnd)
- [x] Installed Rust 1.95 via rustup
- [x] Added sqlx, reqwest, tauri-plugin-sql/dialog/fs/shell to Cargo.toml
- [x] Tailwind CSS v3 configured (tailwind.config.js + postcss.config.js + styles.css)
- [x] Created exact file structure per Section 2
- [x] Created migrations/001_initial.sql with full DDL (all tables + view + triggers + seed data)
- [x] Implemented DB init in lib.rs (sqlx pool + migration runner)
- [x] Implemented src-tauri/src/commands/ideas.rs (all 8 commands)
- [x] Implemented src-tauri/src/commands/scores.rs (7 commands)
- [x] Implemented src-tauri/src/commands/import.rs (4 commands)
- [x] Implemented src-tauri/src/commands/obsidian.rs (4 commands)
- [x] Implemented src-tauri/src/commands/export.rs (stub)
- [x] Implemented src-tauri/src/commands/settings.rs (3 commands)
- [x] Created src/types/index.ts (exact Section 4 types)
- [x] Created src/lib/db.ts, markdown.ts, scoring.ts
- [x] Created src/store/appStore.ts (Zustand)
- [x] Built IdeasTable, IdeaDetail, IdeaEditor (CodeMirror) components
- [x] Built ImportModal + ImportPreview components
- [x] Built Layout, Sidebar, TopBar components
- [x] Created pages: IdeasPage, PipelinePage (stub), ReportsPage (stub), SettingsPage (stub), HelpPage
- [x] Wired React Router routing
- [x] Updated tauri.conf.json (productName: Pipeline, window size 1200×800)
- [x] TypeScript: zero errors
- [x] Rust (cargo check): zero errors, zero warnings
- **Status:** complete

### Phase 2: Scoring (next)
- [ ] Implement ScorecardPanel with sliders + notes
- [ ] Implement ScoreBreakdown (multi-scorer view)
- [ ] Build ScorecardEditor in Settings
- [ ] Build ThresholdEditor in Settings
- [ ] Add ScoreBadge to IdeaRow and IdeaCard
- [ ] Ranked sorting in IdeasTable
- **Status:** pending

### Phase 3: Pipeline + Obsidian (next)
- [ ] Build PipelineBoard with react-beautiful-dnd
- [ ] Build ObsidianSettings + ObsidianSync components
- [ ] Batch folder import
- **Status:** pending

### Phase 4: Reports + Polish
- [ ] ReportsDashboard with Recharts charts
- [ ] PDF export
- [ ] Embed innovation-pipeline.html as Help section
- [ ] Onboarding flow
- [ ] Backup/restore
- **Status:** pending

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Managed sqlx pool (not tauri-plugin-sql for Rust commands) | tauri-plugin-sql is a JS-side plugin; Rust commands need their own pool |
| Tailwind v3 + postcss | v4 incompatible with current Vite template |
| react-beautiful-dnd with --legacy-peer-deps | Doesn't officially support React 19 yet |
| Stub pages for Pipeline/Reports/Settings | Phase 1 scope only |
| Migration via statement splitting on ';' | SQLx doesn't support multi-statement execution |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| create-tauri-app not a terminal | 1 | Used --yes flag |
| react-beautiful-dnd peer dep conflict | 1 | --legacy-peer-deps |
| tailwindcss install conflict | 1 | Install with --legacy-peer-deps |
| tauri_plugin_sql::DbPool wrong type | 1 | Replaced with managed sqlx::SqlitePool |
| tauri::Manager trait not in scope | 1 | Added use tauri::Manager |
| Score unused import in db.ts | 1 | Removed from import list |

## Notes
- App runs from: `Claude generated files/pipeline-app/`
- Start dev: `npm run tauri dev` (from pipeline-app directory)
- Rust toolchain: 1.95.0 stable (aarch64-apple-darwin)
- Help page iframe: public/help/innovation-pipeline.html (copy innovation-pipeline.html there)
