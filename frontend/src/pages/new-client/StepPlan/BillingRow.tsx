import { type UseFormRegister } from 'react-hook-form';
import { Field, inputCls } from '../../../components/ui/Field';
import type { NewClientFormValues } from '../types';

interface Props {
  register: UseFormRegister<NewClientFormValues>;
  price: number | undefined;
  discount: number;
}

export function BillingRow({ register, price, discount }: Props) {
  const total = (price ?? 0) - (discount || 0);

  return (
    <div>
      <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-4">
        Facturación del plan
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1.5">Precio</p>
          <p className="font-mono text-[13px] text-ink py-2 px-3 bg-cream-2 rounded-md border border-rule">
            {price !== undefined ? `$${price}` : '—'}
          </p>
        </div>
        <Field label="Descuento" htmlFor="discount">
          <input
            id="discount"
            type="number"
            min={0}
            {...register('discount', { valueAsNumber: true, min: 0 })}
            className={inputCls(false)}
          />
        </Field>
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1.5">Total</p>
          <p
            className="font-mono text-[16px] font-bold text-olive-800 py-2 px-3 rounded-md border"
            style={{
              background: 'var(--olive-50, #f5f7f0)',
              borderColor: 'var(--olive-200, #c8d4b0)',
            }}
          >
            {price !== undefined ? `$${total}` : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
