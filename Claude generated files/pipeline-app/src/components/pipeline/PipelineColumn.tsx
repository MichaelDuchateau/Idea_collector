import { Droppable } from 'react-beautiful-dnd';
import type { IdeaScoreSummary, IdeaStage, AppSettings } from '../../types';
import IdeaCard from './IdeaCard';

const STAGE_LABELS: Record<IdeaStage, string> = {
  collection:  'Collection',
  screening:   'Screening',
  development: 'Development',
  gate:        'Gate',
  build:       'Build',
};

const STAGE_COLORS: Record<IdeaStage, string> = {
  collection:  'border-t-purple-400',
  screening:   'border-t-indigo-400',
  development: 'border-t-blue-400',
  gate:        'border-t-orange-400',
  build:       'border-t-green-500',
};

interface Props {
  stage:    IdeaStage;
  ideas:    IdeaScoreSummary[];
  onSelect: (id: number) => void;
  settings: Pick<AppSettings, 'score_threshold_green' | 'score_threshold_amber'>;
}

export default function PipelineColumn({ stage, ideas, onSelect, settings }: Props) {
  return (
    <div className={`flex flex-col bg-gray-50 rounded-lg border-t-4 ${STAGE_COLORS[stage]} min-w-[220px] w-full`}>
      <div className="px-3 py-2.5 flex items-center justify-between border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {STAGE_LABELS[stage]}
        </h3>
        <span className="text-xs font-medium text-gray-400 bg-white border border-gray-200 rounded-full px-2 py-0.5">
          {ideas.length}
        </span>
      </div>

      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 space-y-2 min-h-[120px] transition-colors rounded-b-lg ${
              snapshot.isDraggingOver ? 'bg-indigo-50' : ''
            }`}
          >
            {ideas.map((idea, index) => (
              <IdeaCard
                key={idea.idea_id}
                idea={idea}
                index={index}
                onSelect={onSelect}
                settings={settings}
              />
            ))}
            {provided.placeholder}
            {ideas.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-xs text-gray-300 text-center pt-4">Drop ideas here</p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
