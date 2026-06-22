import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Icon } from '../ui/Icon';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, type UserRole } from '../../constants/roles';
import smallLogo from '../../assets/small_logo.png';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  allowedRoles?: UserRole[];
}

const ADMIN_ROLES: UserRole[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Panel', icon: 'dashboard', allowedRoles: ADMIN_ROLES },
  { to: '/clientes', label: 'Clientes', icon: 'users', allowedRoles: ADMIN_ROLES },
  { to: '/planes', label: 'Planes', icon: 'plan', allowedRoles: ADMIN_ROLES },
  { to: '/menu', label: 'Menú', icon: 'chef' },
  { to: '/informes', label: 'Informes', icon: 'report' },
];

const SUPER_ADMIN_NAV_ITEMS: NavItem[] = [
  { to: '/usuarios', label: 'Usuarios', icon: 'user-plus' },
  { to: '/health', label: 'Health', icon: 'stethoscope' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

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
          {user?.role === ROLES.SUPER_ADMIN && (
            <>
              {SUPER_ADMIN_NAV_ITEMS.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
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
              <div className="mx-4 my-2 border-t border-[#b8dba0]" />
            </>
          )}
          {NAV_ITEMS.filter(
            ({ allowedRoles }) => !allowedRoles || (user && allowedRoles.includes(user.role)),
          ).map(({ to, label, icon }) => (
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
        <div className="border-t border-[#b8dba0] px-4 py-3 flex items-center justify-between gap-2">
          <span className="text-[12px] text-olive-900/70 font-medium truncate">
            {user?.username}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-olive-900/50 hover:text-olive-900 transition-colors shrink-0"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <Icon name="logout" size={16} />
          </button>
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
        <main className="flex-1 min-w-0 overflow-auto">
          <div key={pathname} className="page-enter">
            {children}
          </div>
        </main>
      </div>
      <Toaster
        position="bottom-center"
        toastOptions={{
          classNames: {
            toast: 'font-mono text-[13px]',
            error: '!bg-[#fae6dd] !text-[#c4341a] !border-[#f0b8a0]',
            success: '!bg-[#dee9c8] !text-[#357e1c] !border-[#b8d099]',
            icon: 'text-current',
          },
        }}
      />
    </div>
  );
}
