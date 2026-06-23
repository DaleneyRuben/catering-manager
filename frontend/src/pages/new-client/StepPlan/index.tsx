import {
  type UseFormRegister,
  type UseFormSetValue,
  type FieldErrors,
  type Control,
  Controller,
  useWatch,
} from 'react-hook-form';
import type { Plan } from '../../../types/client';
import { WizardSectionCard } from '../../../components/ui/WizardSectionCard';
import { getPlanTier, type PlanTier } from '../../plans/tiers';
import type { NewClientFormValues } from '../types';
import { ContractRow } from './ContractRow';
import { BillingRow } from './BillingRow';

const TIER_LABELS: Record<PlanTier, string> = {
  basic: 'Esencial',
  mid: 'Completo',
  premium: 'Premium',
};

interface Props {
  register: UseFormRegister<NewClientFormValues>;
  control: Control<NewClientFormValues>;
  errors: FieldErrors<NewClientFormValues>;
  plans: Plan[];
  setValue: UseFormSetValue<NewClientFormValues>;
}

export function StepPlan({ register, control, errors, plans, setValue }: Props) {
  const startDate = useWatch({ control, name: 'startDate' });
  const duration = useWatch({ control, name: 'duration' });
  const planId = useWatch({ control, name: 'planId' });
  const discount = useWatch({ control, name: 'discount' });
  const selectedPlan = plans.find((p) => p.id === planId);

  const allPrices = plans.map((p) => p.price);

  return (
    <div className="flex flex-col gap-5">
      <WizardSectionCard
        icon="plan"
        iconBg="bg-olive-100"
        iconColor="text-olive-700"
        title="Elegir plan"
      >
        <Controller
          name="planId"
          control={control}
          rules={{ required: 'Plan es requerido' }}
          render={({ field }) => (
            <>
              <div className="flex flex-col gap-[10px]">
                {plans.map((p) => {
                  const isSel = field.value === p.id;
                  const tier = TIER_LABELS[getPlanTier(p.price, allPrices)];
                  return (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => field.onChange(p.id)}
                      onKeyDown={(e) => e.key === 'Enter' && field.onChange(p.id)}
                      className={`flex items-center justify-between gap-4 py-[14px] px-[18px] rounded-[11px] cursor-pointer transition-all border-[1.5px] ${
                        isSel ? 'border-olive-700 bg-row-selected' : 'border-rule bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-[13px]">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 ${
                            isSel ? 'border-olive-700' : 'border-empty-border'
                          }`}
                        >
                          <span
                            className={`w-[10px] h-[10px] rounded-full bg-olive-700 transition-transform ${
                              isSel ? 'scale-100' : 'scale-0'
                            }`}
                          />
                        </span>
                        <div>
                          <div className="text-[14.5px] font-semibold text-ink">{p.name}</div>
                          <div className="font-mono text-[10.5px] tracking-[.04em] text-faint mt-[2px]">
                            {p.meals.length} tiempos · {tier}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-[5px]">
                        <span className="font-serif font-semibold text-[23px] text-ink tabular-nums">
                          {p.price.toLocaleString('es-BO')}
                        </span>
                        <span className="font-mono text-[10px] text-faint">/mes</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {errors.planId && (
                <p className="text-[12px] text-warn mt-2">{errors.planId.message}</p>
              )}
            </>
          )}
        />
      </WizardSectionCard>

      <ContractRow
        register={register}
        control={control}
        errors={errors}
        startDate={startDate}
        duration={duration}
      />

      <BillingRow setValue={setValue} price={selectedPlan?.price} discount={discount} />
    </div>
  );
}
