import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { IdeaScoreSummary } from '../../types';

const COLORS: Record<string, string> = {
  H1: '#6366f1',
  H2: '#f97316',
  H3: '#22c55e',
  Unknown: '#d1d5db',
};

interface Props {
  ideas: IdeaScoreSummary[];
}

export default function HorizonBreakdown({ ideas }: Props) {
  const counts: Record<string, number> = { H1: 0, H2: 0, H3: 0, Unknown: 0 };
  for (const idea of ideas) {
    const h = (idea as { horizon?: string }).horizon ?? 'Unknown';
    counts[h in counts ? h : 'Unknown']++;
  }

  const data = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Horizon Breakdown</h3>
      {data.length === 0 ? (
        <p className="text-xs text-gray-400 py-8 text-center">No horizon data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={COLORS[entry.name] ?? '#6366f1'} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [v, 'Ideas']} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
