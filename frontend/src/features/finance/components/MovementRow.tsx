import { Link } from 'react-router-dom';
import { Icon } from '@ui/Icon';
import { OverflowMenu } from '@ui/OverflowMenu';
import { formatShortDate } from '@/utils/format';
import { formatMoney } from '@/features/finance/utils/format';
import { WhoChip } from '@/features/finance/components/WhoChip';
import type { Movement } from '@/features/finance/types';

interface Props {
  movement: Movement;
  isLast?: boolean;
  onEdit: (movement: Movement) => void;
  onDuplicate: (movement: Movement) => void;
  onDelete: (movement: Movement) => void;
}

const TAG_CLS =
  'font-mono text-[9.5px] tracking-[.09em] uppercase rounded-[5px] px-[7px] py-[3px] shrink-0';

// A 7px dot and the amount's colour carried the whole distinction in v1, which is thin in a long
// interleaved list. The glyph points the way the money moved and the income row is tinted; the
// interleaving itself stays, since a month reads as one cash book.
function Glyph({ isIncome }: { isIncome: boolean }) {
  return (
    <span
      title={isIncome ? 'Ingreso' : 'Gasto'}
      className={`w-[23px] h-[23px] rounded-[7px] shrink-0 flex items-center justify-center ${
        isIncome ? 'bg-income-icon-bg text-olive-700' : 'bg-expense-icon-bg text-danger'
      }`}
    >
      <Icon name={isIncome ? 'arrow-up' : 'arrow-down'} size={12} stroke={2.6} />
    </span>
  );
}

// The client's name is itself the link, so leading to their profile reads as a property of the
// row's subject instead of a fourth action sitting beside the expense controls. A soft-deleted
// client keeps counting in the register, so their row stays — marked, and leading nowhere.
function IncomeTitle({ movement }: { movement: Movement }) {
  if (movement.clientArchived || !movement.clientId) {
    return (
      <span className="inline-flex items-center gap-[7px]">
        <span className="text-[13.5px] font-semibold text-empty-text">{movement.label}</span>
        <span className={`${TAG_CLS} text-empty-text border border-archived-tag-border`}>
          Cliente archivado
        </span>
      </span>
    );
  }

  return (
    <Link
      to={`/clientes/${movement.clientId}`}
      className="text-[13.5px] font-semibold text-income-link border-b border-income-link/30 pb-px hover:text-olive-800 hover:border-olive-800 transition-colors"
    >
      {movement.label}
    </Link>
  );
}

export function MovementRow({ movement, isLast, onEdit, onDuplicate, onDelete }: Props) {
  const isIncome = movement.kind === 'income';

  return (
    <div
      data-testid={`movement-${movement.id}`}
      className={`relative flex items-center gap-4 px-6 py-[11px] transition-colors hover:bg-row-hover ${
        isIncome ? 'bg-income-row-bg' : ''
      } ${isLast ? 'rounded-b-[12px]' : 'border-b border-cream-2'}`}
    >
      <span className="font-mono text-[11.5px] text-faint w-[42px] shrink-0 tabular-nums">
        {formatShortDate(movement.date)}
      </span>

      <Glyph isIncome={isIncome} />

      <div className="flex-1 min-w-0 flex items-center gap-[9px] flex-wrap">
        {isIncome ? (
          <IncomeTitle movement={movement} />
        ) : (
          // An expense is not attached to anyone, so its note is the title and the category it was
          // filed against is the tag. With no note the category carries both.
          <span className="text-[13.5px] text-ink">{movement.description ?? movement.label}</span>
        )}
        <span
          className={
            isIncome
              ? `${TAG_CLS} text-olive-600 bg-income-tag-bg`
              : `${TAG_CLS} text-muted bg-movement-tag-bg`
          }
        >
          {isIncome ? 'Suscripción' : movement.label}
        </span>
      </div>

      <WhoChip name={movement.registeredByName} registeredAt={movement.registeredAt} />

      <span
        className={`font-mono text-[13px] font-semibold w-[92px] text-right shrink-0 tabular-nums ${
          isIncome ? 'text-olive-700' : 'text-danger'
        }`}
      >
        {isIncome ? '+' : '−'}
        {formatMoney(movement.amount)}
      </span>

      {/* Nothing on an income row is a human's to revise, and a disabled control would only invite
          the question (ADR-008) — so the slot is held open rather than filled. */}
      {isIncome ? (
        <span className="w-[28px] shrink-0" />
      ) : (
        <OverflowMenu
          variant="bare"
          label="Acciones del gasto"
          items={[
            { label: 'Editar', icon: 'pencil', onClick: () => onEdit(movement) },
            // The daily delivery payment and the rent instalments are entered this way, so the
            // label states the date it lands on rather than leaving it to be discovered.
            {
              label: 'Duplicar con la fecha de hoy',
              icon: 'copy',
              onClick: () => onDuplicate(movement),
            },
            {
              label: 'Eliminar',
              icon: 'trash',
              variant: 'alert',
              onClick: () => onDelete(movement),
            },
          ]}
        />
      )}
    </div>
  );
}
