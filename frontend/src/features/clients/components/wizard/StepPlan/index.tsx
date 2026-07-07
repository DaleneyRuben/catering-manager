import {
  type UseFormRegister,
  type UseFormSetValue,
  type FieldErrors,
  type Control,
  Controller,
  useWatch,
} from 'react-hook-form';
import { CheckboxRow } from '@ui/CheckboxRow';
import { WizardSectionCard } from '@ui/WizardSectionCard';
import type { Plan, NewClientFormValues } from '@/features/clients/types';
import { PlanRadioList } from '@/features/plans/components/PlanRadioList';
import { PlanRadioListSkeleton } from '@/features/plans/components/PlanRadioListSkeleton';
import { ContractRow } from '@/features/clients/components/wizard/StepPlan/ContractRow';
import { BillingRow } from '@/features/clients/components/wizard/StepPlan/BillingRow';

interface Props {
  register: UseFormRegister<NewClientFormValues>;
  control: Control<NewClientFormValues>;
  errors: FieldErrors<NewClientFormValues>;
  plans: Plan[];
  setValue: UseFormSetValue<NewClientFormValues>;
  isLoading?: boolean;
}

export function StepPlan({ register, control, errors, plans, setValue, isLoading }: Props) {
  const startDate = useWatch({ control, name: 'startDate' });
  const duration = useWatch({ control, name: 'duration' });
  const planId = useWatch({ control, name: 'planId' });
  const discount = useWatch({ control, name: 'discount' });
  const specialInstructions = useWatch({ control, name: 'specialInstructions' });
  const selectedPlan = plans.find((p) => p.id === planId);

  return (
    <div className="flex flex-col gap-5">
      <WizardSectionCard
        icon="plan"
        iconBg="bg-olive-100"
        iconColor="text-olive-700"
        title="Elegir plan"
      >
        {isLoading ? (
          <PlanRadioListSkeleton />
        ) : (
          <Controller
            name="planId"
            control={control}
            rules={{ required: 'Plan es requerido' }}
            render={({ field }) => (
              <>
                <PlanRadioList plans={plans} selectedId={field.value} onSelect={field.onChange} />
                {errors.planId && (
                  <p className="text-[12px] text-warn mt-2">{errors.planId.message}</p>
                )}
              </>
            )}
          />
        )}
      </WizardSectionCard>

      <ContractRow
        register={register}
        control={control}
        errors={errors}
        startDate={startDate}
        duration={duration}
      />

      <BillingRow setValue={setValue} price={selectedPlan?.price} discount={discount} />

      {selectedPlan?.meals.includes('salad') && (
        <WizardSectionCard
          icon="utensils"
          iconBg="bg-olive-100"
          iconColor="text-olive-700"
          title="Instrucciones especiales"
        >
          <CheckboxRow
            id="new-salad-grande"
            label="Ensalada grande"
            checked={!!specialInstructions?.salad}
            onChange={(checked) => {
              const updated = { ...(specialInstructions ?? {}) };
              if (checked) {
                updated.salad = 'DAR GRANDES';
              } else {
                delete updated.salad;
              }
              setValue('specialInstructions', updated);
            }}
          />
        </WizardSectionCard>
      )}
    </div>
  );
}
