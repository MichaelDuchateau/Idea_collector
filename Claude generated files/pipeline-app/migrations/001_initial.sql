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
  obsidian_path TEXT,
  meta          TEXT,
  created_at    DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at    DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ideas_stage  ON ideas(stage);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);

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
  scored_by    TEXT    NOT NULL,
  scored_at    DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scores_idea      ON scores(idea_id);
CREATE INDEX IF NOT EXISTS idx_scores_criterion ON scores(criterion_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_scores_unique
  ON scores(idea_id, criterion_id, scored_by);

-- -------------------------------------------------------
-- WEIGHTED SCORE VIEW
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
         AVG(value) AS avg_value
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
  detail      TEXT,
  actor       TEXT,
  created_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_log_idea ON activity_log(idea_id);

-- -------------------------------------------------------
-- APP SETTINGS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  updated_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('user_name',              'User'),
  ('score_threshold_green',  '75'),
  ('score_threshold_amber',  '50'),
  ('obsidian_enabled',       'false'),
  ('obsidian_api_url',       'http://localhost:27123'),
  ('obsidian_api_key',       ''),
  ('obsidian_vault_folder',  'Pipeline'),
  ('obsidian_sync_interval', '300');
