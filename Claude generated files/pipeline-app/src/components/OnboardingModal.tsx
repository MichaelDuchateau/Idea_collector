import { useState } from 'react';
import type { ScorecardCriterion } from '../types';
import { saveSetting } from '../lib/db';
import { useAppStore } from '../store/appStore';

interface Props {
  criteria: ScorecardCriterion[];
  onDone:   () => void;
}

export default function OnboardingModal({ criteria, onDone }: Props) {
  const { loadSettings } = useAppStore();
  const [step, setStep]     = useState<'name' | 'criteria'>('name');
  const [name, setName]     = useState('');
  const [saving, setSaving] = useState(false);

  const handleNameNext = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await saveSetting('user_name', name.trim());
      await loadSettings();
      setStep('criteria');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-7">
        {step === 'name' && (
          <>
            <div className="text-center mb-6">
              <div className="text-3xl mb-2">🚀</div>
              <h2 className="text-lg font-semibold text-gray-900">Welcome to Pipeline</h2>
              <p className="text-sm text-gray-500 mt-1">
                Your innovation pipeline manager. Let's set you up quickly.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                What's your name?
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Used as your identity when scoring ideas.
              </p>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleNameNext(); }}
                placeholder="e.g. Alex"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <button
              onClick={handleNameNext}
              disabled={!name.trim() || saving}
              className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Continue →'}
            </button>
          </>
        )}

        {step === 'criteria' && (
          <>
            <div className="text-center mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Default Scorecard</h2>
              <p className="text-sm text-gray-500 mt-1">
                These criteria will be used to score your ideas. You can edit them anytime in Settings.
              </p>
            </div>

            <div className="space-y-2 mb-6 max-h-56 overflow-y-auto">
              {criteria.filter(c => c.active).map(c => (
                <div key={c.id} className="flex items-center justify-between text-sm p-2.5 bg-gray-50 rounded-md">
                  <span className="font-medium text-gray-800">{c.name}</span>
                  <span className="text-gray-400 text-xs">Weight {c.weight}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onDone}
              className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
            >
              Get started
            </button>
          </>
        )}
      </div>
    </div>
  );
}
