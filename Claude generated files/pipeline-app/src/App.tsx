import { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/layout/Layout';
import IdeasPage from './pages/IdeasPage';
import PipelinePage from './pages/PipelinePage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';
import OnboardingModal from './components/OnboardingModal';
import { useAppStore } from './store/appStore';
import { getCriteria } from './lib/db';
import type { ScorecardCriterion } from './types';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true,       element: <IdeasPage /> },
      { path: 'pipeline',  element: <PipelinePage /> },
      { path: 'reports',   element: <ReportsPage /> },
      { path: 'settings',  element: <SettingsPage /> },
      { path: 'help',      element: <HelpPage /> },
    ],
  },
]);

export default function App() {
  const { loadSettings, loadIdeas } = useAppStore();
  const [ready, setReady]               = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [criteria, setCriteria]         = useState<ScorecardCriterion[]>([]);

  const { settings } = useAppStore();

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadSettings(), loadIdeas()]);
      setReady(true);
    };
    init();
  }, []);

  // Show onboarding when settings load and user name is still the default
  useEffect(() => {
    if (!ready || showOnboarding) return;
    if (settings && settings.user_name === 'User') {
      getCriteria().then(c => {
        setCriteria(c);
        setShowOnboarding(true);
      }).catch(() => {});
    }
  }, [ready, settings]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400 text-sm">
        Loading Pipeline…
      </div>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      {showOnboarding && (
        <OnboardingModal
          criteria={criteria}
          onDone={() => setShowOnboarding(false)}
        />
      )}
    </>
  );
}
