import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Icon } from '../components/ui/Icon';
import { StepIndicator } from '../components/ui/StepIndicator';
import { useClients } from '../hooks/useClients';
import { usePlans } from '../hooks/usePlans';
import { StepConfirm } from './new-client/StepConfirm';
import { StepIdentity } from './new-client/StepIdentity';
import { StepPlan } from './new-client/StepPlan';
import { StepRestrictions } from './new-client/StepRestrictions';
import type { NewClientFormValues, RestrictionsState } from './new-client/types';

const STEPS = ['Identidad', 'Restricciones', 'Plan', 'Confirmar'];

const STEP_FIELDS: Partial<Record<number, (keyof NewClientFormValues)[]>> = {
  1: ['name', 'sex', 'dateOfBirth', 'phoneNumber', 'address', 'zone', 'delivery'],
  3: ['planId', 'startDate'],
};

export function NewClientPage() {
  const navigate = useNavigate();
  const { create } = useClients();
  const { plans } = usePlans();
  const [step, setStep] = useState(1);
  const [restrictions, setRestrictions] = useState<RestrictionsState>({
    restrictions: [],
    underlyingDiseases: [],
  });
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    control,
    trigger,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<NewClientFormValues>({
    defaultValues: {
      name: '',
      sex: '',
      dateOfBirth: '',
      phoneNumber: '',
      address: '',
      zone: '',
      delivery: '',
      nit: '',
      businessName: '',
      planId: null,
      startDate: '',
      discount: 0,
    },
  });

  const handleNext = async () => {
    const fields = STEP_FIELDS[step];
    if (fields) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const submit = handleSubmit(async (data) => {
    setSubmitError('');
    try {
      const contractDate = format(new Date(), 'yyyy-MM-dd');
      await create(
        {
          name: data.name,
          sex: data.sex,
          dateOfBirth: data.dateOfBirth,
          phoneNumber: data.phoneNumber,
          address: data.address,
          zone: data.zone,
          delivery: data.delivery,
          ...(data.nit ? { nit: data.nit } : {}),
          ...(data.businessName ? { businessName: data.businessName } : {}),
          underlyingDiseases: restrictions.underlyingDiseases,
          restrictions: restrictions.restrictions,
        },
        {
          planId: data.planId!,
          startDate: data.startDate,
          contractDate,
          discount: data.discount,
        },
      );
      navigate('/clientes');
    } catch {
      setSubmitError('Error al guardar el cliente. Intenta de nuevo.');
    }
  });

  return (
    <div className="p-7 max-w-[1320px] mx-auto">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => navigate('/clientes')}
          className="flex items-center gap-1.5 text-[13px] text-muted hover:text-ink mb-5 transition-colors"
        >
          <Icon name="arrow-left" size={13} />
          Clientes
        </button>
        <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-2">
          Directorio
        </p>
        <h1 className="font-serif text-[44px] leading-none text-ink">Alta de cliente</h1>
      </div>

      <StepIndicator steps={STEPS} current={step} />

      <div className="bg-paper border border-rule rounded-lg p-6 sm:p-8 mt-7">
        {step === 1 && <StepIdentity register={register} control={control} errors={errors} />}
        {step === 2 && (
          <StepRestrictions
            value={restrictions}
            onChange={(u) => setRestrictions((prev) => ({ ...prev, ...u }))}
          />
        )}
        {step === 3 && (
          <StepPlan register={register} control={control} errors={errors} plans={plans} />
        )}
        {step === 4 && (
          <StepConfirm
            formValues={getValues()}
            restrictions={restrictions}
            plans={plans}
            submitError={submitError}
          />
        )}
      </div>

      <div className="flex justify-between mt-6">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border border-rule rounded-md text-ink hover:bg-paper transition-colors"
          >
            <Icon name="arrow-left" size={14} />
            Atrás
          </button>
        ) : (
          <div />
        )}
        {step < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors"
          >
            Siguiente
            <Icon name="arrow-right" size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors"
          >
            Confirmar alta
            <Icon name="check" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
