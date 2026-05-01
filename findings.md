# Findings & Decisions — Pipeline App

## Project Summary
Desktop app (macOS + Windows) for managing an innovation pipeline. Local-first — SQLite per user, no server. Team collaboration via shared markdown files, shared Obsidian vault, or manual score entry.

- **App name:** Pipeline
- **Output dir:** `Claude generated files/pipeline-app/`
- **Stack:** Tauri 2.0, React 19, TypeScript, SQLite (sqlx), Tailwind v3, Zustand, React Router v7
- **GitHub:** https://github.com/MichaelDuchateau/Idea_collector.git

---

## Database Schema

| Table | Key columns |
|-------|-------------|
| `ideas` | id, title, description, raw_markdown, status, stage, category, owner, horizon, source_file, source_type, obsidian_path, meta (JSON), timestamps |
| `scorecard_criteria` | id, name, description, weight (0–1), sort_order, active |
| `scores` | idea_id, criterion_id, value (0–100), notes, scored_by, scored_at — UNIQUE(idea_id, criterion_id, scored_by) |
| `tags` + `idea_tags` | many-to-many |
| `activity_log` | idea_id, event_type, detail (JSON), actor, created_at |
| `settings` | key-value store |
| `idea_scores_summary` | VIEW — weighted average across scorers |

### Default Scorecard Criteria (seeded)
| Criterion | Weight |
|---|---|
| Strategic Fit | 0.30 |
| Market Attractiveness | 0.25 |
| Technical Feasibility | 0.20 |
| Financial Potential | 0.15 |
| Resource Requirements | 0.10 |

### YAML Frontmatter Format (import)
```yaml
---
title: "Idea Title"
category: "Digital / AI"
owner: "Person Name"
stage: "screening"      # collection | screening | development | gate | build
status: "active"        # draft | active | parked | killed | launched
horizon: "H1"           # H1 | H2 | H3
tags: ["tag1", "tag2"]
created: 2026-03-15
---
```

---

## Architecture Decisions

### Rust / Tauri
- `pub struct AppDb(pub sqlx::SqlitePool)` managed as Tauri state — NOT `tauri-plugin-sql` (that's JS-only)
- `sqlx::raw_sql(sql).execute(pool)` for migrations — handles `BEGIN...END` triggers that break naive `;` splitting
- `use tauri::Manager` required in `lib.rs` for `app.path()` and `app.manage()`
- `sqlx::FromRow` derived on all query result structs
- Commands use `tauri::State<'_, AppDb>` and `&db.0` for pool access

### Frontend
- No `<React.StrictMode>` — react-beautiful-dnd breaks in StrictMode with React 18/19
- Zustand store (`useAppStore`) holds `settings`, `ideas`, `filters`, `selectedIdeaId`
- `user_name === 'User'` (the seeded default) signals first run → shows OnboardingModal
- PDF export: jsPDF + html2canvas screenshots `#reports-dashboard` div

### Collaboration Model
Three patterns (no real-time sync):
1. Shared folder of `.md` files → periodic import
2. Shared Obsidian vault (`/Pipeline/` folder) → one-way sync via Local REST API plugin
3. Single "pipeline owner" database; colleagues score via name field

---

## Key Files

| File | Purpose |
|------|---------|
| `src-tauri/src/lib.rs` | DB init, pool setup, all command registrations |
| `src-tauri/src/commands/ideas.rs` | 8 idea CRUD + board commands |
| `src-tauri/src/commands/scores.rs` | 7 scoring commands |
| `src-tauri/src/commands/import.rs` | 5 import commands incl. recursive folder scan |
| `src-tauri/src/commands/obsidian.rs` | 4 Obsidian REST API proxy commands |
| `src-tauri/src/commands/settings.rs` | get_settings, save_setting, get_activity_log, get_db_path, backup_db, restore_db |
| `src/types/index.ts` | All shared TS types |
| `src/lib/db.ts` | All `invoke()` wrappers |
| `src/lib/markdown.ts` | gray-matter + marked parser |
| `src/lib/scoring.ts` | computeWeightedScore, getScoreBand, SCORE_BAND_COLORS |
| `src/lib/pdf.ts` | exportDashboardPdf via jsPDF + html2canvas |
| `src/store/appStore.ts` | Zustand global state |
| `migrations/001_initial.sql` | Full DDL + seed data |
| `public/help/innovation-pipeline.html` | In-app user guide (rendered in iframe on Help page) |
| `.github/workflows/build.yml` | CI: macOS arm64/x86 + Windows + universal binary on tags |

---

## Gotchas to Remember
- `react-is` must be installed manually (`npm install react-is --legacy-peer-deps`) — recharts peer dep not auto-resolved
- Tailwind v3 only (v4 incompatible with current Vite setup)
- `--legacy-peer-deps` needed for react-beautiful-dnd, react-is, tailwindcss installs
- Kill port 1420 before running `tauri dev` if Vite is already running: `lsof -ti :1420 | xargs kill -9`
- Restore DB closes the pool but requires app restart to reconnect
