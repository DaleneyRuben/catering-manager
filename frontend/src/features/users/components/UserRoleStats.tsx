import { Icon } from '@ui/Icon';
import { ROLES, ROLE_LABELS } from '@/constants/roles';
import { ROLE_ICON_CLASSES } from '@/features/users/roleStyles';
import type { AppUser } from '@/features/users/hooks/useUsers';
import type { UserRole } from '@/features/auth/AuthContext';

const ROLE_ICONS: Record<UserRole, string> = {
  super_admin: 'shield-check',
  admin: 'shield',
  kitchen: 'utensils',
  delivery: 'motorcycle',
};

const ROLE_ORDER: UserRole[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.KITCHEN, ROLES.DELIVERY];

interface Props {
  users: AppUser[];
}

export function UserRoleStats({ users }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-[18px] mb-5">
      {ROLE_ORDER.map((role) => (
        <div
          key={role}
          className="bg-paper border border-rule rounded-[13px] px-5 py-[18px] flex items-center gap-3.5"
        >
          <span
            className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 ${ROLE_ICON_CLASSES[role]}`}
          >
            <Icon name={ROLE_ICONS[role]} size={19} stroke={1.6} />
          </span>
          <div>
            <p className="font-serif font-semibold text-[26px] leading-none text-ink">
              {users.filter((u) => u.role === role).length}
            </p>
            <p className="text-[12px] text-muted mt-1">{ROLE_LABELS[role]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
