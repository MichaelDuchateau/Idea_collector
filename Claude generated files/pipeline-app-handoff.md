# Innovation Pipeline App — Handoff Note
_Last updated: April 2026_

---

## What We're Building

A **cross-platform desktop application** (macOS + Windows) for managing an innovation pipeline — collecting ideas, scoring them with a weighted scorecard, tracking them through pipeline stages, and reporting on the portfolio.

---

## Agreed Decisions

| Topic | Decision |
|---|---|
| Platform | macOS + Windows desktop app |
| Users | Small team, 2–10 people |
| Data sharing | Local only — each person has their own SQLite database file |
| Tech stack | **Tauri 2.0 + React 18 + TypeScript + SQLite** |
| Styling | Tailwind CSS |
| Markdown parsing | gray-matter (YAML frontmatter) + marked (body rendering) |
| Charts | Recharts |
| Scoring model | One shared scorecard template for all ideas |
| Stage movement | Manual only — score is a recommendation, not automation |
| Score history | Keep full history (every score entry timestamped) |

---

## Tech Stack (Full)

| Layer | Technology |
|---|---|
| App shell | Tauri 2.0 |
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite via tauri-plugin-sql |
| Markdown | gray-matter + marked |
| Charts | Recharts |
| File dialogs | Tauri dialog plugin |
| Packaging | Tauri bundler → .dmg (Mac) + .msi/.exe (Windows) |

---

## Database Tables (Designed, Not Yet as DDL)

- **ideas** — title, description, raw_markdown, status, stage, category, owner, horizon, source_file, timestamps
- **scorecard_criteria** — name, description, weight, sort_order, active
- **scores** — idea_id, criterion_id, value (0–100), notes, scored_by, scored_at
- **tags + idea_tags** — many-to-many tag vocabulary
- **activity_log** — idea_id, event_type, detail (JSON), actor, created_at

Weighted score is a **computed SQL view** (not stored) — recalculates live from scores × criteria.weight.

---

## Default Scorecard Criteria

| Criterion | Default Weight |
|---|---|
| Strategic Fit | 30% |
| Market Attractiveness | 25% |
| Technical Feasibility | 20% |
| Financial Potential | 15% |
| Resource Requirements | 10% |

Criteria are fully configurable in Settings. Weights auto-normalise to 100%.

---

## Core Views Planned

1. **Ideas List** — sortable/filterable table, score bands, quick filters
2. **Pipeline Board** — Kanban columns per stage, drag-and-drop, score badges
3. **Idea Detail** — rendered markdown, metadata, scoring panel, activity log
4. **Reports Dashboard** — funnel chart, score distribution, horizon breakdown, top-10
5. **Settings** — scorecard editor, thresholds, backup/restore, help section

The **help section** in Settings uses the interactive Innovation Pipeline Explorer already built (innovation-pipeline.html).

---

## YAML Frontmatter Format (for .md imports)

```yaml
---
title: "Idea Title Here"
category: "Digital / AI"
owner: "Person Name"
stage: "screening"           # collection | screening | development | gate | build
status: "active"             # draft | active | parked | killed | launched
horizon: "H1"                # H1 | H2 | H3
tags: ["tag1", "tag2"]
created: 2026-03-15
---

## Problem
Description of the problem...

## Proposed Solution
Description of the solution...
```

---

## Build Phases

| Phase | Focus | Outcome |
|---|---|---|
| 1 | Foundation | Tauri scaffold, SQLite schema, ideas CRUD, markdown import |
| 2 | Scoring | Criteria settings, scoring UI, weighted score, ranked list |
| 3 | Pipeline Views | Kanban board, drag-and-drop, idea detail, batch import |
| 4 | Reports + Polish | Charts dashboard, help section, packaging, onboarding |

---

## ⚠️ Open Decisions — Must Resolve Before Claude Code

These three questions are **blockers** for producing the Claude Code-ready technical spec:

### 1. In-app markdown editor, or import-only?
- **Import-only** — simpler, faster to build. Users write .md files in any editor and import them. Good if your team already uses markdown tools.
- **In-app editor** (e.g. CodeMirror) — keeps everything inside the app. More scope to build but better self-contained experience.

### 2. Single scorer, or multiple scorers averaged?
- **Single scorer** — one person scores each idea. Simpler UI, no conflict resolution needed.
- **Multiple scorers averaged** — each team member scores independently, app shows average + individual breakdown. Better for team alignment. Schema already supports this.

### 3. Export formats at launch?
- **Minimum:** CSV export + back to .md (round-trip)
- **Extended:** PDF report, Excel — add in Phase 4 or later?

---

## What's Needed Next (in order)

1. **Answer the three open decisions above**
2. **Produce the Claude Code-ready technical spec** containing:
   - Exact file/folder structure
   - Full SQL DDL (`CREATE TABLE` statements with indexes and constraints)
   - Tauri IPC command signatures (`get_ideas`, `import_markdown`, `save_score`, etc.)
   - React component tree with props
3. **Hand spec to Claude Code** to scaffold Phase 1

---

## Reference Artifacts

| File | Purpose |
|---|---|
| `innovation-pipeline.html` | Interactive explorer — becomes the in-app help section |
| `innovation-app-plan.html` | Full human-readable build plan with stack, schema, and phases |
| `pipeline-app-handoff.md` | This file |

---

## Resuming in a New Claude Session

Paste this note and say:

> "I'm resuming work on an innovation pipeline desktop app. Here's the handoff note with everything decided so far. The next step is to close the three open decisions and then produce the Claude Code-ready technical spec."
