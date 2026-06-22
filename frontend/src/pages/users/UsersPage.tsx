import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { useUsers, type AppUser } from '../../hooks/useUsers';
import { useAuth } from '../../contexts/AuthContext';
import { UserModal } from './UserModal';
import { initials } from '../../utils/string';
import { formatDateTime } from '../../utils/format';
import type { UserRole } from '../../contexts/AuthContext';
import { ROLES, ROLE_LABELS } from '../../constants/roles';

const ROLE_CLASSES: Record<UserRole, string> = {
  super_admin: 'bg-ok-bg text-ok',
  admin: 'bg-olive-100 text-olive-700',
  kitchen: 'bg-warn-bg text-warn',
  delivery: 'bg-taupe-bg text-taupe',
};

const ROLE_ICONS: Record<UserRole, string> = {
  super_admin: 'shield-check',
  admin: 'shield',
  kitchen: 'utensils',
  delivery: 'motorcycle',
};

const ROLE_ORDER: UserRole[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.KITCHEN, ROLES.DELIVERY];

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const { users, isLoading, isSaving, create, update, remove } = useUsers();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [query, setQuery] = useState('');

  if (isLoading) return <PageLoader />;

  const filteredUsers = users.filter((u) => u.username.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="px-4 py-5 lg:p-7 max-w-[1320px] mx-auto">
      <PageHeader
        label="Equipo"
        title="Usuarios"
        action={
          <Button onClick={() => setCreateOpen(true)} leftIcon="plus">
            Agregar usuario
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[18px] mb-5">
        {ROLE_ORDER.map((role) => (
          <div
            key={role}
            className="bg-paper border border-rule rounded-[13px] px-5 py-[18px] flex items-center gap-3.5"
          >
            <span
              className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 ${ROLE_CLASSES[role]}`}
            >
              <Icon name={ROLE_ICONS[role]} size={19} stroke={1.6} />
            </span>
            <div>
              <p className="font-serif font-semibold text-[26px] leading-none text-ink">
                {users.filter((u) => u.role === role).length}
              </p>
              <p className="text-xs text-muted mt-1">{ROLE_LABELS[role]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar usuario…"
            className="w-full pl-[38px] pr-3 py-2.5 text-[13.5px] border border-rule rounded-[9px] bg-paper focus:outline-none focus:border-olive-600"
          />
          <Icon
            name="search"
            size={16}
            className="absolute left-[13px] top-1/2 -translate-y-1/2 text-muted"
          />
        </div>
        <p className="text-[11.5px] font-mono uppercase tracking-[.04em] text-muted">
          {users.length} usuarios
        </p>
      </div>

      {users.length === 0 ? (
        <div className="py-16 text-center bg-paper border border-rule rounded-lg">
          <p className="font-semibold text-ink">Sin usuarios</p>
          <p className="text-sm text-muted mt-1">
            Agregá el primer usuario usando el botón de arriba.
          </p>
        </div>
      ) : (
        <div className="bg-paper border border-rule rounded-[13px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-olive-50">
                <th className="text-left px-[22px] py-[13px] text-[10px] font-mono font-semibold uppercase tracking-[.13em] text-muted border-b border-rule">
                  Usuario
                </th>
                <th className="text-left px-[22px] py-[13px] text-[10px] font-mono font-semibold uppercase tracking-[.13em] text-muted border-b border-rule">
                  Rol
                </th>
                <th className="text-left px-[22px] py-[13px] text-[10px] font-mono font-semibold uppercase tracking-[.13em] text-muted border-b border-rule">
                  Último acceso
                </th>
                <th className="text-left px-[22px] py-[13px] text-[10px] font-mono font-semibold uppercase tracking-[.13em] text-muted border-b border-rule">
                  Estado
                </th>
                <th className="w-12 border-b border-rule" scope="col">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isActive = !u.deletedAt;
                return (
                  <tr
                    key={u.id}
                    className="border-b border-cream-2 last:border-0 hover:bg-[#f5f7f0] transition-colors"
                  >
                    <td className="px-[22px] py-[13px]">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-semibold shrink-0 ${ROLE_CLASSES[u.role]}`}
                        >
                          {initials(u.username)}
                        </div>
                        <p className="text-sm font-semibold text-ink">{u.username}</p>
                      </div>
                    </td>
                    <td className="px-[22px] py-[13px]">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-[7px] text-[12.5px] font-semibold ${ROLE_CLASSES[u.role]}`}
                      >
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-[22px] py-[13px] text-[12px] font-mono text-muted tabular-nums whitespace-nowrap">
                      {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Nunca'}
                    </td>
                    <td className="px-[22px] py-[13px]">
                      <span
                        className={`inline-flex items-center gap-[7px] text-[12.5px] font-semibold ${
                          isActive ? 'text-ok' : 'text-muted'
                        }`}
                      >
                        <span
                          className={`w-[7px] h-[7px] rounded-full ${isActive ? 'bg-ok' : 'bg-rule-2'}`}
                        />
                        {isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-[22px] py-[13px] text-right">
                      <button
                        type="button"
                        onClick={() => setEditUser(u)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-ink-2 hover:bg-cream-2 transition-colors"
                        aria-label={`Editar ${u.username}`}
                      >
                        <Icon name="settings" size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {createOpen && (
        <UserModal
          mode="create"
          isSaving={isSaving}
          onSave={create}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {editUser && (
        <UserModal
          mode="edit"
          user={editUser}
          isSelf={currentUser?.id === editUser.id}
          isSaving={isSaving}
          onSave={(draft) => update(editUser.id, draft)}
          onDelete={() => remove(editUser.id)}
          onClose={() => setEditUser(null)}
        />
      )}
    </div>
  );
}
