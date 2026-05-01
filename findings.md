# Findings & Decisions — Pipeline App

## Requirements
- Desktop app (macOS + Windows) for managing an innovation pipeline
- App name: **Pipeline**
- Output directory: `Claude generated files/` inside project root
- Tech stack: Tauri 2.0, React 18, TypeScript, SQLite (tauri-plugin-sql), Tailwind CSS
- Markdown parsing: gray-matter (YAML frontmatter) + marked (body rendering)
- Charts: Recharts
- File dialogs: Tauri dialog plugin
- Data: Local SQLite only — no sync

**Phase 1 scope (per user):**
1. Initialize project with all dependencies (Section 1 of spec — NOT YET RECEIVED)
2. SQLite migration file per Section 3 (NOT YET RECEIVED)
3. DB init on app start + migrations
4. Tauri commands in `src-tauri/src/commands/ideas.rs`
5. Components: IdeasTable, IdeaDetail, IdeaEditor
6. Markdown import pipeline: ImportModal, ImportPreview, markdown.ts
7. Layout, Sidebar, basic routing

## From Handoff Note (pipeline-app-handoff.md)

### Database Tables
- **ideas** — title, description, raw_markdown, status, stage, category, owner, horizon, source_file, timestamps
- **scorecard_criteria** — name, description, weight, sort_order, active
- **scores** — idea_id, criterion_id, value (0–100), notes, scored_by, scored_at
- **tags + idea_tags** — many-to-many
- **activity_log** — idea_id, event_type, detail (JSON), actor, created_at
- Weighted score = computed SQL VIEW (not stored)

### Default Scorecard Criteria
| Criterion | Default Weight |
|---|---|
| Strategic Fit | 30% |
| Market Attractiveness | 25% |
| Technical Feasibility | 20% |
| Financial Potential | 15% |
| Resource Requirements | 10% |

### YAML Frontmatter Format
```yaml
---
title: "Idea Title Here"
category: "Digital / AI"
owner: "Person Name"
stage: "screening"      # collection | screening | development | gate | build
status: "active"        # draft | active | parked | killed | launched
horizon: "H1"           # H1 | H2 | H3
tags: ["tag1", "tag2"]
created: 2026-03-15
---
```

### Stages
- collection | screening | development | gate | build

### Statuses
- draft | active | parked | killed | launched

### Horizons
- H1 | H2 | H3

## BLOCKER — Missing Technical Spec
The user's message was interrupted before the technical spec (Sections 1–4) was provided. We need:
- **Section 1:** Exact dependency list (npm packages + cargo crates)
- **Section 2:** Exact file/folder structure
- **Section 3:** Full SQL DDL (CREATE TABLE statements with indexes and constraints)
- **Section 4:** TypeScript type definitions

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Tauri 2.0 | Cross-platform desktop, native performance |
| React 18 | Modern React with concurrent features |
| TypeScript strict | Type safety for complex data model |
| tauri-plugin-sql | Official Tauri SQLite plugin |
| gray-matter | Industry-standard YAML frontmatter parser |
| marked | Fast, well-maintained markdown renderer |
| Tailwind CSS | Utility-first, rapid UI development |
| Recharts | React-native charting, composable |

## Open Decisions (from handoff note)
1. In-app markdown editor (CodeMirror) vs import-only?
2. Single scorer vs multiple scorers averaged?
3. Export formats: CSV + .md minimum, or PDF/Excel too?

## Resources
- Handoff note: `Claude generated files/pipeline-app-handoff.md`
- Interactive explorer: `Claude generated files/innovation-pipeline.html`
- Full build plan: `Claude generated files/innovation-app-plan.html`

*Update this file after every 2 view/browser/search operations*
