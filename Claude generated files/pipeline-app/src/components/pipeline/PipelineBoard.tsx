import { DragDropContext, type DropResult } from 'react-beautiful-dnd';
import type { IdeaScoreSummary, IdeaStage, AppSettings } from '../../types';
import PipelineColumn from './PipelineColumn';

const STAGES: IdeaStage[] = ['collection', 'screening', 'development', 'gate', 'build'];

interface Props {
  board:      Record<IdeaStage, IdeaScoreSummary[]>;
  onMoveCard: (id: number, fromStage: IdeaStage, toStage: IdeaStage) => void;
  onSelectCard: (id: number) => void;
  settings:   Pick<AppSettings, 'score_threshold_green' | 'score_threshold_amber'>;
}

export default function PipelineBoard({ board, onMoveCard, onSelectCard, settings }: Props) {
  const handleDragEnd = (result: DropResult) => {
    const { draggableId, source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const id       = Number(draggableId);
    const fromStage = source.droppableId      as IdeaStage;
    const toStage   = destination.droppableId as IdeaStage;
    onMoveCard(id, fromStage, toStage);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 h-full">
        {STAGES.map(stage => (
          <PipelineColumn
            key={stage}
            stage={stage}
            ideas={board[stage] ?? []}
            onSelect={onSelectCard}
            settings={settings}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
