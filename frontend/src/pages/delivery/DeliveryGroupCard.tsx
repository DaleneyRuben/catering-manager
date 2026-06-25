import { Icon } from '../../components/ui/Icon';
import { DeliveryPersonRow } from './DeliveryPersonRow';
import type { DeliveryGroup } from '../../types/delivery';

// Tailwind scans source files for complete class-name literals, so each palette
// entry must spell out full class names here — building them from fragments at
// runtime (e.g. `bg-${n}`) would not be picked up by the build.
const GROUP_PALETTE = [
  {
    card: 'bg-delivery-1-card-bg border border-delivery-1-card-border border-l-4 border-l-delivery-1-accent',
    icon: 'text-delivery-1-accent',
    label: 'text-delivery-1-chip-text',
    chip: 'bg-delivery-1-chip-bg text-delivery-1-chip-text',
    avatar: 'bg-delivery-1-chip-bg border-delivery-1-avatar-border text-delivery-1-chip-text',
    rowBorder: 'border-delivery-1-card-border',
  },
  {
    card: 'bg-delivery-2-card-bg border border-delivery-2-card-border border-l-4 border-l-delivery-2-accent',
    icon: 'text-delivery-2-accent',
    label: 'text-delivery-2-chip-text',
    chip: 'bg-delivery-2-chip-bg text-delivery-2-chip-text',
    avatar: 'bg-delivery-2-chip-bg border-delivery-2-avatar-border text-delivery-2-chip-text',
    rowBorder: 'border-delivery-2-card-border',
  },
  {
    card: 'bg-delivery-3-card-bg border border-delivery-3-card-border border-l-4 border-l-delivery-3-accent',
    icon: 'text-delivery-3-accent',
    label: 'text-delivery-3-chip-text',
    chip: 'bg-delivery-3-chip-bg text-delivery-3-chip-text',
    avatar: 'bg-delivery-3-chip-bg border-delivery-3-avatar-border text-delivery-3-chip-text',
    rowBorder: 'border-delivery-3-card-border',
  },
  {
    card: 'bg-delivery-4-card-bg border border-delivery-4-card-border border-l-4 border-l-delivery-4-accent',
    icon: 'text-delivery-4-accent',
    label: 'text-delivery-4-chip-text',
    chip: 'bg-delivery-4-chip-bg text-delivery-4-chip-text',
    avatar: 'bg-delivery-4-chip-bg border-delivery-4-avatar-border text-delivery-4-chip-text',
    rowBorder: 'border-delivery-4-card-border',
  },
  {
    card: 'bg-delivery-5-card-bg border border-delivery-5-card-border border-l-4 border-l-delivery-5-accent',
    icon: 'text-delivery-5-accent',
    label: 'text-delivery-5-chip-text',
    chip: 'bg-delivery-5-chip-bg text-delivery-5-chip-text',
    avatar: 'bg-delivery-5-chip-bg border-delivery-5-avatar-border text-delivery-5-chip-text',
    rowBorder: 'border-delivery-5-card-border',
  },
] as const;

export const GROUP_PALETTE_SIZE = GROUP_PALETTE.length;

interface Props {
  group: DeliveryGroup;
  colorIndex: number;
}

export function DeliveryGroupCard({ group, colorIndex }: Props) {
  const c = GROUP_PALETTE[colorIndex % GROUP_PALETTE.length];

  return (
    <div className={`rounded-[13px] px-[17px] py-[15px] flex flex-col gap-[11px] ${c.card}`}>
      <div className="flex items-center gap-[9px]">
        <Icon name="users" size={16} className={c.icon} />
        <span
          className={`font-mono text-[10.5px] font-semibold tracking-[.1em] uppercase flex-1 min-w-0 ${c.label}`}
        >
          Entrega conjunta
        </span>
        <span
          className={`font-mono text-[10px] font-semibold tracking-[.05em] rounded-full px-[9px] py-[3px] whitespace-nowrap ${c.chip}`}
        >
          {group.members.length} clientes
        </span>
      </div>
      <div className="flex flex-col">
        {group.members.map((m) => (
          <DeliveryPersonRow
            key={m.id}
            person={m}
            avatarClass={c.avatar}
            rowBorderClass={c.rowBorder}
          />
        ))}
      </div>
    </div>
  );
}
