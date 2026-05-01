import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import IdeasTable from '../components/ideas/IdeasTable';
import IdeaDetail from '../components/ideas/IdeaDetail';
import type { IdeaStage, IdeaStatus, ScoreBand } from '../types';

interface Filters {
  stage?:  IdeaStage;
  status?: IdeaStatus;
  search?: string;
  band?:   ScoreBand;
}

export default function IdeasPage() {
  const { ideas, loadIdeas, settings } = useAppStore();
  const [selectedId, setSelectedId]   = useState<number | null>(null);
  const [filters, setFilters]         = useState<Filters>({});

  const thresholds = {
    score_threshold_green: settings?.score_threshold_green ?? 75,
    score_threshold_amber: settings?.score_threshold_amber ?? 50,
  };

  if (selectedId != null) {
    return (
      <IdeaDetail
        ideaId={selectedId}
        onBack={() => setSelectedId(null)}
        onSaved={loadIdeas}
        currentUser={settings?.user_name ?? 'User'}
        settings={thresholds}
      />
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Ideas</h1>
      <IdeasTable
        ideas={ideas}
        onSelect={setSelectedId}
        filters={filters}
        onFilterChange={setFilters}
        settings={thresholds}
      />
    </div>
  );
}
