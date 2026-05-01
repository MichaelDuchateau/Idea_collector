import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { IdeaScoreSummary, IdeaStage } from '../../types';

const STAGE_ORDER: IdeaStage[] = ['collection', 'screening', 'development', 'gate', 'build'];
const STAGE_COLORS = ['#818cf8', '#6366f1', '#4f46e5', '#f97316', '#22c55e'];

interface Props {
  ideas: IdeaScoreSummary[];
}

export default function FunnelChart({ ideas }: Props) {
  const data = STAGE_ORDER.map((stage, i) => ({
    stage: stage.charAt(0).toUpperCase() + stage.slice(1),
    count: ideas.filter(i => i.stage === stage).length,
    color: STAGE_COLORS[i],
  }));

  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Pipeline Funnel</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" barSize={28}>
          <XAxis type="number" domain={[0, max]} tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis type="category" dataKey="stage" tick={{ fontSize: 12 }} width={90} />
          <Tooltip
            formatter={(v) => [v, 'Ideas']}
            contentStyle={{ fontSize: 12, borderRadius: 6 }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
