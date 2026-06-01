import type { Plan } from '../../types/client';
import { MEAL_LABELS } from '../../constants/meals';
import { MEAL_KEYS } from './types';

export function PlanCard({
  plan,
  clientCount,
  onClick,
}: {
  plan: Plan;
  clientCount: number;
  onClick: () => void;
}) {
  const includedMeals = MEAL_KEYS.filter((m) => plan.meals.includes(m));

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      className="p-[18px] rounded-lg cursor-pointer bg-paper border border-rule hover:border-olive-700 hover:shadow-[0_2px_12px_rgba(20,40,6,0.08)] transition-all"
    >
      <div className="flex items-center">
        <p className="font-mono text-[10.5px] uppercase tracking-[.14em] text-muted">Plan</p>
      </div>
      <p className="font-serif text-[24px] mt-1 text-ink">{plan.name}</p>
      <p className="font-mono font-semibold text-[30px] mt-1.5 text-olive-800">
        {plan.price}
        <span className="text-[12px] text-muted">/mes</span>
      </p>
      <div className="flex flex-wrap gap-1.5 mt-3.5">
        {includedMeals.map((m) => (
          <span
            key={m}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-cream-2 text-ink-2"
          >
            <span className="w-2 h-2 rounded-[2px] bg-olive-600 shrink-0" />
            {MEAL_LABELS[m]}
          </span>
        ))}
      </div>
      <div className="h-px bg-rule my-3.5" />
      <p className="font-mono text-[11px] text-muted">
        {clientCount} cliente{clientCount !== 1 ? 's' : ''} activos
      </p>
    </div>
  );
}
