import { Icon } from '@ui/Icon';
import { IconButton } from '@ui/IconButton';
import { formatShortDate } from '@/utils/format';
import { formatMoney } from '@/features/finance/utils/format';
import type { Movement } from '@/features/finance/types';

interface Props {
  movements: Movement[];
  onEdit: (movement: Movement) => void;
  onDuplicate: (movement: Movement) => void;
  onDelete: (movement: Movement) => void;
}

const actionCls =
  'p-1.5 rounded-[7px] text-muted hover:bg-movement-action-hover hover:text-ink cursor-pointer';

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

function MovementRow({
  movement,
  onEdit,
  onDuplicate,
  onDelete,
}: { movement: Movement } & Omit<Props, 'movements'>) {
  const isIncome = movement.kind === 'income';

  return (
    <div
      data-testid={`movement-${movement.id}`}
      className="group flex items-center gap-4 px-6 py-3 border-b border-cream-2 last:border-b-0 hover:bg-row-hover transition-colors"
    >
      <span className="font-mono text-[11.5px] text-faint w-11 shrink-0 tabular-nums">
        {formatShortDate(movement.date)}
      </span>
      <span
        className={`w-[7px] h-[7px] rounded-full shrink-0 ${
          isIncome ? 'bg-olive-300' : 'bg-expense-dot'
        }`}
      />

      <div className="flex-1 min-w-0 flex items-center gap-2.5 flex-wrap">
        <span className={`text-[13.5px] text-ink ${isIncome ? 'font-semibold' : 'font-medium'}`}>
          {movement.label}
        </span>
        <span className="font-mono text-[9.5px] tracking-[.09em] uppercase text-muted bg-movement-tag-bg rounded-[5px] px-[7px] py-[3px]">
          {isIncome ? 'Suscripción' : 'Gasto'}
        </span>
        {movement.description && (
          <span className="text-[12.5px] text-faint">{movement.description}</span>
        )}
      </div>

      {/* An income row carries no affordance at all: nothing on one is a human's to revise, and a
          disabled control would only invite the question (ADR-008). */}
      {!isIncome && (
        <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <IconButton
            icon="pencil"
            label="Editar"
            size={15}
            onClick={() => onEdit(movement)}
            className={actionCls}
          />
          {/* The daily delivery payment and the rent instalments are entered this way, so it
              earns a place on the row rather than an overflow menu. */}
          <IconButton
            icon="copy"
            label="Duplicar"
            size={15}
            onClick={() => onDuplicate(movement)}
            className={actionCls}
          />
          <IconButton
            icon="trash"
            label="Eliminar"
            size={15}
            onClick={() => onDelete(movement)}
            className={actionCls}
          />
        </div>
      )}

      <span
        className={`font-mono text-[13px] font-semibold w-24 text-right shrink-0 tabular-nums ${
          isIncome ? 'text-olive-700' : 'text-danger'
        }`}
      >
        {isIncome ? '+' : '−'}
        {formatMoney(movement.amount)}
      </span>
    </div>
  );
}

export function MovementsList({ movements, onEdit, onDuplicate, onDelete }: Props) {
  return (
    <div className="bg-paper border border-rule rounded-[13px] overflow-hidden">
      <div className="flex items-baseline justify-between gap-3 px-6 pt-5 pb-3.5 border-b border-cream-2">
        <h2 className="font-serif font-semibold text-[21px] text-ink">Movimientos</h2>
        <span className="font-mono text-[10.5px] tracking-[.06em] uppercase text-faint">
          Más reciente primero
        </span>
      </div>

      {movements.length === 0 ? (
        <EmptyState />
      ) : (
        movements.map((movement) => (
          <MovementRow
            key={`${movement.kind}-${movement.id}`}
            movement={movement}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}
