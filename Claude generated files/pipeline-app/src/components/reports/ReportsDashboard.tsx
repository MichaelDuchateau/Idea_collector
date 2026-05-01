import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IdeaScoreSummary, AppSettings } from '../../types';
import FunnelChart from './FunnelChart';
import ScoreDistribution from './ScoreDistribution';
import HorizonBreakdown from './HorizonBreakdown';
import TopIdeasTable from './TopIdeasTable';
import { exportDashboardPdf } from '../../lib/pdf';

interface Props {
  ideas:    IdeaScoreSummary[];
  settings: Pick<AppSettings, 'score_threshold_green' | 'score_threshold_amber'>;
}

export default function ReportsDashboard({ ideas, settings }: Props) {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportDashboardPdf('reports-dashboard', 'pipeline-report.pdf');
    } finally {
      setExporting(false);
    }
  };

  const handleSelectIdea = (id: number) => {
    navigate('/', { state: { selectId: id } });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
          <p className="text-xs text-gray-400 mt-0.5">{ideas.length} ideas in pipeline</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {exporting ? 'Exporting…' : 'Export PDF'}
        </button>
      </div>

      <div id="reports-dashboard" className="space-y-6">
        {/* Row 1 */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <FunnelChart ideas={ideas} />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <HorizonBreakdown ideas={ideas} />
          </div>
        </div>

        {/* Row 2 */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <ScoreDistribution ideas={ideas} settings={settings} />
        </div>

        {/* Row 3 */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <TopIdeasTable
            ideas={ideas}
            settings={settings}
            onSelect={handleSelectIdea}
            limit={10}
          />
        </div>
      </div>
    </div>
  );
}
