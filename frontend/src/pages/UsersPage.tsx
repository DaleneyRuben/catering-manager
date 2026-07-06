import { useState } from 'react';
import { Button } from '@ui/Button';
import { Icon } from '@ui/Icon';
import { PageHeader } from '@ui/PageHeader';
import { UsersPageSkeleton } from '@/features/users/components/UsersPageSkeleton';
import { UserRoleStats } from '@/features/users/components/UserRoleStats';
import { UserTable } from '@/features/users/components/UserTable';
import { useUsers, type AppUser } from '@/features/users/hooks/useUsers';
import { useAuth } from '@/features/auth/AuthContext';
import { UserModal } from '@/features/users/components/UserModal';
import { LoginHistoryModal } from '@/features/users/components/LoginHistoryModal';

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const { users, isLoading, isSaving, create, update, remove } = useUsers();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [historyUser, setHistoryUser] = useState<AppUser | null>(null);
  const [query, setQuery] = useState('');

  if (isLoading) return <UsersPageSkeleton />;

  const filteredUsers = users.filter((u) => u.username.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
      <PageHeader
        label="Equipo"
        title="Usuarios"
        action={
          <Button onClick={() => setCreateOpen(true)} leftIcon="plus">
            Agregar usuario
          </Button>
        }
      />

      <UserRoleStats users={users} />

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar usuario…"
            className="w-full pl-[38px] pr-[14px] py-2.5 text-[13.5px] border border-rule rounded-[9px] bg-paper placeholder:text-faint focus:outline-none focus:border-olive-600"
          />
          <Icon
            name="search"
            size={16}
            className="absolute left-[13px] top-1/2 -translate-y-1/2 text-faint"
          />
        </div>
        <p className="text-[11.5px] font-mono uppercase tracking-[.04em] text-muted">
          {users.length} usuarios
        </p>
      </div>

      <UserTable users={filteredUsers} onHistory={setHistoryUser} onEdit={setEditUser} />

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

      {historyUser && <LoginHistoryModal user={historyUser} onClose={() => setHistoryUser(null)} />}
    </div>
  );
}
