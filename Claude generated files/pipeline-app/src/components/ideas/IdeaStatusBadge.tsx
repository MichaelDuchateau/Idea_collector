import type { IdeaStatus, IdeaStage } from '../../types';

const STATUS_COLORS: Record<IdeaStatus, string> = {
  draft:    'bg-gray-100 text-gray-600',
  active:   'bg-blue-100 text-blue-700',
  parked:   'bg-yellow-100 text-yellow-700',
  killed:   'bg-red-100 text-red-700',
  launched: 'bg-green-100 text-green-700',
};

const STAGE_COLORS: Record<IdeaStage, string> = {
  collection:  'bg-purple-100 text-purple-700',
  screening:   'bg-indigo-100 text-indigo-700',
  development: 'bg-blue-100 text-blue-700',
  gate:        'bg-orange-100 text-orange-700',
  build:       'bg-green-100 text-green-700',
};

interface Props {
  value: string;
  type: 'status' | 'stage';
}

export default function IdeaStatusBadge({ value, type }: Props) {
  const colorMap = type === 'status' ? STATUS_COLORS : STAGE_COLORS;
  const color = (colorMap as Record<string, string>)[value] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${color}`}>
      {value}
    </span>
  );
}
