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
import { PlanRadioList } from '../../../components/ui/PlanRadioList';
import type { NewClientFormValues } from '../types';
import { ContractRow } from './ContractRow';
import { BillingRow } from './BillingRow';

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
              <PlanRadioList plans={plans} selectedId={field.value} onSelect={field.onChange} />
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
