import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { IdeaScoreSummary, AppSettings } from '../../types';

const BUCKETS = [
  { label: '0–20',  min: 0,  max: 20  },
  { label: '20–40', min: 20, max: 40  },
  { label: '40–60', min: 40, max: 60  },
  { label: '60–75', min: 60, max: 75  },
  { label: '75–90', min: 75, max: 90  },
  { label: '90–100',min: 90, max: 100 },
];

interface Props {
  ideas:    IdeaScoreSummary[];
  settings: Pick<AppSettings, 'score_threshold_green' | 'score_threshold_amber'>;
}

export default function ScoreDistribution({ ideas, settings: _settings }: Props) {
  const scored = ideas.filter(i => i.weighted_score != null);

  const data = BUCKETS.map(b => ({
    label: b.label,
    count: scored.filter(i => (i.weighted_score ?? 0) >= b.min && (i.weighted_score ?? 0) < b.max).length,
  }));

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">Score Distribution</h3>
      <p className="text-xs text-gray-400 mb-3">{scored.length} of {ideas.length} ideas scored</p>
      {scored.length === 0 ? (
        <p className="text-xs text-gray-400 py-8 text-center">No scored ideas yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barSize={32}>
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip formatter={(v) => [v, 'Ideas']} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <ReferenceLine x="60–75" stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Amber', fontSize: 10, fill: '#f59e0b' }} />
            <ReferenceLine x="75–90" stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Green', fontSize: 10, fill: '#22c55e' }} />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
