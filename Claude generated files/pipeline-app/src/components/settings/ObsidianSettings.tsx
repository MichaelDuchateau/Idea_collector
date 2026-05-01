import { useState } from 'react';
import type { AppSettings, ConnectionResult } from '../../types';
import { saveSetting } from '../../lib/db';
import { testConnection } from '../../lib/obsidian';

interface Props {
  settings:  AppSettings;
  onChanged: () => void;
}

export default function ObsidianSettings({ settings, onChanged }: Props) {
  const [apiUrl,  setApiUrl]  = useState(settings.obsidian_api_url);
  const [apiKey,  setApiKey]  = useState(settings.obsidian_api_key);
  const [folder,  setFolder]  = useState(settings.obsidian_vault_folder);
  const [interval, setInterval] = useState(settings.obsidian_sync_interval);
  const [enabled, setEnabled] = useState(settings.obsidian_enabled);

  const [testing, setTesting] = useState(false);
  const [connResult, setConnResult] = useState<ConnectionResult | null>(null);
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);

  const handleTest = async () => {
    setTesting(true); setConnResult(null);
    const result = await testConnection(apiUrl, apiKey);
    setConnResult(result);
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      saveSetting('obsidian_enabled',       String(enabled)),
      saveSetting('obsidian_api_url',       apiUrl),
      saveSetting('obsidian_api_key',       apiKey),
      saveSetting('obsidian_vault_folder',  folder),
      saveSetting('obsidian_sync_interval', String(interval)),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onChanged();
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">Obsidian Local REST API</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Requires the <em>Local REST API</em> community plugin installed in Obsidian.
          </p>
        </div>
        <button
          onClick={() => setEnabled(e => !e)}
          className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
        >
          <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <div className={`space-y-3 ${!enabled ? 'opacity-40 pointer-events-none' : ''}`}>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">API URL</label>
          <input type="text" value={apiUrl} onChange={e => setApiUrl(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="http://localhost:27123"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">API Key</label>
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Your Obsidian REST API key"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Vault folder to watch</label>
          <input type="text" value={folder} onChange={e => setFolder(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Pipeline"
          />
          <p className="text-xs text-gray-400 mt-1">All .md files in this folder will be synced.</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Auto-sync interval: {interval === 0 ? 'manual only' : `${interval}s`}
          </label>
          <input type="range" min={0} max={3600} step={60} value={interval}
            onChange={e => setInterval(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleTest} disabled={testing || !apiUrl || !apiKey}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            {testing ? 'Testing…' : 'Test connection'}
          </button>
          {connResult && (
            <span className={`text-xs font-medium ${connResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {connResult.success ? '✓' : '✕'} {connResult.message}
            </span>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <button onClick={handleSave} disabled={saving}
          className="text-sm px-4 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {saved ? '✓ Saved' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}
