import type { ScoresByCriterion, AppSettings } from '../../types';
import { computeWeightedScore } from '../../lib/scoring';
import ScoreBadge from './ScoreBadge';

interface Props {
  scoresByCriterion: ScoresByCriterion[];
  thresholds:        Pick<AppSettings, 'score_threshold_green' | 'score_threshold_amber'>;
}

export default function ScoreBreakdown({ scoresByCriterion, thresholds }: Props) {
  const total = computeWeightedScore(scoresByCriterion);

  const scorers = Array.from(
    new Set(scoresByCriterion.flatMap(s => s.scores.map(sc => sc.scored_by)))
  );

  if (scoresByCriterion.every(s => s.scores.length === 0)) {
    return <p className="text-sm text-gray-400">No scores yet.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Overall score */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-700">Weighted Total</span>
        <ScoreBadge score={total} settings={thresholds} showBand />
      </div>

      {/* Per-criterion breakdown */}
      <div className="space-y-3">
        {scoresByCriterion.filter(s => s.scores.length > 0).map(sc => (
          <div key={sc.criterion.id}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">{sc.criterion.name}</span>
              <span className="text-xs text-gray-500">avg {sc.average.toFixed(1)} × {(sc.criterion.weight * 100).toFixed(0)}%</span>
            </div>
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 mb-1">
              <div
                className="bg-indigo-400 h-1.5 rounded-full"
                style={{ width: `${sc.average}%` }}
              />
            </div>
            {/* Individual scorers */}
            <div className="flex flex-wrap gap-2">
              {sc.scores.map(s => (
                <span key={s.id} className="text-xs text-gray-500">
                  <span className="font-medium">{s.scored_by}</span>: {s.value.toFixed(0)}
                  {s.notes && <span className="text-gray-400 ml-1">"{s.notes}"</span>}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Scorer summary */}
      {scorers.length > 0 && (
        <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
          {scorers.length} scorer{scorers.length !== 1 ? 's' : ''}: {scorers.join(', ')}
        </p>
      )}
    </div>
  );
}
