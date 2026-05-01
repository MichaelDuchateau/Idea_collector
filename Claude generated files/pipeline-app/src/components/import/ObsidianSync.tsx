import { useState } from 'react';
import type { AppSettings, SyncResult, ObsidianFile } from '../../types';
import { syncVault, listPipelineFiles } from '../../lib/obsidian';
import { useAppStore } from '../../store/appStore';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  settings:       AppSettings;
  onSyncComplete: (result: SyncResult) => void;
}

export default function ObsidianSync({ settings, onSyncComplete }: Props) {
  const userName   = useAppStore(s => s.settings?.user_name ?? 'User');
  const [syncing,  setSyncing]  = useState(false);
  const [result,   setResult]   = useState<SyncResult | null>(null);
  const [files,    setFiles]    = useState<ObsidianFile[] | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true); setResult(null); setError(null);
    try {
      const r = await syncVault(userName);
      setResult(r);
      onSyncComplete(r);
    } catch (e) {
      setError(String(e));
    } finally {
      setSyncing(false);
    }
  };

  const loadFiles = async () => {
    setLoading(true); setError(null);
    try {
      const f = await listPipelineFiles(
        settings.obsidian_api_url,
        settings.obsidian_api_key,
        settings.obsidian_vault_folder,
      );
      setFiles(f);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  if (!settings.obsidian_enabled) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-400">Obsidian integration is disabled.</p>
        <p className="text-xs text-gray-300 mt-1">Enable it in Settings → Obsidian.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">Obsidian Vault Sync</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Watching: <code className="bg-gray-100 px-1 rounded">{settings.obsidian_vault_folder}/</code> on{' '}
            <code className="bg-gray-100 px-1 rounded">{settings.obsidian_api_url}</code>
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 shrink-0"
        >
          {syncing ? 'Syncing…' : '↻ Sync now'}
        </button>
      </div>

      {result && (
        <div className={`text-sm rounded-lg p-3 ${result.errors.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
          <p className={`font-medium ${result.errors.length > 0 ? 'text-yellow-800' : 'text-green-800'}`}>
            Sync complete — {result.synced} synced · {result.skipped} skipped
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-1 text-xs text-yellow-700 list-disc list-inside">
              {result.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">Files in vault folder</p>
          <button onClick={loadFiles} disabled={loading}
            className="text-xs text-indigo-600 hover:underline disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Refresh list'}
          </button>
        </div>
        {files === null ? (
          <p className="text-xs text-gray-400">Click "Refresh list" to see files in your vault folder.</p>
        ) : files.length === 0 ? (
          <p className="text-xs text-gray-400">No .md files found in <em>{settings.obsidian_vault_folder}/</em>.</p>
        ) : (
          <ul className="space-y-1">
            {files.map(f => (
              <li key={f.path} className="flex items-center justify-between text-xs py-1 border-b border-gray-50">
                <span className="text-gray-700 font-mono truncate">{f.name}</span>
                <span className="text-gray-400 shrink-0 ml-2">
                  {f.modified ? formatDistanceToNow(new Date(f.modified), { addSuffix: true }) : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
