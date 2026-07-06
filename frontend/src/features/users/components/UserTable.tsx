import { IconButton } from '@ui/IconButton';
import { initials } from '@/utils/string';
import { formatLastSeen, isOnline } from '@/utils/format';
import { ROLE_LABELS } from '@/constants/roles';
import { ROLE_CLASSES, ROLE_ICON_CLASSES } from '@/features/users/roleStyles';
import type { AppUser } from '@/features/users/hooks/useUsers';

interface Props {
  users: AppUser[];
  onHistory: (user: AppUser) => void;
  onEdit: (user: AppUser) => void;
}

export function UserTable({ users, onHistory, onEdit }: Props) {
  if (users.length === 0) {
    return (
      <div className="py-16 text-center bg-paper border border-rule rounded-lg">
        <p className="font-semibold text-ink">Sin usuarios</p>
        <p className="text-sm text-muted mt-1">
          Agregá el primer usuario usando el botón de arriba.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-paper border border-rule rounded-[13px] overflow-hidden">
      <div className="overflow-x-auto">
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
            {users.map((u) => {
              const isActive = !!u.lastLoginAt && isOnline(u.lastLoginAt);
              return (
                <tr
                  key={u.id}
                  className="border-b border-cream-2 last:border-0 hover:bg-row-hover transition-colors"
                >
                  <td className="px-[22px] py-[13px]">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-[12px] font-semibold shrink-0 ${ROLE_ICON_CLASSES[u.role]}`}
                      >
                        {initials(u.username)}
                      </div>
                      <p className="text-[14px] font-semibold text-ink">{u.username}</p>
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
                    {u.lastLoginAt ? formatLastSeen(u.lastLoginAt) : 'Nunca'}
                  </td>
                  <td className="px-[22px] py-[13px]">
                    <span
                      className={`inline-flex items-center gap-[7px] text-[12.5px] font-semibold ${
                        isActive ? 'text-ok' : 'text-faint'
                      }`}
                    >
                      <span
                        className={`w-[7px] h-[7px] rounded-full ${isActive ? 'bg-ok' : 'bg-rule-2'}`}
                      />
                      {isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-[22px] py-[13px] text-right whitespace-nowrap">
                    <IconButton
                      icon="history"
                      label={`Historial de ${u.username}`}
                      onClick={() => onHistory(u)}
                      size={15}
                      className="w-8 h-8 rounded-lg text-faint hover:text-ink-2 hover:bg-cream-2"
                    />
                    <IconButton
                      icon="settings"
                      label={`Editar ${u.username}`}
                      onClick={() => onEdit(u)}
                      size={15}
                      className="w-8 h-8 rounded-lg text-faint hover:text-ink-2 hover:bg-cream-2"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
