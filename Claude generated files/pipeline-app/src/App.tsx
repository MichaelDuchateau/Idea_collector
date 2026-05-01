import { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/layout/Layout';
import IdeasPage from './pages/IdeasPage';
import PipelinePage from './pages/PipelinePage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';
import { useAppStore } from './store/appStore';

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([loadSettings(), loadIdeas()]).finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400 text-sm">
        Loading Pipeline…
      </div>
    );
  }

  return <RouterProvider router={router} />;
}
