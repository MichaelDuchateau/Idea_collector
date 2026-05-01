import { useState } from 'react';
import { open, save } from '@tauri-apps/plugin-dialog';
import { getDbPath, backupDb, restoreDb } from '../../lib/db';

export default function BackupSettings() {
  const [dbPath, setDbPath]     = useState<string | null>(null);
  const [status, setStatus]     = useState<string | null>(null);
  const [busy, setBusy]         = useState(false);

  const loadDbPath = async () => {
    const p = await getDbPath();
    setDbPath(p);
  };

  const handleBackup = async () => {
    const dest = await save({
      defaultPath: 'pipeline-backup.db',
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    });
    if (!dest) return;
    setBusy(true);
    setStatus(null);
    try {
      await backupDb(dest);
      setStatus(`Backup saved to ${dest}`);
    } catch (e) {
      setStatus(`Error: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    const files = await open({
      multiple: false,
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    });
    const src = Array.isArray(files) ? files[0] : files;
    if (!src) return;

    const confirmed = window.confirm(
      'Restoring will overwrite your current database and requires restarting the app. Continue?'
    );
    if (!confirmed) return;

    setBusy(true);
    setStatus(null);
    try {
      await restoreDb(src as string);
      setStatus('Restore complete. Please restart the app for changes to take effect.');
    } catch (e) {
      setStatus(`Error: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-1">Database location</h3>
        {dbPath ? (
          <p className="text-xs font-mono text-gray-500 bg-gray-50 rounded p-2 break-all">{dbPath}</p>
        ) : (
          <button
            onClick={loadDbPath}
            className="text-xs text-indigo-600 hover:underline"
          >
            Show path
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleBackup}
          disabled={busy}
          className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          Backup database…
        </button>
        <button
          onClick={handleRestore}
          disabled={busy}
          className="text-sm px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Restore from backup…
        </button>
      </div>

      {status && (
        <p className={`text-xs rounded p-2 ${status.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {status}
        </p>
      )}
    </div>
  );
}
