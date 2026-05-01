import { useAppStore } from '../store/appStore';
import ReportsDashboard from '../components/reports/ReportsDashboard';

export default function ReportsPage() {
  const { ideas, settings } = useAppStore();

  const thresholds = {
    score_threshold_green: settings?.score_threshold_green ?? 75,
    score_threshold_amber: settings?.score_threshold_amber ?? 50,
  };

  return <ReportsDashboard ideas={ideas} settings={thresholds} />;
}
