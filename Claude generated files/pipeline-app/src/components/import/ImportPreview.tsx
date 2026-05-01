import { useState } from 'react';
import type { ParsedMarkdownIdea, ImportResult } from '../../types';
import { importIdeas } from '../../lib/db';
import { useAppStore } from '../../store/appStore';

interface Props {
  ideas:      ParsedMarkdownIdea[];
  onBack:     () => void;
  onImported: () => void;
}

export default function ImportPreview({ ideas, onBack, onImported }: Props) {
  const userName = useAppStore(s => s.settings?.user_name ?? 'User');
  const [importing, setImporting] = useState(false);
  const [result,    setResult]    = useState<ImportResult | null>(null);
  const [error,     setError]     = useState<string | null>(null);

  const doImport = async () => {
    setImporting(true); setError(null);
    try {
      const res = await importIdeas(ideas, userName);
      setResult(res);
    } catch (e) {
      setError(String(e));
    } finally {
      setImporting(false);
    }
  };

  if (result) {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center py-6">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="font-semibold text-gray-900 mb-1">Import complete</h3>
          <p className="text-sm text-gray-500">
            {result.imported} imported · {result.updated} updated · {result.skipped} skipped
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-3 text-xs text-red-600 text-left">
              {result.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
        <button
          onClick={onImported}
          className="mx-auto px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{ideas.length} idea{ideas.length !== 1 ? 's' : ''} ready to import</h3>
        <button onClick={onBack} className="text-sm text-gray-500 hover:underline">← Back</button>
      </div>

      <div className="space-y-2 max-h-80 overflow-auto">
        {ideas.map((idea, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
            <p className="text-sm font-medium text-gray-900">{idea.title}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {idea.stage  && <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{idea.stage}</span>}
              {idea.status && <span className="text-xs text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded">{idea.status}</span>}
              {idea.owner  && <span className="text-xs text-gray-500">👤 {idea.owner}</span>}
              {idea.tags?.map(t => <span key={t} className="text-xs text-gray-400">#{t}</span>)}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button onClick={onBack} className="text-sm px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={doImport}
          disabled={importing}
          className="text-sm px-4 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {importing ? 'Importing…' : `Import ${ideas.length} idea${ideas.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
