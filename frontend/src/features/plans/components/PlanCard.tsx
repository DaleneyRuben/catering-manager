import type { Plan } from '@/features/clients/types';
import { MEAL_LABELS } from '@/constants/meals';
import { Icon } from '@/components/ui/Icon';
import { MEAL_KEYS } from '@/features/plans/types';
import { getPlanTier, TIER_STYLES } from '@/features/plans/tiers';

export function PlanCard({
  plan,
  clientCount,
  allPrices,
  onEdit,
  onDelete,
}: {
  plan: Plan;
  clientCount: number;
  allPrices: number[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const includedMeals = MEAL_KEYS.filter((m) => plan.meals.includes(m));
  const tier = getPlanTier(plan.price, allPrices);
  const { band, bandBorder } = TIER_STYLES[tier];
  const clientsLabel = clientCount === 1 ? '1 cliente activo' : `${clientCount} clientes activos`;

  return (
    <div
      data-testid={`plan-card-${plan.id}`}
      className="bg-paper border border-rule rounded-[14px] overflow-hidden flex flex-col hover:shadow-[var(--shadow-card-hover)] hover:border-olive-200 transition-all"
    >
      <div
        className="px-5 pt-[15px] pb-[14px] border-b"
        style={{ background: band, borderColor: bandBorder }}
      >
        <p className="font-mono text-[9.5px] uppercase tracking-[.16em] text-faint mb-1.5">Plan</p>
        <div className="flex items-baseline justify-between gap-3.5">
          <h3 className="font-serif font-semibold text-[24px] leading-[1.1] text-ink">
            {plan.name}
          </h3>
          <div className="flex items-baseline gap-1 shrink-0">
            <span className="font-serif font-semibold text-[30px] leading-none text-ink tabular-nums">
              {plan.price.toLocaleString('es-BO')}
            </span>
            <span className="font-mono text-[11px] text-faint">/mes</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 flex-1">
        <p className="font-mono text-[9.5px] uppercase tracking-[.14em] text-faint mb-[11px]">
          Tiempos incluidos · {includedMeals.length} de {MEAL_KEYS.length}
        </p>
        <div className="flex flex-wrap gap-[7px]">
          {includedMeals.map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-1.5 bg-chip-bg border border-chip-border rounded-full pl-[9px] pr-[11px] py-1 text-[12px] font-medium text-chip-text whitespace-nowrap"
            >
              <span className="w-[5px] h-[5px] rounded-full bg-chip-dot shrink-0" />
              {MEAL_LABELS[m]}
            </span>
          ))}
        </div>
      </div>

      <div className="px-5 py-3.5 border-t border-cream-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon name="users" size={15} stroke={1.6} className="text-faint" />
          <span className="text-[12.5px] text-muted">{clientsLabel}</span>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={onDelete}
            aria-label="Eliminar plan"
            className="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-plan-delete hover:bg-danger-bg hover:text-danger transition-colors"
          >
            <Icon name="trash" size={16} stroke={1.7} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            aria-label="Editar plan"
            className="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-plan-edit hover:bg-olive-100 hover:text-olive-700 transition-colors"
          >
            <Icon name="pencil" size={16} stroke={1.7} />
          </button>
        </div>
      </div>
    </div>
  );
}
