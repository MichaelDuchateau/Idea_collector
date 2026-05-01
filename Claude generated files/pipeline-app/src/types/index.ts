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
  weight:      number;
  sort_order:  number;
  active:      boolean;
}

export interface Score {
  id:           number;
  idea_id:      number;
  criterion_id: number;
  value:        number;
  notes:        string | null;
  scored_by:    string;
  scored_at:    string;
}

export interface ScoresByCriterion {
  criterion:             ScorecardCriterion;
  scores:                Score[];
  average:               number;
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

export interface ImportResult {
  imported: number;
  skipped:  number;
  updated:  number;
  errors:   string[];
}

export interface SyncResult {
  synced:  number;
  skipped: number;
  errors:  string[];
}

export interface ObsidianFile {
  path:     string;
  name:     string;
  modified: number;
}

export interface ConnectionResult {
  success: boolean;
  message: string;
}

export interface PdfExportOptions {
  include_scores:  boolean;
  include_charts:  boolean;
  stages:          IdeaStage[];
  min_score?:      number;
}
