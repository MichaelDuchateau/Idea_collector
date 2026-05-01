import { Draggable } from 'react-beautiful-dnd';
import type { IdeaScoreSummary, AppSettings } from '../../types';
import ScoreBadge from '../scoring/ScoreBadge';

interface Props {
  idea:      IdeaScoreSummary;
  index:     number;
  onSelect:  (id: number) => void;
  settings:  Pick<AppSettings, 'score_threshold_green' | 'score_threshold_amber'>;
}

export default function IdeaCard({ idea, index, onSelect, settings }: Props) {
  return (
    <Draggable draggableId={String(idea.idea_id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onSelect(idea.idea_id)}
          className={`bg-white rounded-lg border p-3 cursor-pointer select-none transition-shadow ${
            snapshot.isDragging
              ? 'shadow-lg border-indigo-300 rotate-1'
              : 'border-gray-200 hover:border-indigo-200 hover:shadow-sm'
          }`}
        >
          <p className="text-sm font-medium text-gray-900 leading-snug mb-2">{idea.title}</p>
          <div className="flex items-center justify-between gap-2">
            <ScoreBadge score={idea.weighted_score} settings={settings} />
            <div className="flex gap-1 items-center">
              {idea.scorer_count > 0 && (
                <span className="text-xs text-gray-400">{idea.scorer_count} scorer{idea.scorer_count !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
