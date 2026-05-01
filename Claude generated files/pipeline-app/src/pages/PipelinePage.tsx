import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IdeaScoreSummary, IdeaStage } from '../types';
import { getPipelineBoard, moveIdeaStage } from '../lib/db';
import { useAppStore } from '../store/appStore';
import PipelineBoard from '../components/pipeline/PipelineBoard';

export default function PipelinePage() {
  const navigate   = useNavigate();
  const { settings, loadIdeas } = useAppStore();
  const [board, setBoard] = useState<Record<IdeaStage, IdeaScoreSummary[]> | null>(null);
  const [loading, setLoading] = useState(true);

  const thresholds = {
    score_threshold_green: settings?.score_threshold_green ?? 75,
    score_threshold_amber: settings?.score_threshold_amber ?? 50,
  };

  const loadBoard = useCallback(async () => {
    setLoading(true);
    const data = await getPipelineBoard();
    setBoard(data as Record<IdeaStage, IdeaScoreSummary[]>);
    setLoading(false);
  }, []);

  useEffect(() => { loadBoard(); }, [loadBoard]);

  const handleMove = async (id: number, _from: IdeaStage, to: IdeaStage) => {
    const actor = settings?.user_name ?? 'User';
    // Optimistic update
    setBoard(prev => {
      if (!prev) return prev;
      const next = { ...prev } as Record<IdeaStage, IdeaScoreSummary[]>;
      let moved: IdeaScoreSummary | undefined;
      for (const stage of Object.keys(next) as IdeaStage[]) {
        const idx = next[stage].findIndex(i => i.idea_id === id);
        if (idx !== -1) { [moved] = next[stage].splice(idx, 1); break; }
      }
      if (moved) next[to] = [...next[to], { ...moved, stage: to }];
      return next;
    });
    await moveIdeaStage(id, to, actor);
    loadIdeas();
  };

  const handleSelect = (id: number) => {
    // Navigate to ideas page with the idea selected
    navigate('/', { state: { selectId: id } });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading board…</div>;
  }

  if (!board) return null;

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-xl font-semibold text-gray-900">Pipeline Board</h1>
        <button onClick={loadBoard}
          className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded px-2 py-1"
        >
          ↻ Refresh
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <PipelineBoard
          board={board}
          onMoveCard={handleMove}
          onSelectCard={handleSelect}
          settings={thresholds}
        />
      </div>
    </div>
  );
}
