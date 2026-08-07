import { formatMoney } from '@/features/finance/utils/format';
import type { CategoryTotal } from '@/features/finance/types';

interface Props {
  categories: CategoryTotal[];
}

// A hairline still reads as "some"; a zero-width bar reads as a rendering fault.
const MIN_BAR_PERCENT = 3;

export function CategoryBreakdown({ categories }: Props) {
  const sorted = [...categories].sort((a, b) => b.total - a.total);
  const max = sorted.length > 0 ? sorted[0].total : 1;

  return (
    <div className="bg-paper border border-rule rounded-[13px] px-6 py-[22px]">
      <h2 className="font-serif font-semibold text-[21px] text-ink mb-[18px]">
        Gastos por categoría
      </h2>

      {sorted.length === 0 ? (
        <p className="text-[13px] text-faint leading-[1.6] pt-1.5 pb-0.5">
          Todavía no hay gastos este mes.
        </p>
      ) : (
        <div className="flex flex-col gap-[15px]">
          {sorted.map((category) => (
            <div key={category.categoryId}>
              <div className="flex items-baseline justify-between gap-3 mb-[7px]">
                <span data-testid="category-name" className="text-[13.5px] text-ink">
                  {category.categoryName}
                </span>
                <span className="font-mono text-[12.5px] text-ink-2 tabular-nums">
                  {formatMoney(category.total)}
                </span>
              </div>
              <div className="relative h-1.5 rounded-full bg-cat-bar-track overflow-hidden">
                <div
                  data-testid="category-bar"
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-olive-300 to-olive-700"
                  style={{
                    width: `${Math.max(MIN_BAR_PERCENT, Math.round((category.total / max) * 100))}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
