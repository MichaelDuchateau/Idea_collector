# Task Plan: Pipeline Desktop App

## Goal
Build a Tauri 2.0 + React + TypeScript desktop app called "Pipeline" for managing an innovation pipeline — collecting, scoring, tracking, and reporting on ideas. Output lives in `Claude generated files/pipeline-app/`.

## Current Status
**ALL PHASES COMPLETE ✅** — app builds and runs (`npm run tauri dev`).

---

## Phase 1 — Foundation ✅ COMPLETE
- [x] Tauri 2.0 + React 19 + TypeScript scaffold
- [x] npm dependencies: CodeMirror, gray-matter, marked, Recharts, Zustand, React Router v7, Tailwind v3, date-fns, react-beautiful-dnd, jsPDF, html2canvas, react-is
- [x] Cargo deps: sqlx 0.8, reqwest 0.12, tauri-plugin-dialog/fs/shell
- [x] `migrations/001_initial.sql` — full DDL: ideas, scorecard_criteria, scores, idea_scores_summary VIEW, tags, idea_tags, activity_log, settings (seeded)
- [x] DB init in `lib.rs` — sqlx::SqlitePool managed state, `sqlx::raw_sql()` migration runner
- [x] All 8 commands in `ideas.rs`
- [x] `src/types/index.ts`, `src/lib/db.ts`, `src/lib/markdown.ts`, `src/lib/scoring.ts`
- [x] `src/store/appStore.ts` (Zustand)
- [x] IdeasTable (sort + filter), IdeaDetail, IdeaEditor (CodeMirror), IdeaStatusBadge
- [x] ImportModal, ImportPreview
- [x] Layout, Sidebar, TopBar, routing (5 routes)

## Phase 2 — Scoring ✅ COMPLETE
- [x] 7 commands in `scores.rs`
- [x] ScorecardPanel (sliders + notes + live weighted preview)
- [x] ScoreBreakdown (per-criterion bars, individual scorer values)
- [x] ScoreBadge (colour-coded pill — green/amber/red/unscored)
- [x] ScorecardEditor (add/toggle/delete criteria, weight display)
- [x] ThresholdEditor (green + amber sliders with validation)
- [x] Ranked sorting in IdeasTable

## Phase 3 — Pipeline + Obsidian ✅ COMPLETE
- [x] PipelineBoard with react-beautiful-dnd (optimistic drag updates)
- [x] PipelineColumn, IdeaCard
- [x] ActivityLog component (event icons, formatDistanceToNow)
- [x] `obsidian.rs` commands (test_connection, list_pipeline_files, get_file, sync)
- [x] ObsidianSettings, ObsidianSync components
- [x] `src/lib/obsidian.ts`
- [x] Batch folder import (`list_markdown_in_folder` — recursive)

## Phase 4 — Reports + Polish ✅ COMPLETE
- [x] FunnelChart (horizontal BarChart, stages on Y-axis)
- [x] ScoreDistribution (6 score buckets, threshold reference lines)
- [x] HorizonBreakdown (PieChart H1/H2/H3)
- [x] TopIdeasTable (top N by weighted score, clickable rows)
- [x] ReportsDashboard (composes all 4 charts + PDF export button)
- [x] ReportsPage wired up
- [x] `src/lib/pdf.ts` — jsPDF + html2canvas screenshot export
- [x] OnboardingModal (first-run name capture + criteria review; triggers when user_name == 'User')
- [x] BackupSettings component (backup DB, restore DB, show DB path)
- [x] `settings.rs` — added get_db_path, backup_db, restore_db Rust commands
- [x] Settings page — Backup tab added
- [x] `public/help/innovation-pipeline.html` — full user guide (team patterns, scoring, import, FAQ)
- [x] `.github/workflows/build.yml` — CI: macOS arm64 + x86_64 + Windows + universal macOS on tags

---

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Managed `sqlx::SqlitePool` (not tauri-plugin-sql for Rust commands) | tauri-plugin-sql exposes a JS-side plugin; Rust commands need their own pool |
| `sqlx::raw_sql()` for migrations | Naive `;` splitter broke on `BEGIN...END` trigger body |
| React 19 (scaffold defaulted, not 18) | create-tauri-app defaulted; no functional difference |
| Tailwind v3 + postcss (not v4) | v4 incompatible with current Vite template |
| react-beautiful-dnd `--legacy-peer-deps` | Doesn't officially support React 19 |
| Removed React.StrictMode | react-beautiful-dnd broken in StrictMode with React 18/19 |
| `user_name === 'User'` as first-run signal | Simpler than a separate `onboarding_done` setting key |
| jsPDF + html2canvas for PDF | Frontend-only; no native print command needed |

## Errors Encountered & Fixed
| Error | Resolution |
|-------|------------|
| `create-tauri-app` requires interactive terminal | Used `--yes` flag |
| react-beautiful-dnd peer dep conflict | `--legacy-peer-deps` |
| `tauri_plugin_sql::DbPool` invalid for managed state | Replaced with `pub struct AppDb(pub sqlx::SqlitePool)` |
| `tauri::Manager` trait not in scope | Added `use tauri::Manager` to `lib.rs` |
| Migration panic "incomplete input" | Replaced statement splitter with `sqlx::raw_sql()` |
| `plugins.fs` scope config unknown field | Removed entire `plugins` section from tauri.conf.json |
| react-beautiful-dnd broken in StrictMode | Removed `<React.StrictMode>` from main.tsx |
| Recharts `react-is` peer dep missing | `npm install react-is --legacy-peer-deps` |
| Port 1420 in use on `tauri dev` | `lsof -ti :1420 | xargs kill -9` |

## Notes
- App dir: `Claude generated files/pipeline-app/`
- Start: `npm run tauri dev` (from pipeline-app dir)
- Rust toolchain: stable (aarch64-apple-darwin)
- GitHub repo: https://github.com/MichaelDuchateau/Idea_collector.git
- CI: push tag `v0.1.0` → GitHub Actions builds dmg + msi + exe, creates draft Release
