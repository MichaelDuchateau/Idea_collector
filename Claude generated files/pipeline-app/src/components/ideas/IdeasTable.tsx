import { useState, useMemo } from 'react';
import type { IdeaScoreSummary, IdeaStage, IdeaStatus, ScoreBand, AppSettings } from '../../types';
import IdeaStatusBadge from './IdeaStatusBadge';
import { getScoreBand, SCORE_BAND_COLORS } from '../../lib/scoring';

interface Filters {
  stage?:  IdeaStage;
  status?: IdeaStatus;
  search?: string;
  band?:   ScoreBand;
}

interface Props {
  ideas:          IdeaScoreSummary[];
  onSelect:       (id: number) => void;
  filters:        Filters;
  onFilterChange: (f: Filters) => void;
  settings:       Pick<AppSettings, 'score_threshold_green' | 'score_threshold_amber'>;
}

type SortKey = 'title' | 'stage' | 'status' | 'weighted_score';
type SortDir = 'asc' | 'desc';

const STAGES: IdeaStage[]  = ['collection','screening','development','gate','build'];
const STATUSES: IdeaStatus[] = ['draft','active','parked','killed','launched'];

export default function IdeasTable({ ideas, onSelect, filters, onFilterChange, settings }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('weighted_score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let list = [...ideas];
    if (filters.stage)  list = list.filter(i => i.stage  === filters.stage);
    if (filters.status) list = list.filter(i => i.status === filters.status);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(i => i.title.toLowerCase().includes(q));
    }
    if (filters.band) {
      list = list.filter(i => getScoreBand(i.weighted_score, settings) === filters.band);
    }
    list.sort((a, b) => {
      let av: string | number | null = a[sortKey] ?? null;
      let bv: string | number | null = b[sortKey] ?? null;
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      const cmp = typeof av === 'number' ? av - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [ideas, filters, sortKey, sortDir, settings]);

  const th = (label: string, key: SortKey) => (
    <th
      onClick={() => handleSort(key)}
      className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700"
    >
      {label} {sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="search"
          placeholder="Search ideas…"
          value={filters.search ?? ''}
          onChange={e => onFilterChange({ ...filters, search: e.target.value || undefined })}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <select
          value={filters.stage ?? ''}
          onChange={e => onFilterChange({ ...filters, stage: (e.target.value as IdeaStage) || undefined })}
          className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filters.status ?? ''}
          onChange={e => onFilterChange({ ...filters, status: (e.target.value as IdeaStatus) || undefined })}
          className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="ml-auto text-xs text-gray-400">{filtered.length} idea{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {th('Title', 'title')}
              {th('Stage', 'stage')}
              {th('Status', 'status')}
              {th('Score', 'weighted_score')}
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Scorers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No ideas found. Import a markdown file or create one.
                </td>
              </tr>
            ) : filtered.map(idea => {
              const band = getScoreBand(idea.weighted_score, settings);
              return (
                <tr
                  key={idea.idea_id}
                  onClick={() => onSelect(idea.idea_id)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{idea.title}</td>
                  <td className="px-4 py-3"><IdeaStatusBadge value={idea.stage} type="stage" /></td>
                  <td className="px-4 py-3"><IdeaStatusBadge value={idea.status} type="status" /></td>
                  <td className="px-4 py-3">
                    {idea.weighted_score != null ? (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${SCORE_BAND_COLORS[band]}`}>
                        {idea.weighted_score}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{idea.scorer_count || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
