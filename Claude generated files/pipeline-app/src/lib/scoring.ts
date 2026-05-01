import type { ScoresByCriterion, Score, ScoreBand, AppSettings } from '../types';

export function computeWeightedScore(scoresByCriterion: ScoresByCriterion[]): number | null {
  const active = scoresByCriterion.filter(s => s.scores.length > 0);
  if (active.length === 0) return null;

  const totalWeight = active.reduce((sum, s) => sum + s.criterion.weight, 0);
  if (totalWeight === 0) return null;

  const raw = active.reduce((sum, s) => sum + s.average * s.criterion.weight, 0);
  return Math.round((raw / totalWeight) * 10) / 10;
}

export function getScoreBand(
  score: number | null | undefined,
  thresholds: Pick<AppSettings, 'score_threshold_green' | 'score_threshold_amber'>
): ScoreBand {
  if (score == null) return 'unscored';
  if (score >= thresholds.score_threshold_green) return 'green';
  if (score >= thresholds.score_threshold_amber) return 'amber';
  return 'red';
}

export function getAverageForCriterion(scores: Score[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((sum, s) => sum + s.value, 0) / scores.length;
}

export const SCORE_BAND_COLORS: Record<ScoreBand, string> = {
  green:   'bg-green-100 text-green-800',
  amber:   'bg-yellow-100 text-yellow-800',
  red:     'bg-red-100 text-red-800',
  unscored:'bg-gray-100 text-gray-500',
};
