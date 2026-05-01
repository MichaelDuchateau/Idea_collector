import { useState } from 'react';
import type { ScorecardCriterion, ScoresByCriterion, AppSettings } from '../../types';
import { saveScore } from '../../lib/db';
import { computeWeightedScore } from '../../lib/scoring';
import CriterionSlider from './CriterionSlider';
import ScoreBadge from './ScoreBadge';

interface LocalScore {
  value: number;
  notes: string;
}

interface Props {
  ideaId:         number;
  criteria:       ScorecardCriterion[];
  existingScores: ScoresByCriterion[];
  currentUser:    string;
  thresholds:     Pick<AppSettings, 'score_threshold_green' | 'score_threshold_amber'>;
  onScoreSaved:   () => void;
}

export default function ScorecardPanel({ ideaId, criteria, existingScores, currentUser, thresholds, onScoreSaved }: Props) {
  const getMyScore = (criterionId: number) =>
    existingScores.find(s => s.criterion.id === criterionId)
      ?.scores.find(s => s.scored_by === currentUser);

  const [local, setLocal] = useState<Record<number, LocalScore>>(() => {
    const init: Record<number, LocalScore> = {};
    for (const c of criteria) {
      const mine = getMyScore(c.id);
      if (mine) init[c.id] = { value: mine.value, notes: mine.notes ?? '' };
    }
    return init;
  });

  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(local).map(([cid, ls]) =>
          saveScore(ideaId, Number(cid), ls.value, ls.notes || null, currentUser)
        )
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onScoreSaved();
    } finally {
      setSaving(false);
    }
  };

  const previewScores: ScoresByCriterion[] = criteria.map(c => {
    const ls = local[c.id];
    const others = existingScores
      .find(s => s.criterion.id === c.id)
      ?.scores.filter(s => s.scored_by !== currentUser) ?? [];
    const myFake = ls ? [{ id: -1, idea_id: ideaId, criterion_id: c.id, value: ls.value, notes: ls.notes || null, scored_by: currentUser, scored_at: '' }] : [];
    const all = [...myFake, ...others];
    const avg = all.length ? all.reduce((s, x) => s + x.value, 0) / all.length : 0;
    return { criterion: c, scores: all, average: avg, weighted_contribution: avg * c.weight };
  });

  const previewTotal = computeWeightedScore(previewScores);
  const hasAnyLocal = Object.keys(local).length > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Your Scores</h3>
        {previewTotal != null && (
          <ScoreBadge score={previewTotal} settings={thresholds} showBand />
        )}
      </div>

      {criteria.map(c => (
        <CriterionSlider
          key={c.id}
          criterion={c}
          myScore={local[c.id]
            ? { id: -1, idea_id: ideaId, criterion_id: c.id, value: local[c.id].value, notes: local[c.id].notes || null, scored_by: currentUser, scored_at: '' }
            : getMyScore(c.id)}
          otherScores={existingScores.find(s => s.criterion.id === c.id)?.scores.filter(s => s.scored_by !== currentUser) ?? []}
          onChange={v => setLocal(prev => ({ ...prev, [c.id]: { value: v, notes: prev[c.id]?.notes ?? '' } }))}
          onNotesChange={n => setLocal(prev => ({ ...prev, [c.id]: { value: prev[c.id]?.value ?? 50, notes: n } }))}
        />
      ))}

      <button
        onClick={handleSave}
        disabled={saving || !hasAnyLocal}
        className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Scores'}
      </button>
    </div>
  );
}
