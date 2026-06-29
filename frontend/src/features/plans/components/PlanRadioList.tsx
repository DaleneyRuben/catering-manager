import { getPlanTier, TIER_LABELS } from '@/features/plans/tiers';
import type { Plan } from '@/features/clients/types';

const SIZE_CLS = {
  md: {
    list: 'flex flex-col gap-[10px]',
    row: 'gap-4 py-[14px] px-[18px] rounded-[11px]',
    left: 'gap-[13px]',
    radio: 'w-5 h-5',
    dot: 'w-[10px] h-[10px]',
    name: 'text-[14.5px]',
    meta: 'text-[10.5px]',
    price: 'text-[23px]',
    suffix: 'text-[10px]',
  },
  sm: {
    list: 'flex flex-col gap-2',
    row: 'gap-[14px] py-[11px] px-[14px] rounded-[10px]',
    left: 'gap-3',
    radio: 'w-[18px] h-[18px]',
    dot: 'w-[9px] h-[9px]',
    name: 'text-[13.5px]',
    meta: 'text-[10px]',
    price: 'text-[20px]',
    suffix: 'text-[9.5px]',
  },
} as const;

interface Props {
  plans: Plan[];
  selectedId: string | null | undefined;
  onSelect: (id: string) => void;
  size?: keyof typeof SIZE_CLS;
}

export function PlanRadioList({ plans, selectedId, onSelect, size = 'md' }: Props) {
  const allPrices = plans.map((p) => p.price);
  const cls = SIZE_CLS[size];

  return (
    <div className={cls.list}>
      {plans.map((p) => {
        const isSel = p.id === selectedId;
        const tier = TIER_LABELS[getPlanTier(p.price, allPrices)];
        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(p.id)}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(p.id)}
            className={`flex items-center justify-between ${cls.row} cursor-pointer transition-all border-[1.5px] ${
              isSel ? 'border-olive-700 bg-row-selected' : 'border-rule bg-white'
            }`}
          >
            <div className={`flex items-center ${cls.left}`}>
              <span
                className={`${cls.radio} rounded-full flex items-center justify-center shrink-0 border-2 ${
                  isSel ? 'border-olive-700' : 'border-empty-border'
                }`}
              >
                <span
                  className={`${cls.dot} rounded-full bg-olive-700 transition-transform ${
                    isSel ? 'scale-100' : 'scale-0'
                  }`}
                />
              </span>
              <div>
                <div className={`${cls.name} font-semibold text-ink`}>{p.name}</div>
                <div className={`font-mono ${cls.meta} tracking-[.04em] text-faint mt-[2px]`}>
                  {p.meals.length} tiempos · {tier}
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-[5px]">
              <span className={`font-serif font-semibold ${cls.price} text-ink tabular-nums`}>
                {p.price.toLocaleString('es-BO')}
              </span>
              <span className={`font-mono ${cls.suffix} text-faint`}>/mes</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
