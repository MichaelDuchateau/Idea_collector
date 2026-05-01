import type { ScoreBand, AppSettings } from '../../types';
import { getScoreBand, SCORE_BAND_COLORS } from '../../lib/scoring';

interface Props {
  score:      number | null | undefined;
  settings:   Pick<AppSettings, 'score_threshold_green' | 'score_threshold_amber'>;
  showBand?:  boolean;
}

export default function ScoreBadge({ score, settings, showBand = false }: Props) {
  const band: ScoreBand = getScoreBand(score, settings);
  const color = SCORE_BAND_COLORS[band];

  if (band === 'unscored') {
    return <span className="text-xs text-gray-400">—</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
      {score?.toFixed(1)}
      {showBand && <span className="opacity-60 capitalize">{band}</span>}
    </span>
  );
}
