# Pipeline

A local-first desktop app for managing an innovation pipeline. Collect ideas, score them as a team, track them through stages, and report on your portfolio.

Built with **Tauri 2.0 · React 19 · TypeScript · SQLite**.

---

## Features

- **Ideas list** — filterable/sortable table with score band, stage, and status filters
- **Weighted scorecard** — configurable criteria with weights; multiple team members score independently and results are averaged
- **Kanban pipeline board** — drag ideas through Collection → Screening → Development → Gate → Build
- **Reports dashboard** — pipeline funnel, score distribution, horizon breakdown (H1/H2/H3), top 10 by score; one-click PDF export
- **Markdown import** — import single files, multiple files, or entire folders; YAML frontmatter parsed automatically
- **Obsidian integration** — one-way sync from a `/Pipeline/` folder in any Obsidian vault via the [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) community plugin
- **Activity log** — every stage change, score, and import recorded per idea
- **Backup / restore** — one-click database backup and restore

---

## Getting Started

### Prerequisites

| Tool | Install |
|------|---------|
| Rust (stable) | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Node.js 20+ | [nodejs.org](https://nodejs.org) |
| Xcode CLI (macOS) | `xcode-select --install` |
| WebView2 (Windows) | Pre-installed on Windows 10/11 |

### Run in development

```bash
cd "Claude generated files/pipeline-app"
npm install --legacy-peer-deps
npm run tauri dev
```

First launch takes 2–3 minutes while Rust compiles. Subsequent starts are fast.

### Build for production

```bash
npm run tauri build
```

Output:
- `src-tauri/target/release/bundle/dmg/*.dmg` — macOS
- `src-tauri/target/release/bundle/msi/*.msi` — Windows (MSI)
- `src-tauri/target/release/bundle/nsis/*.exe` — Windows (NSIS installer)

---

## Team Usage

Pipeline is local-first — each team member runs their own copy. There are three collaboration patterns:

### 1. Shared markdown folder
Store idea `.md` files in a shared folder (Dropbox, OneDrive, SharePoint). Each person imports from it periodically using **Import → Select folder**.

### 2. Shared Obsidian vault
Keep a shared Obsidian vault (via Obsidian Sync, iCloud, or [obsidian-git](https://github.com/denolehov/obsidian-git)). Ideas written in `/Pipeline/` are pulled into the app automatically. Configure in **Settings → Obsidian**.

### 3. Single pipeline owner
One person maintains the database; others score ideas by entering their own name in the scorer field. The database can be shared via **Settings → Backup**.

### Scorer names
Every score is tagged with a display name set in **Settings → General**. Names must match exactly across the team — agree on a convention (e.g. first name only) before you start scoring together.

---

## Markdown Frontmatter Format

```yaml
---
title: "My Idea"
stage: screening          # collection | screening | development | gate | build
status: active            # draft | active | parked | killed | launched
horizon: H2               # H1 | H2 | H3
category: Product
owner: Alex
tags: [mobile, ai]
created: 2024-03-15
---

Idea body text. Full **markdown** supported.
```

All fields are optional. If `title` is missing it is inferred from the first `# Heading` or the filename.

---

## CI / Releases

GitHub Actions builds macOS and Windows installers automatically.

| Trigger | Output |
|---------|--------|
| Push to `main` | Build check (no artefacts) |
| Push a `v*` tag | macOS arm64 `.dmg`, macOS x86 `.dmg`, macOS universal `.dmg`, Windows `.msi` + `.exe` → draft GitHub Release |

To cut a release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Builds take ~15 minutes. The draft release appears in the GitHub Releases page with all installers attached.

### Code signing (macOS)

Add these secrets to your GitHub repository for signed/notarised macOS builds:

| Secret | Value |
|--------|-------|
| `APPLE_CERTIFICATE` | Base64-encoded `.p12` certificate |
| `APPLE_CERTIFICATE_PASSWORD` | `.p12` password |
| `APPLE_SIGNING_IDENTITY` | e.g. `Developer ID Application: Your Name (TEAMID)` |
| `APPLE_ID` | Your Apple ID email |
| `APPLE_PASSWORD` | App-specific password |
| `APPLE_TEAM_ID` | Your Apple Developer Team ID |

---

## Project Structure

```
Claude generated files/pipeline-app/
├── src/                        # React frontend
│   ├── components/
│   │   ├── ideas/              # IdeasTable, IdeaDetail, IdeaEditor, ActivityLog
│   │   ├── pipeline/           # PipelineBoard, PipelineColumn, IdeaCard
│   │   ├── scoring/            # ScorecardPanel, ScoreBreakdown, ScoreBadge, CriterionSlider
│   │   ├── reports/            # ReportsDashboard, FunnelChart, ScoreDistribution, HorizonBreakdown, TopIdeasTable
│   │   ├── settings/           # ScorecardEditor, ThresholdEditor, ObsidianSettings, BackupSettings
│   │   ├── import/             # ImportModal, ImportPreview, ObsidianSync
│   │   └── layout/             # Layout, Sidebar, TopBar
│   ├── lib/                    # db.ts, markdown.ts, scoring.ts, obsidian.ts, pdf.ts
│   ├── pages/                  # IdeasPage, PipelinePage, ReportsPage, SettingsPage, HelpPage
│   ├── store/                  # appStore.ts (Zustand)
│   └── types/                  # index.ts
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs              # DB init, pool setup, command registrations
│   │   └── commands/           # ideas.rs, scores.rs, import.rs, obsidian.rs, export.rs, settings.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── migrations/
│   └── 001_initial.sql         # Full schema + seed data
└── public/
    └── help/
        └── innovation-pipeline.html   # In-app user guide
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri 2.0 |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v3 |
| State | Zustand |
| Routing | React Router v7 |
| Database | SQLite via sqlx 0.8 |
| Charts | Recharts |
| Markdown editor | CodeMirror 6 |
| Markdown parsing | gray-matter + marked |
| PDF export | jsPDF + html2canvas |
| Drag & drop | react-beautiful-dnd |
