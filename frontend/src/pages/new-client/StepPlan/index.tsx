import {
  type UseFormRegister,
  type FieldErrors,
  type Control,
  Controller,
  useWatch,
} from 'react-hook-form';
import type { Plan } from '../../../types/client';
import { MEAL_LABELS } from '../../../constants/meals';
import type { NewClientFormValues } from '../types';
import { ContractRow } from './ContractRow';
import { BillingRow } from './BillingRow';

interface Props {
  register: UseFormRegister<NewClientFormValues>;
  control: Control<NewClientFormValues>;
  errors: FieldErrors<NewClientFormValues>;
  plans: Plan[];
}

export function StepPlan({ register, control, errors, plans }: Props) {
  const startDate = useWatch({ control, name: 'startDate' });
  const planId = useWatch({ control, name: 'planId' });
  const discount = useWatch({ control, name: 'discount' });
  const selectedPlan = plans.find((p) => p.id === planId);

  return (
    <div>
      <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-4">
        Plan de comidas
      </p>

      <Controller
        name="planId"
        control={control}
        rules={{ required: 'Plan es requerido' }}
        render={({ field }) => (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-1">
              {plans.map((p) => {
                const isSel = field.value === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => field.onChange(p.id)}
                    className={`text-left p-4 rounded-md border transition-colors ${
                      isSel
                        ? 'bg-olive-800 text-white border-olive-800'
                        : 'bg-paper text-ink border-rule hover:border-olive-700'
                    }`}
                  >
                    <div className="font-serif text-[18px] leading-tight">{p.name}</div>
                    <div className="font-mono text-[20px] mt-1">
                      {p.price}
                      <span className={`text-[11px] ${isSel ? 'opacity-60' : 'text-muted'}`}>
                        /mes
                      </span>
                    </div>
                    {p.meals.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {p.meals.map((m) => (
                          <span
                            key={m}
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                              isSel ? 'bg-white/15' : 'bg-cream-2 text-muted'
                            }`}
                          >
                            {MEAL_LABELS[m] ?? m}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {errors.planId && <p className="text-[12px] text-warn mt-1">{errors.planId.message}</p>}
          </>
        )}
      />

      <div className="border-t border-rule mt-6 pt-5">
        <ContractRow register={register} errors={errors} startDate={startDate} />
      </div>

      <div className="border-t border-rule mt-6 pt-5">
        <BillingRow register={register} price={selectedPlan?.price} discount={discount} />
      </div>
    </div>
  );
}
