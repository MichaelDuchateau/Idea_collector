import type { IdeaScoreSummary, AppSettings } from '../../types';
import ScoreBadge from '../scoring/ScoreBadge';
import IdeaStatusBadge from '../ideas/IdeaStatusBadge';

interface Props {
  ideas:    IdeaScoreSummary[];
  settings: Pick<AppSettings, 'score_threshold_green' | 'score_threshold_amber'>;
  onSelect: (id: number) => void;
  limit?:   number;
}

export default function TopIdeasTable({ ideas, settings, onSelect, limit = 10 }: Props) {
  const top = [...ideas]
    .filter(i => i.weighted_score != null)
    .sort((a, b) => (b.weighted_score ?? 0) - (a.weighted_score ?? 0))
    .slice(0, limit);

  if (top.length === 0) {
    return <p className="text-xs text-gray-400 py-4 text-center">Score some ideas to see the top list.</p>;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Top {limit} Ideas by Score</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase w-6">#</th>
            <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Title</th>
            <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Stage</th>
            <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {top.map((idea, i) => (
            <tr
              key={idea.idea_id}
              onClick={() => onSelect(idea.idea_id)}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className="py-2 text-gray-400 text-xs">{i + 1}</td>
              <td className="py-2 font-medium text-gray-900 max-w-[200px] truncate">{idea.title}</td>
              <td className="py-2"><IdeaStatusBadge value={idea.stage} type="stage" /></td>
              <td className="py-2 text-right">
                <ScoreBadge score={idea.weighted_score} settings={settings} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
