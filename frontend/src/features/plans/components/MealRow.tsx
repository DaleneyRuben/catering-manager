import { Icon } from '@/components/ui/Icon';
import type { MealKey } from '@/features/plans/types';
import { MEAL_LABELS } from '@/constants/meals';

export function MealRow({
  mealKey,
  included,
  onToggle,
}: {
  mealKey: MealKey;
  included: boolean;
  onToggle: (key: MealKey) => void;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={included}
      tabIndex={0}
      onClick={() => onToggle(mealKey)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onToggle(mealKey);
      }}
      className="flex items-center gap-[11px] py-[3px] cursor-pointer"
    >
      <span
        className={`w-[22px] h-[22px] rounded-[6px] flex items-center justify-center shrink-0 border-[1.5px] transition-colors ${
          included ? 'bg-olive-700 border-olive-700' : 'bg-white border-rule'
        }`}
      >
        {included && <Icon name="check" size={12} stroke={3.2} className="text-white" />}
      </span>
      <span className="text-[13.5px] text-ink">{MEAL_LABELS[mealKey]}</span>
    </div>
  );
}
