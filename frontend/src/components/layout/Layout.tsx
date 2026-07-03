import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Icon } from '@ui/Icon';
import { IconButton } from '@ui/IconButton';
import { useAuth } from '@/features/auth/AuthContext';
import { ROLES, ROLE_LABELS, type UserRole } from '@/constants/roles';

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
  { to: '/menu', label: 'Menú', icon: 'chef', allowedRoles: [...ADMIN_ROLES, ROLES.KITCHEN] },
  {
    to: '/produccion',
    label: 'Producción',
    icon: 'cloche',
    allowedRoles: [...ADMIN_ROLES, ROLES.KITCHEN],
  },
  {
    to: '/informes',
    label: 'Informes',
    icon: 'report',
    allowedRoles: [...ADMIN_ROLES, ROLES.KITCHEN],
  },
  {
    to: '/entregas',
    label: 'Entregas',
    icon: 'motorcycle',
    allowedRoles: [...ADMIN_ROLES, ROLES.DELIVERY],
  },
];

const SUPER_ADMIN_NAV_ITEMS: NavItem[] = [
  { to: '/usuarios', label: 'Usuarios', icon: 'user-plus' },
  { to: '/health', label: 'Health', icon: 'stethoscope' },
];

interface LayoutProps {
  children: React.ReactNode;
}

const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
  [
    'flex items-center gap-3 border-l-[3px] px-[22px] py-[9px] text-[13.5px] transition-colors',
    isActive
      ? 'border-olive-400 bg-white/10 text-olive-50 font-semibold'
      : 'border-transparent text-olive-50/62 hover:text-olive-50 hover:bg-white/6',
  ].join(' ');

export function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();
  const mainRef = useRef<HTMLElement>(null);

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    setMenuOpen(false);
    mainRef.current?.scrollTo?.(0, 0);
  }, [pathname]);

  return (
    <div className="flex h-dvh bg-cream">
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
          'fixed inset-y-0 left-0 z-40 w-[236px] flex flex-col',
          'bg-gradient-to-b from-olive-800 to-sidebar-deep',
          'transition-transform duration-200',
          'md:relative md:translate-x-0',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="px-[22px] pt-[26px] pb-[22px] border-b border-white/10">
          <p className="font-serif font-semibold text-[27px] leading-none text-olive-50 tracking-[.01em]">
            La Oliva
          </p>
          <p className="font-mono text-[8.5px] tracking-[.32em] text-olive-300 mt-[7px] uppercase">
            Catering · con altura
          </p>
        </div>
        <nav className="flex-1 py-[18px] flex flex-col gap-0.5">
          <p className="font-mono text-[9px] tracking-[.2em] text-olive-300/60 uppercase px-[22px] pt-[6px] pb-2">
            Gestión
          </p>
          {NAV_ITEMS.filter(
            ({ allowedRoles }) => !allowedRoles || (user && allowedRoles.includes(user.role)),
          ).map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={navLinkClass}>
              <Icon name={icon} size={17} />
              {label}
            </NavLink>
          ))}
          {user?.role === ROLES.SUPER_ADMIN && (
            <>
              <div className="h-px bg-white/12 mx-[22px] my-[14px]" />
              <p className="font-mono text-[9px] tracking-[.2em] text-olive-300/60 uppercase px-[22px] pt-0.5 pb-2">
                Administración
              </p>
              {SUPER_ADMIN_NAV_ITEMS.map(({ to, label, icon }) => (
                <NavLink key={to} to={to} className={navLinkClass}>
                  <Icon name={icon} size={17} />
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
        <div className="border-t border-white/10 px-[18px] py-[14px] flex items-center gap-[11px]">
          <div className="w-[34px] h-[34px] rounded-full bg-olive-400 text-sidebar-deep flex items-center justify-center font-bold text-[13px] shrink-0">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-olive-50 leading-tight truncate">
              {user?.username}
            </p>
            <p className="font-mono text-[9.5px] tracking-[.08em] text-olive-300/75 uppercase">
              {user && ROLE_LABELS[user.role]}
            </p>
          </div>
          <IconButton
            icon="logout"
            label="Cerrar sesión"
            onClick={handleLogout}
            size={16}
            title="Cerrar sesión"
            className="text-olive-50/50 hover:text-olive-50 shrink-0"
          />
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center gap-3 px-4 h-12 bg-gradient-to-b from-olive-800 to-sidebar-deep md:hidden shrink-0">
          <IconButton
            icon="menu"
            label="Abrir menú"
            onClick={() => setMenuOpen(true)}
            size={20}
            className="text-olive-50/60 hover:text-olive-50"
          />
          <p className="font-serif font-semibold text-[20px] leading-none text-olive-50">
            La Oliva
          </p>
        </header>
        <main ref={mainRef} className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
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
            error: '!bg-alert-bg !text-alert !border-toast-error-border',
            success: '!bg-ok-bg !text-ok !border-toast-success-border',
            icon: 'text-current',
          },
        }}
      />
    </div>
  );
}
