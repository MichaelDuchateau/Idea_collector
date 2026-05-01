import { useEffect, useState } from 'react';
import type { Idea, ScoresByCriterion, ActivityLogEntry, IdeaStage, AppSettings, ScorecardCriterion } from '../../types';
import { getIdea, getScoresForIdea, getActivityLog, updateIdea, moveIdeaStage, getCriteria } from '../../lib/db';
import IdeaStatusBadge from './IdeaStatusBadge';
import IdeaEditor from './IdeaEditor';
import ActivityLog from './ActivityLog';
import ScorecardPanel from '../scoring/ScorecardPanel';
import ScoreBreakdown from '../scoring/ScoreBreakdown';

interface Props {
  ideaId:  number;
  onBack:  () => void;
  onSaved: () => void;
  currentUser: string;
  settings: Pick<AppSettings, 'score_threshold_green' | 'score_threshold_amber'>;
}

const STAGES: IdeaStage[] = ['collection','screening','development','gate','build'];

export default function IdeaDetail({ ideaId, onBack, onSaved, currentUser, settings }: Props) {
  const [idea, setIdea]         = useState<Idea | null>(null);
  const [scores, setScores]     = useState<ScoresByCriterion[]>([]);
  const [criteria, setCriteria] = useState<ScorecardCriterion[]>([]);
  const [log, setLog]           = useState<ActivityLogEntry[]>([]);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [scoreTab, setScoreTab] = useState<'score' | 'breakdown'>('breakdown');

  const load = async () => {
    const [i, s, l, c] = await Promise.all([
      getIdea(ideaId),
      getScoresForIdea(ideaId),
      getActivityLog(ideaId, 20),
      getCriteria(),
    ]);
    setIdea(i); setScores(s); setLog(l); setCriteria(c.filter(cr => cr.active));
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

      {/* Scoring panel */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-100">
          {(['breakdown', 'score'] as const).map(t => (
            <button
              key={t}
              onClick={() => setScoreTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
                scoreTab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'score' ? 'Score this idea' : 'Score breakdown'}
            </button>
          ))}
        </div>
        <div className="p-4">
          {scoreTab === 'breakdown' ? (
            <ScoreBreakdown scoresByCriterion={scores} thresholds={settings} />
          ) : (
            <ScorecardPanel
              ideaId={idea.id}
              criteria={criteria}
              existingScores={scores}
              currentUser={currentUser}
              thresholds={settings}
              onScoreSaved={load}
            />
          )}
        </div>
      </div>

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
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Activity</p>
        <ActivityLog entries={log} />
      </div>
    </div>
  );
}
