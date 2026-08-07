import { formatMoney } from '@/features/finance/utils/format';
import type { CategoryTotal } from '@/features/finance/types';

interface Props {
  categories: CategoryTotal[];
  activeCategoryId: string;
  onPick: (categoryId: string) => void;
}

// A hairline still reads as "some"; a zero-width bar reads as a rendering fault.
const MIN_BAR_PERCENT = 3;

export function CategoryBreakdown({ categories, activeCategoryId, onPick }: Props) {
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
        // Full width across the band, so the columns follow the viewport rather than a fixed count.
        <div className="grid grid-cols-[repeat(auto-fill,minmax(215px,1fr))] gap-x-[26px] gap-y-3.5">
          {sorted.map((category) => {
            const on = category.categoryId === activeCategoryId;
            return (
              // "Cuánto gastamos en Transporte" and "en qué se fue" are one question read twice,
              // so the answer to the first is the way into the second.
              <button
                key={category.categoryId}
                type="button"
                aria-pressed={on}
                onClick={() => onPick(category.categoryId)}
                title={on ? 'Quitar el filtro' : `Ver solo ${category.categoryName}`}
                className="block w-full text-left cursor-pointer hover:opacity-70 transition-opacity"
              >
                <div className="flex items-baseline justify-between gap-2.5 mb-[6px]">
                  <span
                    data-testid="category-name"
                    className={`text-[13px] truncate ${
                      on ? 'text-olive-700 font-semibold' : 'text-ink'
                    }`}
                  >
                    {category.categoryName}
                  </span>
                  <span className="font-mono text-[12px] text-ink-2 tabular-nums shrink-0">
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
                {/* A category archived after the money was spent still owns it, so the line stays
                    and is flagged rather than the total quietly leaving the breakdown. */}
                {!category.active && (
                  <div className="font-mono text-[9px] tracking-[.1em] uppercase text-placeholder mt-[5px]">
                    Archivada
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
