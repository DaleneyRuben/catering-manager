import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/Icon';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/clientes', label: 'Clientes', icon: 'users' },
  { to: '/planes', label: 'Planes', icon: 'plan' },
  { to: '/menu', label: 'Menú', icon: 'chef' },
  { to: '/informes', label: 'Informes', icon: 'report' },
  { to: '/renovaciones', label: 'Renovaciones', icon: 'refresh' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="w-56 shrink-0 flex flex-col bg-paper border-r border-rule">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-rule">
          <div className="brand-mark rounded-full w-9 h-9" aria-hidden="true" />
          <span className="font-serif text-xl text-ink leading-none">La Oliva</span>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive
                    ? 'nav-item-active font-semibold text-ink bg-olive-50'
                    : 'text-muted hover:text-ink hover:bg-cream',
                ].join(' ')
              }
            >
              <Icon name={icon} size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
