import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import smallLogo from '../../assets/small_logo.png';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Panel', icon: 'dashboard' },
  { to: '/clientes', label: 'Clientes', icon: 'users' },
  { to: '/planes', label: 'Planes', icon: 'plan' },
  { to: '/menu', label: 'Menú', icon: 'chef' },
  { to: '/informes', label: 'Informes', icon: 'report' },
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
          'fixed inset-y-0 left-0 z-40 w-56 flex flex-col bg-[#d8f5bd] border-r border-[#b8dba0]',
          'transition-transform duration-200',
          'md:relative md:translate-x-0',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="px-4 py-4 flex items-center justify-center border-b border-[#b8dba0]">
          <img src={smallLogo} alt="La Oliva" className="w-36 h-auto" />
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
                    ? 'border-olive-700 bg-white/60 text-olive-900 font-semibold'
                    : 'border-transparent text-olive-900/60 hover:text-olive-900 hover:bg-white/40',
                ].join(' ')
              }
            >
              <Icon name={icon} size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[#b8dba0]">
          <NavLink
            to="/health"
            className={({ isActive }) =>
              [
                'flex items-center gap-3 pl-[13px] pr-4 py-3 text-sm transition-colors border-l-[3px]',
                isActive
                  ? 'border-olive-700 bg-olive-900 text-[#d8f5bd] font-semibold'
                  : 'border-transparent text-olive-900/60 hover:text-olive-900 hover:bg-olive-900/10',
              ].join(' ')
            }
          >
            <Icon name="stethoscope" size={16} />
            Health
          </NavLink>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center gap-3 px-4 h-12 bg-[#d8f5bd] border-b border-[#b8dba0] md:hidden shrink-0">
          <button
            type="button"
            aria-label="Abrir menú"
            className="text-olive-900/60 hover:text-olive-900"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" size={20} />
          </button>
          <img src={smallLogo} alt="La Oliva" className="h-7 w-auto" />
        </header>
        <main className="flex-1 min-w-0 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
