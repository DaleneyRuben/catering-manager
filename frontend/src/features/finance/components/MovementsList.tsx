import { Icon } from '@ui/Icon';
import { MovementRow } from '@/features/finance/components/MovementRow';
import type { Movement } from '@/features/finance/types';

interface Props {
  movements: Movement[];
  onEdit: (movement: Movement) => void;
  onDuplicate: (movement: Movement) => void;
  onDelete: (movement: Movement) => void;
}

function EmptyState() {
  return (
    <div className="px-6 pt-16 pb-[70px] flex flex-col items-center gap-3.5 text-center">
      <span className="w-[46px] h-[46px] rounded-xl bg-movement-tag-bg text-placeholder flex items-center justify-center">
        <Icon name="wallet" size={22} />
      </span>
      <p className="font-serif text-[22px] font-semibold text-ink-2">Aún no hay movimientos</p>
      <p className="text-[13px] text-faint max-w-[280px] leading-[1.6]">
        El mes recién empieza. Los ingresos aparecen al marcar una suscripción como pagada.
      </p>
    </div>
  );
}

export function MovementsList({ movements, onEdit, onDuplicate, onDelete }: Props) {
  return (
    // The card does not clip: a row's action menu has to escape it, so the last row carries the
    // rounded corner instead of overflow-hidden doing it for the whole card.
    <div className="bg-paper border border-rule rounded-[13px]">
      <div className="flex items-baseline justify-between gap-3 px-6 pt-5 pb-3.5 border-b border-cream-2">
        <h2 className="font-serif font-semibold text-[21px] text-ink">Movimientos</h2>
        <span className="font-mono text-[10.5px] tracking-[.06em] uppercase text-faint">
          Más reciente primero
        </span>
      </div>

      {movements.length === 0 ? (
        <EmptyState />
      ) : (
        movements.map((movement, index) => (
          <MovementRow
            key={`${movement.kind}-${movement.id}`}
            movement={movement}
            isLast={index === movements.length - 1}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}
