# Innovation Pipeline App — Claude Code Technical Spec
_Version 1.0 — Ready for Claude Code execution_

---

## Project Overview

A cross-platform desktop application (macOS + Windows) built with Tauri 2.0 + React 18 + TypeScript + SQLite. Manages an innovation pipeline: collecting ideas, scoring them with a shared weighted scorecard (multiple scorers, averaged), tracking through pipeline stages, and reporting on the portfolio.

---

## All Decisions — Closed

| Decision | Answer |
|---|---|
| Platform | macOS + Windows |
| Users | Small team, 2–10 people |
| Data sharing | Local SQLite per user |
| Markdown source | Import file/folder + in-app simplified editor + Obsidian Local REST API |
| Obsidian connection | Local REST API (community plugin, localhost) |
| Obsidian idea discovery | Dedicated watched folder: `/Pipeline/` inside vault |
| Scoring | Multiple scorers — averaged with individual breakdown |
| Stage movement | Manual only |
| Score history | Full history retained |
| Export at launch | PDF report only |

---

## 1. Project Scaffold

### 1.1 Initialize

```bash
npm create tauri-app@latest pipeline-app -- --template react-ts
cd pipeline-app
npm install
```

### 1.2 Additional npm dependencies

```bash
npm install \
  @tauri-apps/plugin-sql \
  @tauri-apps/plugin-dialog \
  @tauri-apps/plugin-fs \
  @tauri-apps/plugin-shell \
  gray-matter \
  marked \
  recharts \
  @codemirror/view \
  @codemirror/state \
  @codemirror/lang-markdown \
  @codemirror/theme-one-dark \
  codemirror \
  tailwindcss \
  @tailwindcss/typography \
  axios \
  date-fns \
  zustand \
  react-beautiful-dnd \
  @types/react-beautiful-dnd
```

### 1.3 Cargo.toml additions (src-tauri/Cargo.toml)

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sqlx = { version = "0.7", features = ["sqlite", "runtime-tokio-native-tls"] }
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.11", features = ["json"] }
```

---

## 2. File & Folder Structure

```
pipeline-app/
├── src/                          # React frontend
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── Layout.tsx
│   │   ├── ideas/
│   │   │   ├── IdeasTable.tsx        # sortable/filterable list
│   │   │   ├── IdeaRow.tsx
│   │   │   ├── IdeaDetail.tsx        # full idea page
│   │   │   ├── IdeaEditor.tsx        # CodeMirror simplified editor
│   │   │   └── IdeaStatusBadge.tsx
│   │   ├── pipeline/
│   │   │   ├── PipelineBoard.tsx     # kanban board
│   │   │   ├── PipelineColumn.tsx
│   │   │   └── IdeaCard.tsx
│   │   ├── scoring/
│   │   │   ├── ScorecardPanel.tsx    # scoring UI for one idea
│   │   │   ├── CriterionSlider.tsx
│   │   │   ├── ScoreBreakdown.tsx    # multi-scorer breakdown
│   │   │   └── ScoreBadge.tsx        # colour-coded score pill
│   │   ├── reports/
│   │   │   ├── ReportsDashboard.tsx
│   │   │   ├── FunnelChart.tsx
│   │   │   ├── ScoreDistribution.tsx
│   │   │   ├── HorizonBreakdown.tsx
│   │   │   └── TopIdeasTable.tsx
│   │   ├── settings/
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── ScorecardEditor.tsx   # add/edit/reorder criteria
│   │   │   ├── ThresholdEditor.tsx
│   │   │   ├── ObsidianSettings.tsx  # API key + vault path config
│   │   │   └── UserSettings.tsx
│   │   ├── import/
│   │   │   ├── ImportModal.tsx       # file/folder picker
│   │   │   ├── ImportPreview.tsx     # confirm before inserting
│   │   │   └── ObsidianSync.tsx      # sync status + manual trigger
│   │   └── help/
│   │       └── HelpSection.tsx       # embeds innovation-pipeline.html
│   ├── hooks/
│   │   ├── useIdeas.ts
│   │   ├── useScores.ts
│   │   ├── useCriteria.ts
│   │   └── useObsidian.ts
│   ├── lib/
│   │   ├── db.ts                     # all SQL query functions
│   │   ├── markdown.ts               # gray-matter + marked helpers
│   │   ├── scoring.ts                # weighted score computation
│   │   ├── obsidian.ts               # Obsidian REST API client
│   │   └── pdf.ts                    # PDF export
│   ├── store/
│   │   └── appStore.ts               # Zustand global state
│   └── types/
│       └── index.ts                  # all shared TypeScript types
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── ideas.rs              # CRUD commands
│   │   │   ├── scores.rs             # scoring commands
│   │   │   ├── import.rs             # file import commands
│   │   │   ├── obsidian.rs           # Obsidian API proxy commands
│   │   │   └── export.rs             # PDF export command
│   │   └── db/
│   │       ├── mod.rs
│   │       └── migrations.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── migrations/
│   └── 001_initial.sql               # full schema (see Section 3)
└── public/
    └── help/
        └── innovation-pipeline.html  # copied from existing artifact
