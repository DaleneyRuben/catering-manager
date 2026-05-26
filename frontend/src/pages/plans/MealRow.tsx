import { Icon } from '../../components/ui/Icon';
import type { MealKey } from './types';
import { MEAL_LABELS } from './types';

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
    <button
      type="button"
      onClick={() => onToggle(mealKey)}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md border text-left w-full transition-colors ${
        included
          ? 'bg-olive-800 border-olive-800 text-white'
          : 'bg-cream-2 border-rule text-muted hover:border-olive-600'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-[2px] shrink-0 ${included ? 'bg-white' : 'bg-olive-600'}`}
      />
      <span className={`flex-1 text-[13px] ${included ? 'font-semibold' : 'font-normal'}`}>
        {MEAL_LABELS[mealKey]}
      </span>
      {included && <Icon name="check" size={12} />}
    </button>
  );
}
