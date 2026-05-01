import type { ActivityLogEntry } from '../../types';
import { formatDistanceToNow } from 'date-fns';

const EVENT_ICONS: Record<string, string> = {
  imported:       '📥',
  created:        '✨',
  updated:        '✏️',
  scored:         '⭐',
  stage_changed:  '→',
  status_changed: '🔄',
  killed:         '✕',
  launched:       '🚀',
  obsidian_synced:'🔗',
  exported:       '📤',
};

interface Props {
  entries: ActivityLogEntry[];
  compact?: boolean;
}

export default function ActivityLog({ entries, compact = false }: Props) {
  if (entries.length === 0) {
    return <p className="text-xs text-gray-400 py-2">No activity yet.</p>;
  }

  return (
    <ul className={`space-y-${compact ? '1' : '2'}`}>
      {entries.map(entry => {
        let detail = '';
        try {
          const d = typeof entry.detail === 'string'
            ? JSON.parse(entry.detail)
            : entry.detail;
          if (d?.from && d?.to) detail = `${d.from} → ${d.to}`;
          else if (d?.source) detail = d.source.split('/').pop() ?? '';
          else if (d?.file) detail = d.file.split('/').pop() ?? '';
        } catch {}

        const timeAgo = (() => {
          try { return formatDistanceToNow(new Date(entry.created_at), { addSuffix: true }); }
          catch { return entry.created_at.slice(0, 16); }
        })();

        return (
          <li key={entry.id} className="flex items-start gap-2 text-xs">
            <span className="shrink-0 mt-0.5 w-5 text-center">
              {EVENT_ICONS[entry.event_type] ?? '·'}
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-gray-700 capitalize">
                {entry.event_type.replace(/_/g, ' ')}
              </span>
              {detail && <span className="text-gray-400 ml-1 truncate">{detail}</span>}
              {entry.actor && <span className="text-gray-400 ml-1">by {entry.actor}</span>}
            </div>
            <span className="text-gray-300 shrink-0">{timeAgo}</span>
          </li>
        );
      })}
    </ul>
  );
}