```

---

## 3. Database — Full SQL DDL

### File: `migrations/001_initial.sql`

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- -------------------------------------------------------
-- IDEAS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS ideas (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL,
  description   TEXT,
  raw_markdown  TEXT,
  status        TEXT    NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','active','parked','killed','launched')),
  stage         TEXT    NOT NULL DEFAULT 'collection'
                CHECK (stage IN ('collection','screening','development','gate','build')),
  category      TEXT,
  owner         TEXT,
  horizon       TEXT    CHECK (horizon IN ('H1','H2','H3') OR horizon IS NULL),
  source_file   TEXT,
  source_type   TEXT    DEFAULT 'manual'
                CHECK (source_type IN ('manual','import','obsidian')),
  obsidian_path TEXT,                          -- vault-relative path if from Obsidian
  meta          TEXT,                          -- JSON blob for unknown frontmatter fields
  created_at    DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at    DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ideas_stage  ON ideas(stage);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);

-- Auto-update updated_at
CREATE TRIGGER IF NOT EXISTS ideas_updated_at
  AFTER UPDATE ON ideas
  FOR EACH ROW
  BEGIN
    UPDATE ideas SET updated_at = datetime('now') WHERE id = OLD.id;
  END;

-- -------------------------------------------------------
-- SCORECARD CRITERIA
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS scorecard_criteria (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  description TEXT,
  weight      REAL    NOT NULL CHECK (weight >= 0 AND weight <= 1),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT 1
);

-- Seed default criteria
INSERT INTO scorecard_criteria (name, description, weight, sort_order) VALUES
  ('Strategic Fit',        'Alignment with organisational strategy and direction',    0.30, 1),
  ('Market Attractiveness','Market size, growth potential, competitive landscape',    0.25, 2),
  ('Technical Feasibility','Buildable with current or acquirable capabilities',       0.20, 3),
  ('Financial Potential',  'Revenue opportunity, cost savings, or ROI outlook',       0.15, 4),
  ('Resource Requirements','Effort, cost, and time required — lower score = lighter', 0.10, 5);

-- -------------------------------------------------------
-- SCORES
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS scores (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  idea_id      INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  criterion_id INTEGER NOT NULL REFERENCES scorecard_criteria(id) ON DELETE CASCADE,
  value        REAL    NOT NULL CHECK (value >= 0 AND value <= 100),
  notes        TEXT,
  scored_by    TEXT    NOT NULL,               -- display name, no auth required
  scored_at    DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scores_idea      ON scores(idea_id);
CREATE INDEX IF NOT EXISTS idx_scores_criterion ON scores(criterion_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_scores_unique
  ON scores(idea_id, criterion_id, scored_by); -- one score per person per criterion per idea

-- -------------------------------------------------------
-- WEIGHTED SCORE VIEW
-- Returns one row per idea with averaged weighted score
-- across all scorers
-- -------------------------------------------------------
CREATE VIEW IF NOT EXISTS idea_scores_summary AS
SELECT
  i.id                                          AS idea_id,
  i.title,
  i.stage,
  i.status,
  ROUND(
    SUM(avg_s.avg_value * c.weight), 1
  )                                             AS weighted_score,
  COUNT(DISTINCT avg_s.scored_by)               AS scorer_count
FROM ideas i
LEFT JOIN (
  SELECT idea_id, criterion_id, scored_by,
         AVG(value) AS avg_value              -- latest score if multiple entries
  FROM scores
  GROUP BY idea_id, criterion_id, scored_by
) avg_s ON avg_s.idea_id = i.id
LEFT JOIN scorecard_criteria c ON c.id = avg_s.criterion_id AND c.active = 1
GROUP BY i.id;

-- -------------------------------------------------------
-- TAGS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT    NOT NULL UNIQUE COLLATE NOCASE
);

CREATE TABLE IF NOT EXISTS idea_tags (
  idea_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (idea_id, tag_id)
);

-- -------------------------------------------------------
-- ACTIVITY LOG
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  idea_id     INTEGER REFERENCES ideas(id) ON DELETE SET NULL,
  event_type  TEXT    NOT NULL,
  -- event types: imported | created | updated | scored | stage_changed
  --              status_changed | killed | launched | obsidian_synced | exported
  detail      TEXT,                            -- JSON payload
  actor       TEXT,
  created_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_log_idea ON activity_log(idea_id);

-- -------------------------------------------------------
-- APP SETTINGS (key-value store)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  updated_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Seed default settings
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('user_name',              'User'),
  ('score_threshold_green',  '75'),
  ('score_threshold_amber',  '50'),
  ('obsidian_enabled',       'false'),
  ('obsidian_api_url',       'http://localhost:27123'),
  ('obsidian_api_key',       ''),
  ('obsidian_vault_folder',  'Pipeline'),
  ('obsidian_sync_interval', '300');           -- seconds, 0 = manual only
```

