import type { Plan } from '../../types/client';
import { MEAL_KEYS, MEAL_LABELS } from './types';

export function PlanCard({
  plan,
  isSelected,
  clientCount,
  onClick,
}: {
  plan: Plan;
  isSelected: boolean;
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
      style={{
        padding: 18,
        borderRadius: 8,
        cursor: 'pointer',
        background: isSelected ? '#1e3c0a' : 'var(--color-paper)',
        color: isSelected ? '#fff' : 'var(--color-ink)',
        border: `1px solid ${isSelected ? '#1e3c0a' : 'var(--color-rule)'}`,
        transition: 'all .15s',
      }}
    >
      <p
        className="font-mono text-[10.5px] uppercase tracking-[.14em]"
        style={{ color: isSelected ? '#a8c374' : 'var(--color-muted)' }}
      >
        Plan
      </p>
      <p className="font-serif text-[24px] mt-1">{plan.name}</p>
      <p
        className="font-mono font-semibold text-[30px] mt-1.5"
        style={{ color: isSelected ? '#fff' : '#1e3c0a' }}
      >
        {plan.price}
        <span
          className="text-[12px]"
          style={{ color: isSelected ? '#a8c374' : 'var(--color-muted)' }}
        >
          /mes
        </span>
      </p>
      <div className="flex flex-wrap gap-1.5 mt-3.5">
        {includedMeals.map((m) => (
          <span
            key={m}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono"
            style={{
              background: isSelected ? 'rgba(255,255,255,.12)' : 'var(--color-cream-2)',
              color: isSelected ? '#fff' : 'var(--color-ink-2)',
            }}
          >
            <span className="w-2 h-2 rounded-[2px] bg-olive-600 shrink-0" />
            {MEAL_LABELS[m]}
          </span>
        ))}
      </div>
      <div
        className="h-px my-3.5"
        style={{ background: isSelected ? 'rgba(255,255,255,.1)' : 'var(--color-rule)' }}
      />
      <p
        className="font-mono text-[11px]"
        style={{ color: isSelected ? '#a8c374' : 'var(--color-muted)' }}
      >
        {clientCount} cliente{clientCount !== 1 ? 's' : ''} activos
      </p>
    </div>
  );
}
