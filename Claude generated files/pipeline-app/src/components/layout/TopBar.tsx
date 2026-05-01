import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import ImportModal from '../import/ImportModal';

export default function TopBar() {
  const [showImport, setShowImport] = useState(false);
  const loadIdeas = useAppStore(s => s.loadIdeas);
  const userName = useAppStore(s => s.settings?.user_name ?? 'User');

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-5 shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowImport(true)}
          className="text-sm px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          Import
        </button>
        <span className="text-sm text-gray-500">{userName}</span>
      </div>
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={loadIdeas}
        />
      )}
    </header>
  );
}
