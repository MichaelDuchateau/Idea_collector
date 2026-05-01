import { useState } from 'react';
import type { ParsedMarkdownIdea } from '../../types';
import { pickImportFiles, pickImportFolder, listMarkdownInFolder, parseMarkdownFiles } from '../../lib/db';
import ImportPreview from './ImportPreview';

interface Props {
  onClose:    () => void;
  onImported: () => void;
}

export default function ImportModal({ onClose, onImported }: Props) {
  const [parsed,  setParsed]  = useState<ParsedMarkdownIdea[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [status,  setStatus]  = useState('');
  const [error,   setError]   = useState<string | null>(null);

  const pick = async (mode: 'files' | 'folder') => {
    setLoading(true); setError(null); setStatus('');
    try {
      let paths: string[] = [];
      if (mode === 'files') {
        paths = await pickImportFiles();
      } else {
        const folder = await pickImportFolder();
        if (folder) {
          setStatus('Scanning folder…');
          paths = await listMarkdownInFolder(folder);
        }
      }
      if (paths.length === 0) { setLoading(false); setStatus(''); return; }
      setStatus(`Parsing ${paths.length} file${paths.length !== 1 ? 's' : ''}…`);
      const results = await parseMarkdownFiles(paths);
      setParsed(results);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false); setStatus('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Import Markdown Ideas</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {!parsed ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-600">Choose how to import ideas from Markdown files:</p>
              <div className="flex gap-3">
                <button onClick={() => pick('files')} disabled={loading}
                  className="flex-1 py-8 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                >
                  <div className="text-2xl mb-1">📄</div>
                  Pick files
                </button>
                <button onClick={() => pick('folder')} disabled={loading}
                  className="flex-1 py-8 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                >
                  <div className="text-2xl mb-1">📁</div>
                  Pick folder<br />
                  <span className="text-xs text-gray-400">(all .md files, recursive)</span>
                </button>
              </div>
              {error  && <p className="text-sm text-red-600">{error}</p>}
              {status && <p className="text-sm text-gray-400 text-center animate-pulse">{status}</p>}
            </div>
          ) : (
            <ImportPreview
              ideas={parsed}
              onBack={() => setParsed(null)}
              onImported={() => { onImported(); onClose(); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