---

## 4. TypeScript Types

### File: `src/types/index.ts`

```typescript
export type IdeaStatus = 'draft' | 'active' | 'parked' | 'killed' | 'launched';
export type IdeaStage  = 'collection' | 'screening' | 'development' | 'gate' | 'build';
export type Horizon    = 'H1' | 'H2' | 'H3';
export type SourceType = 'manual' | 'import' | 'obsidian';

export interface Idea {
  id:            number;
  title:         string;
  description:   string | null;
  raw_markdown:  string | null;
  status:        IdeaStatus;
  stage:         IdeaStage;
  category:      string | null;
  owner:         string | null;
  horizon:       Horizon | null;
  source_file:   string | null;
  source_type:   SourceType;
  obsidian_path: string | null;
  meta:          Record<string, unknown> | null;
  created_at:    string;
  updated_at:    string;
  tags?:         string[];
  weighted_score?: number | null;
  scorer_count?:   number;
}

export interface ScorecardCriterion {
  id:          number;
  name:        string;
  description: string | null;
  weight:      number;          // 0.0–1.0
  sort_order:  number;
  active:      boolean;
}

export interface Score {
  id:           number;
  idea_id:      number;
  criterion_id: number;
  value:        number;         // 0–100
  notes:        string | null;
  scored_by:    string;
  scored_at:    string;
}

export interface ScoresByCriterion {
  criterion:    ScorecardCriterion;
  scores:       Score[];         // one per scorer
  average:      number;
  weighted_contribution: number;
}

export interface IdeaScoreSummary {
  idea_id:        number;
  title:          string;
  stage:          IdeaStage;
  status:         IdeaStatus;
  weighted_score: number | null;
  scorer_count:   number;
}

export interface ActivityLogEntry {
  id:         number;
  idea_id:    number | null;
  event_type: string;
  detail:     Record<string, unknown> | null;
  actor:      string | null;
  created_at: string;
}

export interface AppSettings {
  user_name:              string;
  score_threshold_green:  number;
  score_threshold_amber:  number;
  obsidian_enabled:       boolean;
  obsidian_api_url:       string;
  obsidian_api_key:       string;
  obsidian_vault_folder:  string;
  obsidian_sync_interval: number;
}

export interface ParsedMarkdownIdea {
  title:        string;
  category?:    string;
  owner?:       string;
  stage?:       IdeaStage;
  status?:      IdeaStatus;
  horizon?:     Horizon;
  tags?:        string[];
  created?:     string;
  body:         string;
  raw:          string;
  source_file:  string;
  extra_fields: Record<string, unknown>;
}

export type ScoreBand = 'green' | 'amber' | 'red' | 'unscored';
```

---

## 5. Tauri IPC Commands

### File: `src-tauri/src/commands/ideas.rs`

Expose these commands via `#[tauri::command]`:

