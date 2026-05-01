import { useEffect, useState } from 'react';
import type { ScorecardCriterion } from '../types';
import { getCriteria, saveSetting } from '../lib/db';
import { useAppStore } from '../store/appStore';
import ScorecardEditor from '../components/settings/ScorecardEditor';
import ThresholdEditor from '../components/settings/ThresholdEditor';
import ObsidianSettings from '../components/settings/ObsidianSettings';
import BackupSettings from '../components/settings/BackupSettings';

type Tab = 'scorecard' | 'thresholds' | 'obsidian' | 'general' | 'backup';

export default function SettingsPage() {
  const { settings, loadSettings } = useAppStore();
  const [tab, setTab]         = useState<Tab>('scorecard');
  const [criteria, setCriteria] = useState<ScorecardCriterion[]>([]);
  const [userName, setUserName] = useState(settings?.user_name ?? 'User');
  const [nameSaved, setNameSaved] = useState(false);

  const loadCriteria = async () => {
    const c = await getCriteria();
    setCriteria(c);
  };

  useEffect(() => { loadCriteria(); }, []);
  useEffect(() => { if (settings) setUserName(settings.user_name); }, [settings]);

  const saveUserName = async () => {
    await saveSetting('user_name', userName);
    await loadSettings();
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'scorecard',  label: 'Scorecard' },
    { key: 'thresholds', label: 'Thresholds' },
    { key: 'obsidian',   label: 'Obsidian' },
    { key: 'general',    label: 'General' },
    { key: 'backup',     label: 'Backup' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'scorecard' && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Scorecard Criteria</h2>
          <ScorecardEditor criteria={criteria} onChanged={loadCriteria} />
        </div>
      )}

      {tab === 'obsidian' && settings && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Obsidian Integration</h2>
          <ObsidianSettings settings={settings} onChanged={loadSettings} />
        </div>
      )}

      {tab === 'thresholds' && settings && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Score Band Thresholds</h2>
          <ThresholdEditor settings={settings} onChanged={loadSettings} />
        </div>
      )}

      {tab === 'backup' && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Backup & Restore</h2>
          <BackupSettings />
        </div>
      )}

      {tab === 'general' && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Your Name</h2>
            <p className="text-xs text-gray-500 mb-3">Used as your scorer identity in all scorecards.</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 flex-1"
              />
              <button
                onClick={saveUserName}
                className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {nameSaved ? '✓ Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
