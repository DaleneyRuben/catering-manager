import { Button } from '@ui/Button';
import { formatMoney } from '@/features/finance/utils/format';
import type { CategoryTotal } from '@/features/finance/types';

interface Props {
  categories: CategoryTotal[];
  activeCategoryId: string;
  onPick: (categoryId: string) => void;
  onManage: () => void;
}

// A hairline still reads as "some"; a zero-width bar reads as a rendering fault.
const MIN_BAR_PERCENT = 3;

// Design's manage button is a few px tighter than Button's sm size.
const MANAGE_STYLE = { padding: '6px 12px', fontSize: '12px' };

export function CategoryBreakdown({ categories, activeCategoryId, onPick, onManage }: Props) {
  const sorted = [...categories].sort((a, b) => b.total - a.total);
  const max = sorted.length > 0 ? sorted[0].total : 1;
  const spent = sorted.reduce((total, category) => total + category.total, 0);

  return (
    <div className="bg-paper border border-rule rounded-[13px] px-6 py-[22px]">
      <div className="flex items-baseline justify-between gap-3.5 flex-wrap mb-[18px]">
        <div className="flex items-baseline gap-3">
          <h2 className="font-serif font-semibold text-[21px] text-ink">Gastos por categoría</h2>
          {/* "Bs 0 en 0 categorías" says less than the empty state below already does. */}
          {sorted.length > 0 && (
            <span className="font-mono text-[10.5px] text-faint">
              Bs {formatMoney(spent)} en {sorted.length}{' '}
              {sorted.length === 1 ? 'categoría' : 'categorías'}
            </span>
          )}
        </div>
        {/* The catalog changes perhaps twice a year, so managing it sits here rather than on the
            daily path — and stays reachable in a month where nothing has been spent yet. */}
        <Button
          variant="bare"
          leftIcon="list-plus"
          onClick={onManage}
          className="border border-rule rounded-lg font-semibold text-ink-2 hover:bg-olive-50 hover:border-olive-300 cursor-pointer"
          style={MANAGE_STYLE}
        >
          Administrar categorías
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-[13px] text-faint leading-[1.6] pt-1.5 pb-0.5">
          Todavía no hay gastos este mes.
        </p>
      ) : (
        // Full width across the band, so the columns follow the viewport rather than a fixed count —
        // except at the narrow end, where auto-fill would drop to one very tall column.
        <div
          data-testid="category-grid"
          className="grid grid-cols-[repeat(auto-fill,minmax(215px,1fr))] max-compact:grid-cols-2 gap-x-[26px] gap-y-3.5"
        >
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
                  <span className="font-sans font-semibold text-[12px] text-ink-2 tabular-nums shrink-0">
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
