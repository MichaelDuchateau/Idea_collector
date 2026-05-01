import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/',         label: 'Ideas',    icon: '💡' },
  { to: '/pipeline', label: 'Pipeline', icon: '📋' },
  { to: '/reports',  label: 'Reports',  icon: '📊' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
  { to: '/help',     label: 'Help',     icon: '❓' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="px-5 py-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-indigo-600 tracking-tight">Pipeline</h1>
        <p className="text-xs text-gray-400 mt-0.5">Innovation Manager</p>
      </div>
      <nav className="flex-1 py-3">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