```
get_ideas(stage?: string, status?: string, search?: string) -> Vec<IdeaRow>
get_idea(id: i64) -> IdeaDetail
create_idea(payload: CreateIdeaPayload) -> i64
update_idea(id: i64, payload: UpdateIdeaPayload) -> ()
delete_idea(id: i64) -> ()
move_idea_stage(id: i64, new_stage: string, actor: string) -> ()
get_pipeline_board() -> HashMap<Stage, Vec<IdeaCard>>
get_ideas_summary() -> Vec<IdeaScoreSummary>       -- uses idea_scores_summary view
```

### File: `src-tauri/src/commands/scores.rs`

```
get_scores_for_idea(idea_id: i64) -> Vec<ScoresByCriterion>
save_score(idea_id: i64, criterion_id: i64, value: f64, notes?: string, scored_by: string) -> ()
get_criteria() -> Vec<ScorecardCriterion>
save_criterion(payload: CriterionPayload) -> i64
update_criterion(id: i64, payload: CriterionPayload) -> ()
reorder_criteria(ordered_ids: Vec<i64>) -> ()
delete_criterion(id: i64) -> ()
```

### File: `src-tauri/src/commands/import.rs`

```
pick_import_files() -> Vec<String>          -- opens native file dialog, returns paths
pick_import_folder() -> String              -- opens native folder dialog
parse_markdown_files(paths: Vec<String>) -> Vec<ParsedMarkdownIdea>
import_ideas(ideas: Vec<ParsedMarkdownIdea>, actor: string) -> ImportResult
  -- ImportResult: { imported: i64, skipped: i64, updated: i64, errors: Vec<String> }
```

### File: `src-tauri/src/commands/obsidian.rs`

```
obsidian_test_connection(api_url: string, api_key: string) -> ConnectionResult
obsidian_list_pipeline_files(api_url: string, api_key: string, folder: string) -> Vec<ObsidianFile>
obsidian_get_file(api_url: string, api_key: string, path: string) -> String  -- raw markdown
obsidian_sync(actor: string) -> SyncResult
  -- SyncResult: { synced: i64, skipped: i64, errors: Vec<String> }
```

### File: `src-tauri/src/commands/export.rs`

```
export_pdf(output_path: string, options: PdfExportOptions) -> ()
  -- PdfExportOptions: { include_scores: bool, include_charts: bool,
  --                     stages: Vec<string>, min_score?: f64 }
```

### File: `src-tauri/src/commands/` — settings + activity

```
get_settings() -> AppSettings
save_setting(key: string, value: string) -> ()
get_activity_log(idea_id?: i64, limit?: i64) -> Vec<ActivityLogEntry>
```

---

## 6. Frontend — Component Props

### `<IdeasTable>`
```typescript
props: {
  ideas: IdeaScoreSummary[];
  onSelect: (id: number) => void;
  filters: { stage?: IdeaStage; status?: IdeaStatus; search?: string; band?: ScoreBand };
  onFilterChange: (filters) => void;
}
```

### `<PipelineBoard>`
```typescript
props: {
  board: Record<IdeaStage, IdeaCard[]>;
  onMoveCard: (id: number, fromStage: IdeaStage, toStage: IdeaStage) => void;
  onSelectCard: (id: number) => void;
  settings: Pick<AppSettings, 'score_threshold_green' | 'score_threshold_amber'>;
}
```

### `<IdeaDetail>`
```typescript
props: {
  idea: Idea;
  scoresByCriterion: ScoresByCriterion[];
  activityLog: ActivityLogEntry[];
  onSave: (updated: Partial<Idea>) => void;
  onStageChange: (stage: IdeaStage) => void;
  currentUser: string;
}
```

### `<ScorecardPanel>`
```typescript
props: {
  ideaId: number;
  criteria: ScorecardCriterion[];
  existingScores: ScoresByCriterion[];
  currentUser: string;
  thresholds: { green: number; amber: number };
  onScoreSaved: () => void;
}
```

### `<IdeaEditor>` (CodeMirror simplified)
```typescript
props: {
  initialValue: string;        // raw markdown
  onChange: (value: string) => void;
  onSave: () => void;
  readOnly?: boolean;
}
// Features: markdown syntax highlighting, frontmatter highlight,
// toolbar: Bold / Italic / Heading / Link / Save
// No full WYSIWYG — source markdown with live preview panel
```

