import { Button } from '@ui/Button';
import { Icon } from '@ui/Icon';
import { MovementRow } from '@/features/finance/components/MovementRow';
import { MovementsFilterBar } from '@/features/finance/components/MovementsFilterBar';
import type { FilterBarProps } from '@/features/finance/components/MovementsFilterBar';
import { noMatchHint } from '@/features/finance/utils/filters';
import type { Movement } from '@/features/finance/types';

interface Props {
  movements: Movement[];
  filters: FilterBarProps;
  month: string;
  // Every movement the month holds, filters or not. It is what tells the two empty states apart.
  monthCount: number;
  onEdit: (movement: Movement) => void;
  onDuplicate: (movement: Movement) => void;
  onDelete: (movement: Movement) => void;
}

function EmptyShell({
  icon,
  title,
  children,
}: React.PropsWithChildren<{ icon: string; title: string }>) {
  return (
    <div className="px-6 pt-[52px] pb-[58px] flex flex-col items-center gap-3.5 text-center">
      <span className="w-[46px] h-[46px] rounded-xl bg-movement-tag-bg text-placeholder flex items-center justify-center">
        <Icon name={icon} size={22} />
      </span>
      <p className="font-serif text-[22px] font-semibold text-ink-2">{title}</p>
      {children}
    </div>
  );
}

export function MovementsList({
  movements,
  filters,
  month,
  monthCount,
  onEdit,
  onDuplicate,
  onDelete,
}: Props) {
  // A month with nothing in it and a filter that matched nothing are different statements. Saying
  // "aún no hay movimientos" over a month holding twelve of them would read as data loss.
  const nothingMatched = movements.length === 0 && monthCount > 0;

  return (
    // The card does not clip: a row's action menu has to escape it, so the last row carries the
    // rounded corner instead of overflow-hidden doing it for the whole card.
    <div className="bg-paper border border-rule rounded-[13px]">
      <MovementsFilterBar {...filters} />

      {movements.length > 0 &&
        movements.map((movement, index) => (
          <MovementRow
            key={`${movement.kind}-${movement.id}`}
            movement={movement}
            isLast={index === movements.length - 1}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ))}

      {nothingMatched && (
        <EmptyShell icon="search" title="Ningún movimiento coincide">
          <p className="text-[13px] text-faint max-w-[330px] leading-[1.6]">
            {noMatchHint(monthCount, month, filters.filters)}
          </p>
          <Button variant="secondary" onClick={filters.onClearAll} className="mt-1">
            Limpiar filtros
          </Button>
        </EmptyShell>
      )}

      {movements.length === 0 && monthCount === 0 && (
        <EmptyShell icon="wallet" title="Aún no hay movimientos">
          <p className="text-[13px] text-faint max-w-[290px] leading-[1.6]">
            El mes recién empieza. Los ingresos aparecen al marcar una suscripción como pagada.
          </p>
        </EmptyShell>
      )}
    </div>
  );
}
