import { create } from 'zustand';
import type { AppSettings, IdeaScoreSummary, IdeaStage, IdeaStatus, ScoreBand } from '../types';
import { getSettings, getIdeasSummary } from '../lib/db';

interface Filters {
  stage?:  IdeaStage;
  status?: IdeaStatus;
  search?: string;
  band?:   ScoreBand;
}

interface AppState {
  settings:      AppSettings | null;
  ideas:         IdeaScoreSummary[];
  filters:       Filters;
  selectedIdeaId: number | null;

  loadSettings:  () => Promise<void>;
  loadIdeas:     () => Promise<void>;
  setFilters:    (f: Partial<Filters>) => void;
  selectIdea:    (id: number | null) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  user_name:              'User',
  score_threshold_green:  75,
  score_threshold_amber:  50,
  obsidian_enabled:       false,
  obsidian_api_url:       'http://localhost:27123',
  obsidian_api_key:       '',
  obsidian_vault_folder:  'Pipeline',
  obsidian_sync_interval: 300,
};

export const useAppStore = create<AppState>((set) => ({
  settings:       null,
  ideas:          [],
  filters:        {},
  selectedIdeaId: null,

  loadSettings: async () => {
    try {
      const settings = await getSettings();
      set({ settings });
    } catch {
      set({ settings: DEFAULT_SETTINGS });
    }
  },

  loadIdeas: async () => {
    try {
      const ideas = await getIdeasSummary();
      set({ ideas });
    } catch (e) {
      console.error('Failed to load ideas', e);
    }
  },

  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  selectIdea: (id) => set({ selectedIdeaId: id }),
}));