### `<ReportsDashboard>`
```typescript
props: {
  summary: IdeaScoreSummary[];
  settings: AppSettings;
}
// Contains: FunnelChart, ScoreDistribution, HorizonBreakdown, TopIdeasTable
// All data derived from summary prop — no extra DB calls
```

### `<ObsidianSync>`
```typescript
props: {
  settings: AppSettings;
  onSyncComplete: (result: SyncResult) => void;
}
// Shows: connection status indicator, last synced timestamp,
//        manual sync button, list of files in Pipeline/ folder,
//        sync result summary
```

---

## 7. Obsidian Integration Detail

### How it works

1. User installs the **Local REST API** community plugin in Obsidian and generates an API key.
2. In app Settings → Obsidian, user enters: API URL (`http://localhost:27123`), API key, vault folder name (default: `Pipeline`).
3. App calls `obsidian_test_connection` to verify — shows green/red status.
4. On manual sync (or on interval if configured): app calls `obsidian_list_pipeline_files` to get all `.md` files in `/Pipeline/`, fetches each, parses frontmatter, upserts into `ideas` table with `source_type = 'obsidian'` and `obsidian_path` set.
5. Duplicate detection: match on `obsidian_path`. If already exists → compare `updated_at` and update if changed.
6. Ideas edited in-app with `source_type = 'obsidian'` show a banner: _"This idea was imported from Obsidian. Changes here will not sync back automatically."_

### Obsidian REST API endpoints used

```
GET  /vault/{folder}/          -- list files in folder
GET  /vault/{path}             -- get file content (raw markdown)
```

No write-back to Obsidian in Phase 1. One-way sync only (Obsidian → app).

---

## 8. Markdown Parsing Logic

### File: `src/lib/markdown.ts`

```typescript
import matter from 'gray-matter';
import { marked } from 'marked';

export function parseIdeaMarkdown(raw: string, sourceFile: string): ParsedMarkdownIdea {
  const { data, content } = matter(raw);

  const knownFields = ['title','category','owner','stage','status','horizon','tags','created'];
  const extra: Record<string, unknown> = {};
  for (const key of Object.keys(data)) {
    if (!knownFields.includes(key)) extra[key] = data[key];
  }

  return {
    title:        data.title        ?? inferTitleFromContent(content) ?? sourceFile,
    category:     data.category     ?? null,
    owner:        data.owner        ?? null,
    stage:        data.stage        ?? 'collection',
    status:       data.status       ?? 'draft',
    horizon:      data.horizon      ?? null,
    tags:         Array.isArray(data.tags) ? data.tags : [],
    created:      data.created      ?? null,
    body:         marked(content),  // rendered HTML for display
    raw,
    source_file:  sourceFile,
    extra_fields: extra,
  };
}

function inferTitleFromContent(content: string): string | null {
  const match = content.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : null;
}
```

---

## 9. Scoring Computation

### File: `src/lib/scoring.ts`

```typescript
export function computeWeightedScore(
  scoresByCriterion: ScoresByCriterion[]
): number | null {
  if (scoresByCriterion.length === 0) return null;
  const active = scoresByCriterion.filter(s => s.scores.length > 0);
  if (active.length === 0) return null;

  const totalWeight = active.reduce((sum, s) => sum + s.criterion.weight, 0);
  if (totalWeight === 0) return null;

  const raw = active.reduce((sum, s) => sum + s.average * s.criterion.weight, 0);
  return Math.round((raw / totalWeight) * 10) / 10;
}

export function getScoreBand(
  score: number | null,
  thresholds: { green: number; amber: number }
): ScoreBand {
  if (score === null) return 'unscored';
  if (score >= thresholds.green) return 'green';
  if (score >= thresholds.amber) return 'amber';
  return 'red';
}

export function getAverageForCriterion(scores: Score[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((sum, s) => sum + s.value, 0) / scores.length;
}
```

---

## 10. PDF Export

Use `@tauri-apps/plugin-shell` to invoke a headless Chromium print via the Tauri window, or generate via `jsPDF` + `html2canvas` on the frontend.

### PDF Report Contents (in order)

1. Cover: App name, export date, filter summary
2. Pipeline funnel chart (screenshot of Recharts component)
3. Ideas table sorted by weighted score descending — columns: Title, Stage, Score, Owner, Horizon
4. Per-idea score breakdown section (one page per idea, configurable)
5. Score distribution chart
6. Horizon breakdown pie

