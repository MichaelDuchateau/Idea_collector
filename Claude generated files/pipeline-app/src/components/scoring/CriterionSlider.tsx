import type { ScorecardCriterion, Score } from '../../types';

interface Props {
  criterion:     ScorecardCriterion;
  myScore:       Score | undefined;
  otherScores:   Score[];
  onChange:      (value: number) => void;
  onNotesChange: (notes: string) => void;
}

export default function CriterionSlider({ criterion, myScore, otherScores, onChange, onNotesChange }: Props) {
  const value = myScore?.value ?? 0;
  const hasScore = myScore != null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">{criterion.name}</p>
          {criterion.description && (
            <p className="text-xs text-gray-400">{criterion.description}</p>
          )}
        </div>
        <div className="text-right shrink-0 ml-4">
          <span className={`text-lg font-bold ${hasScore ? 'text-indigo-600' : 'text-gray-300'}`}>
            {hasScore ? value.toFixed(0) : '—'}
          </span>
          <span className="text-xs text-gray-400 ml-1">/ 100</span>
          <p className="text-xs text-gray-400">{(criterion.weight * 100).toFixed(0)}% weight</p>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={hasScore ? value : 50}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-indigo-600"
        onMouseDown={() => { if (!hasScore) onChange(50); }}
      />

      {/* Other scorers' marks */}
      {otherScores.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {otherScores.map(s => (
            <span key={s.id} className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
              {s.scored_by}: {s.value.toFixed(0)}
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        placeholder="Rationale (optional)…"
        value={myScore?.notes ?? ''}
        onChange={e => onNotesChange(e.target.value)}
        className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 text-gray-600 placeholder-gray-300"
      />
    </div>
  );
}
