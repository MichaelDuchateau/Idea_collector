import { invoke } from '@tauri-apps/api/core';
import type {
  Idea, IdeaScoreSummary, ScorecardCriterion, ScoresByCriterion,
  ActivityLogEntry, AppSettings, ParsedMarkdownIdea, ImportResult,
  ObsidianFile, ConnectionResult, SyncResult,
} from '../types';

// ── Ideas ────────────────────────────────────────────────────────────────────

export const getIdeas = (filters?: { stage?: string; status?: string; search?: string }) =>
  invoke<IdeaScoreSummary[]>('get_ideas', filters ?? {});

export const getIdea = (id: number) =>
  invoke<Idea>('get_idea', { id });

export const createIdea = (payload: Partial<Idea> & { title: string }) =>
  invoke<number>('create_idea', { payload });

export const updateIdea = (id: number, payload: Partial<Idea>) =>
  invoke<void>('update_idea', { id, payload });

export const deleteIdea = (id: number) =>
  invoke<void>('delete_idea', { id });

export const moveIdeaStage = (id: number, newStage: string, actor: string) =>
  invoke<void>('move_idea_stage', { id, newStage, actor });

export const getPipelineBoard = () =>
  invoke<Record<string, IdeaScoreSummary[]>>('get_pipeline_board');

export const getIdeasSummary = () =>
  invoke<IdeaScoreSummary[]>('get_ideas_summary');

// ── Scores ───────────────────────────────────────────────────────────────────

export const getCriteria = () =>
  invoke<ScorecardCriterion[]>('get_criteria');

export const getScoresForIdea = (ideaId: number) =>
  invoke<ScoresByCriterion[]>('get_scores_for_idea', { ideaId });

export const saveScore = (ideaId: number, criterionId: number, value: number, notes: string | null, scoredBy: string) =>
  invoke<void>('save_score', { ideaId, criterionId, value, notes, scoredBy });

export const saveCriterion = (payload: Omit<ScorecardCriterion, 'id'>) =>
  invoke<number>('save_criterion', { payload });

export const updateCriterion = (id: number, payload: Omit<ScorecardCriterion, 'id'>) =>
  invoke<void>('update_criterion', { id, payload });

export const reorderCriteria = (orderedIds: number[]) =>
  invoke<void>('reorder_criteria', { orderedIds });

export const deleteCriterion = (id: number) =>
  invoke<void>('delete_criterion', { id });

// ── Import ───────────────────────────────────────────────────────────────────

export const pickImportFiles = () =>
  invoke<string[]>('pick_import_files');

export const pickImportFolder = () =>
  invoke<string | null>('pick_import_folder');

export const listMarkdownInFolder = (folder: string) =>
  invoke<string[]>('list_markdown_in_folder', { folder });

export const parseMarkdownFiles = (paths: string[]) =>
  invoke<ParsedMarkdownIdea[]>('parse_markdown_files', { paths });

export const importIdeas = (ideas: ParsedMarkdownIdea[], actor: string) =>
  invoke<ImportResult>('import_ideas', { ideas, actor });

// ── Obsidian ─────────────────────────────────────────────────────────────────

export const obsidianTestConnection = (apiUrl: string, apiKey: string) =>
  invoke<ConnectionResult>('obsidian_test_connection', { apiUrl, apiKey });

export const obsidianListPipelineFiles = (apiUrl: string, apiKey: string, folder: string) =>
  invoke<ObsidianFile[]>('obsidian_list_pipeline_files', { apiUrl, apiKey, folder });

export const obsidianSync = (actor: string) =>
  invoke<SyncResult>('obsidian_sync', { actor });

// ── Settings ─────────────────────────────────────────────────────────────────

export const getSettings = () =>
  invoke<AppSettings>('get_settings');

export const saveSetting = (key: string, value: string) =>
  invoke<void>('save_setting', { key, value });

export const getActivityLog = (ideaId?: number, limit?: number) =>
  invoke<ActivityLogEntry[]>('get_activity_log', { ideaId, limit });

export const getDbPath = () =>
  invoke<string>('get_db_path');

export const backupDb = (dest: string) =>
  invoke<void>('backup_db', { dest });

export const restoreDb = (src: string) =>
  invoke<void>('restore_db', { src });