### Export trigger

```typescript
// Frontend generates an off-screen HTML report view, passes to Tauri print command
invoke('export_pdf', { output_path: selectedPath, options: exportOptions });
```

---

## 11. Build & Package

### Dev

```bash
npm run tauri dev
```

### Production build

```bash
npm run tauri build
# Outputs:
#   src-tauri/target/release/bundle/dmg/*.dmg        (macOS)
#   src-tauri/target/release/bundle/msi/*.msi        (Windows)
#   src-tauri/target/release/bundle/nsis/*.exe       (Windows installer)
```

### tauri.conf.json — key settings

```json
{
  "productName": "Pipeline",
  "version": "0.1.0",
  "bundle": {
    "identifier": "com.yourorg.pipeline",
    "icon": ["icons/icon.png"],
    "targets": ["dmg", "msi", "nsis"]
  },
  "plugins": {
    "sql": {},
    "dialog": {},
    "fs": {
      "scope": ["$APPDATA/*", "$HOME/*"]
    }
  }
}
```

---

## 12. Phase Checklist for Claude Code

### Phase 1 — Foundation
- [ ] Initialize Tauri + React + TypeScript project
- [ ] Install all dependencies
- [ ] Create `migrations/001_initial.sql` (exact DDL from Section 3)
- [ ] Initialize SQLite on app start, run migrations
- [ ] Implement all `ideas.rs` commands
- [ ] Implement `src/lib/db.ts` wrappers
- [ ] Build `<IdeasTable>` with sort + filter
- [ ] Build `<IdeaDetail>` (read-only first)
- [ ] Build `<IdeaEditor>` with CodeMirror
- [ ] Implement `import.rs` commands
- [ ] Build `<ImportModal>` + `<ImportPreview>`
- [ ] Implement `src/lib/markdown.ts` parser
- [ ] Basic `<Layout>` + `<Sidebar>` + routing

### Phase 2 — Scoring
- [ ] Implement `scores.rs` commands
- [ ] Build `<ScorecardPanel>` with sliders + notes
- [ ] Build `<ScoreBreakdown>` (multi-scorer view)
- [ ] Build `<ScorecardEditor>` in Settings
- [ ] Build `<ThresholdEditor>` in Settings
- [ ] Add `<ScoreBadge>` to `<IdeaRow>` and `<IdeaCard>`
- [ ] Implement `src/lib/scoring.ts`
- [ ] Ranked sorting in `<IdeasTable>`

### Phase 3 — Pipeline + Obsidian
- [ ] Build `<PipelineBoard>` with react-beautiful-dnd
- [ ] Implement `move_idea_stage` command + activity log
- [ ] Build `<ActivityLog>` component
- [ ] Implement `obsidian.rs` commands
- [ ] Build `<ObsidianSettings>` + `<ObsidianSync>`
- [ ] Implement `src/lib/obsidian.ts` REST client
- [ ] Batch folder import

### Phase 4 — Reports + Polish
- [ ] Build `<ReportsDashboard>` with all four charts
- [ ] Implement PDF export
- [ ] Embed `innovation-pipeline.html` as Help section
- [ ] Onboarding flow (first-run: set name, review default criteria)
- [ ] Database backup/restore (copy SQLite file via dialog)
- [ ] Production build + test on both platforms

---

## 13. Prompt to Start Claude Code

Paste this into Claude Code to begin Phase 1:

```
Build a Tauri 2.0 + React 18 + TypeScript desktop application called "Pipeline" 
for managing an innovation pipeline. Use the technical spec below exactly.

Start with Phase 1 only:
1. Initialize the project with all dependencies from Section 1
2. Create the SQLite migration file exactly as specified in Section 3
3. Initialize the database on app start and run migrations
4. Implement the Tauri commands in src-tauri/src/commands/ideas.rs
5. Build the IdeasTable, IdeaDetail, and IdeaEditor components
6. Implement the markdown import pipeline (ImportModal, ImportPreview, markdown.ts)
7. Create the Layout, Sidebar, and basic routing

File structure must match Section 2 exactly.
TypeScript types must match Section 4 exactly.
Do not begin Phase 2 work until Phase 1 is complete and compiles cleanly.

[paste this entire spec document below this line]
```
