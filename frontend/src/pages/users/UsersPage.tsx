import { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { PageLoader } from '../../components/ui/PageLoader';
import { useUsers, type AppUser } from '../../hooks/useUsers';
import { useAuth } from '../../contexts/AuthContext';
import { UserModal } from './UserModal';
import type { UserRole } from '../../contexts/AuthContext';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  delivery: 'Delivery',
};

const ROLE_CLASSES: Record<UserRole, string> = {
  admin: 'bg-olive-100 text-olive-800',
  manager: 'bg-cream-2 text-ink-2',
  delivery: 'bg-warn-bg text-warn',
};

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const { users, isLoading, isSaving, create, update, remove } = useUsers();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);

  if (isLoading) return <PageLoader />;

  return (
    <div className="p-7 max-w-[860px] mx-auto">
      <div className="flex items-end gap-6 mb-7 flex-wrap">
        <div>
          <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-2">
            Administración
          </p>
          <h1 className="font-serif text-[44px] leading-none text-ink">Usuarios</h1>
          <p className="text-[13px] text-muted mt-2.5">
            Gestioná el acceso al sistema. Solo los administradores pueden ver esta sección.
          </p>
        </div>
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors"
          >
            <Icon name="plus" size={14} />
            Agregar usuario
          </button>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="py-16 text-center bg-paper border border-rule rounded-lg">
          <p className="font-semibold text-ink">Sin usuarios</p>
          <p className="text-sm text-muted mt-1">
            Agregá el primer usuario usando el botón de arriba.
          </p>
        </div>
      ) : (
        <div className="bg-paper border border-rule rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rule">
                <th className="text-left px-5 py-3 text-[11px] font-mono uppercase tracking-wider text-muted">
                  Usuario
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-mono uppercase tracking-wider text-muted">
                  Rol
                </th>
                <th className="w-12" scope="col">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-rule last:border-0 hover:bg-cream transition-colors"
                >
                  <td className="px-5 py-3.5 text-[13px] font-medium text-ink">{u.username}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-medium ${ROLE_CLASSES[u.role]}`}
                    >
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setEditUser(u)}
                      className="text-muted hover:text-ink transition-colors"
                      aria-label={`Editar ${u.username}`}
                    >
                      <Icon name="settings" size={15} />
                    </button>
                  </td>
                </tr>
              ))}
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
