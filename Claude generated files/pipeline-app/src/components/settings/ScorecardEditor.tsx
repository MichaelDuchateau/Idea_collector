import { useState } from 'react';
import type { ScorecardCriterion } from '../../types';
import { saveCriterion, updateCriterion, deleteCriterion } from '../../lib/db';

interface Props {
  criteria:   ScorecardCriterion[];
  onChanged:  () => void;
}

export default function ScorecardEditor({ criteria, onChanged }: Props) {
  const [adding,  setAdding]  = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newWt,   setNewWt]   = useState(10);
  const [saving,  setSaving]  = useState(false);

  const totalWeight = criteria.reduce((s, c) => s + c.weight * 100, 0);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await saveCriterion({
      name: newName.trim(),
      description: newDesc.trim() || null,
      weight: newWt / 100,
      sort_order: criteria.length + 1,
      active: true,
    });
    setNewName(''); setNewDesc(''); setNewWt(10); setAdding(false);
    onChanged();
    setSaving(false);
  };

  const toggleActive = async (c: ScorecardCriterion) => {
    await updateCriterion(c.id, { ...c, active: !c.active });
    onChanged();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this criterion? Existing scores for it will also be deleted.')) return;
    await deleteCriterion(id);
    onChanged();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Total weight: <span className={totalWeight === 100 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>{totalWeight.toFixed(0)}%</span>
          {totalWeight !== 100 && ' (should sum to 100%)'}
        </p>
        <button
          onClick={() => setAdding(true)}
          className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          + Add criterion
        </button>
      </div>

      <div className="space-y-2">
        {criteria.map(c => (
          <div key={c.id} className={`flex items-center gap-3 p-3 rounded-lg border ${c.active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
              {c.description && <p className="text-xs text-gray-400 truncate">{c.description}</p>}
            </div>
            <span className="text-sm font-semibold text-indigo-600 w-12 text-right shrink-0">
              {(c.weight * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => toggleActive(c)}
              title={c.active ? 'Deactivate' : 'Activate'}
              className="text-xs text-gray-400 hover:text-gray-700"
            >
              {c.active ? '●' : '○'}
            </button>
            <button
              onClick={() => handleDelete(c.id)}
              className="text-xs text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {adding && (
        <div className="border border-indigo-200 rounded-lg p-4 space-y-3 bg-indigo-50">
          <p className="text-sm font-medium text-gray-700">New criterion</p>
          <input
            autoFocus
            type="text"
            placeholder="Name *"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 shrink-0">Weight: {newWt}%</label>
            <input
              type="range" min={1} max={100} value={newWt}
              onChange={e => setNewWt(Number(e.target.value))}
              className="flex-1 accent-indigo-600"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving || !newName.trim()}
              className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Add'}
            </button>
            <button onClick={() => setAdding(false)}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
