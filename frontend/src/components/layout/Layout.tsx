import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-cream">
      {menuOpen && (
        <div
          data-testid="sidebar-backdrop"
          className="fixed inset-0 z-30 bg-ink/40 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 w-56 flex flex-col bg-olive-900 border-r border-olive-800',
          'transition-transform duration-200',
          'md:relative md:translate-x-0',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="px-5 py-5 flex items-center gap-3 border-b border-olive-800">
          <div className="brand-mark rounded-full w-9 h-9" aria-hidden="true" />
          <span className="font-serif text-xl text-white leading-none">La Oliva</span>
        </div>
        <nav className="flex-1 py-4 flex flex-col">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 pl-[13px] pr-4 py-2 text-sm transition-colors border-l-[3px]',
                  isActive
                    ? 'border-olive-400 bg-olive-800 text-white font-semibold'
                    : 'border-transparent text-white/60 hover:text-white hover:bg-olive-800',
                ].join(' ')
              }
            >
              <Icon name={icon} size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-olive-800">
          <NavLink
            to="/health"
            className={({ isActive }) =>
              [
                'flex items-center gap-3 pl-[13px] pr-4 py-3 text-sm transition-colors border-l-[3px]',
                isActive
                  ? 'border-olive-400 bg-olive-800 text-white font-semibold'
                  : 'border-transparent text-white/60 hover:text-white hover:bg-olive-800',
              ].join(' ')
            }
          >
            <Icon name="stethoscope" size={16} />
            Health
          </NavLink>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center gap-3 px-4 h-12 bg-olive-900 border-b border-olive-800 md:hidden shrink-0">
          <button
            type="button"
            aria-label="Abrir menú"
            className="text-white/60 hover:text-white"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" size={20} />
          </button>
          <span className="font-serif text-lg text-white leading-none">La Oliva</span>
        </header>
        <main className="flex-1 min-w-0 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
