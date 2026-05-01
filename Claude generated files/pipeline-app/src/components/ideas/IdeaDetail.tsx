import { useEffect, useState } from 'react';
import type { Idea, ScoresByCriterion, ActivityLogEntry, IdeaStage, AppSettings } from '../../types';
import { getIdea, getScoresForIdea, getActivityLog, updateIdea, moveIdeaStage } from '../../lib/db';
import IdeaStatusBadge from './IdeaStatusBadge';
import IdeaEditor from './IdeaEditor';
import { getScoreBand, SCORE_BAND_COLORS } from '../../lib/scoring';

interface Props {
  ideaId:  number;
  onBack:  () => void;
  onSaved: () => void;
  currentUser: string;
  settings: Pick<AppSettings, 'score_threshold_green' | 'score_threshold_amber'>;
}

const STAGES: IdeaStage[] = ['collection','screening','development','gate','build'];

export default function IdeaDetail({ ideaId, onBack, onSaved, currentUser, settings }: Props) {
  const [idea, setIdea]     = useState<Idea | null>(null);
  const [scores, setScores] = useState<ScoresByCriterion[]>([]);
  const [log, setLog]       = useState<ActivityLogEntry[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);

  const load = async () => {
    const [i, s, l] = await Promise.all([
      getIdea(ideaId),
      getScoresForIdea(ideaId),
      getActivityLog(ideaId, 20),
    ]);
    setIdea(i); setScores(s); setLog(l);
  };

  useEffect(() => { load(); }, [ideaId]);

  const handleSave = async (raw: string) => {
    if (!idea) return;
    setSaving(true);
    await updateIdea(idea.id, { raw_markdown: raw });
    setSaving(false);
    setEditing(false);
    onSaved();
    load();
  };

  const handleStageChange = async (stage: IdeaStage) => {
    if (!idea) return;
    await moveIdeaStage(idea.id, stage, currentUser);
    onSaved();
    load();
  };

  if (!idea) return <div className="p-6 text-gray-400 text-sm">Loading…</div>;

  const totalScore = scores.reduce((s, c) => s + c.weighted_contribution, 0);
  const roundedScore = Math.round(totalScore * 10) / 10;
  const band = getScoreBand(scores.some(s => s.scores.length > 0) ? roundedScore : null, settings);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={onBack} className="text-sm text-indigo-600 hover:underline mb-2">← Back</button>
          <h2 className="text-2xl font-bold text-gray-900">{idea.title}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            <IdeaStatusBadge value={idea.stage} type="stage" />
            <IdeaStatusBadge value={idea.status} type="status" />
            {idea.horizon && <IdeaStatusBadge value={idea.horizon} type="status" />}
            {idea.source_type === 'obsidian' && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Obsidian</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-gray-200 text-sm">
        {[
          ['Owner',    idea.owner    ?? '—'],
          ['Category', idea.category ?? '—'],
          ['Horizon',  idea.horizon  ?? '—'],
          ['Source',   idea.source_type],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-xs text-gray-400 font-medium">{k}</p>
            <p className="text-gray-900 mt-0.5">{v}</p>
          </div>
        ))}
      </div>

      {/* Stage mover */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Move to stage</p>
        <div className="flex flex-wrap gap-2">
          {STAGES.map(stage => (
            <button
              key={stage}
              onClick={() => handleStageChange(stage)}
              className={`text-sm px-3 py-1 rounded-md capitalize transition-colors ${
                idea.stage === stage
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>

      {/* Score summary */}
      {scores.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">Weighted Score</p>
            {scores.some(s => s.scores.length > 0) && (
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${SCORE_BAND_COLORS[band]}`}>
                {roundedScore}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {scores.map(sc => (
              <div key={sc.criterion.id} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-44 shrink-0">{sc.criterion.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${sc.average}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-10 text-right">{sc.average.toFixed(0)}</span>
                <span className="text-xs text-gray-400 w-10 text-right">{(sc.criterion.weight * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {editing ? (
          <div className="p-4">
            {idea.source_type === 'obsidian' && (
              <div className="mb-3 text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded px-3 py-2">
                This idea was imported from Obsidian. Changes here will not sync back automatically.
              </div>
            )}
            <IdeaEditor
              initialValue={idea.raw_markdown ?? ''}
              onChange={() => {}}
              onSave={handleSave}
              readOnly={saving}
            />
            <button
              onClick={() => setEditing(false)}
              className="mt-2 text-sm text-gray-500 hover:underline"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div
            className="prose prose-sm max-w-none p-6"
            dangerouslySetInnerHTML={{ __html: idea.raw_markdown
              ? idea.raw_markdown
              : '<p class="text-gray-400">No content yet. Click Edit to add.</p>'
            }}
          />
        )}
      </div>

      {/* Activity log */}
      {log.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Activity</p>
          <ul className="space-y-2">
            {log.map(entry => (
              <li key={entry.id} className="text-xs text-gray-500 flex gap-2">
                <span className="text-gray-300">{entry.created_at.slice(0, 16)}</span>
                <span className="font-medium text-gray-600 capitalize">{entry.event_type.replace('_', ' ')}</span>
                {entry.actor && <span>by {entry.actor}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
