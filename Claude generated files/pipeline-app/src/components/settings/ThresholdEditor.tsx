import { useState } from 'react';
import type { AppSettings } from '../../types';
import { saveSetting } from '../../lib/db';

interface Props {
  settings:  AppSettings;
  onChanged: () => void;
}

export default function ThresholdEditor({ settings, onChanged }: Props) {
  const [green, setGreen] = useState(settings.score_threshold_green);
  const [amber, setAmber] = useState(settings.score_threshold_amber);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await Promise.all([
      saveSetting('score_threshold_green', String(green)),
      saveSetting('score_threshold_amber', String(amber)),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onChanged();
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Ideas with a weighted score above <strong>Green</strong> are recommended to advance.
        Above <strong>Amber</strong> need further development. Below Amber are flagged red.
      </p>

      <div className="space-y-3">
        {[
          { label: 'Green threshold', color: 'green', value: green, set: setGreen },
          { label: 'Amber threshold', color: 'amber', value: amber, set: setAmber },
        ].map(({ label, color, value, set }) => (
          <div key={color} className="flex items-center gap-4">
            <label className="text-sm text-gray-700 w-36 shrink-0">{label}</label>
            <input
              type="range" min={0} max={100} step={5} value={value}
              onChange={e => set(Number(e.target.value))}
              className={`flex-1 accent-${color === 'green' ? 'green' : 'yellow'}-500`}
            />
            <span className={`text-sm font-semibold w-10 text-right ${color === 'green' ? 'text-green-600' : 'text-yellow-600'}`}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {amber >= green && (
        <p className="text-xs text-red-500">Amber threshold must be lower than green.</p>
      )}

      <button
        onClick={handleSave}
        disabled={amber >= green}
        className="text-sm px-4 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {saved ? '✓ Saved' : 'Save thresholds'}
      </button>
    </div>
  );
}
