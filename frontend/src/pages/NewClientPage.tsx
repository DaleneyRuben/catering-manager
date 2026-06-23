import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { format, startOfToday } from 'date-fns';
import { Button } from '../components/ui/Button';
import { StepIndicator } from '../components/ui/StepIndicator';
import { useCreateClient } from '../hooks/useCreateClient';
import { usePlans } from '../hooks/usePlans';
import { StepConfirm } from './new-client/StepConfirm';
import { StepIdentity } from './new-client/StepIdentity';
import { StepPlan } from './new-client/StepPlan';
import { StepRestrictions } from './new-client/StepRestrictions';
import type { NewClientFormValues, RestrictionsState } from './new-client/types';

const STEPS = ['Identidad', 'Restricciones', 'Plan', 'Confirmar'];

const STEP_FIELDS: Partial<Record<number, (keyof NewClientFormValues)[]>> = {
  1: ['name', 'sex', 'dateOfBirth', 'phoneNumber', 'address', 'deliveryZone', 'delivery'],
  3: ['planId', 'contractDate', 'startDate', 'duration'],
};

export function NewClientPage() {
  const navigate = useNavigate();
  const { create, isCreating } = useCreateClient();
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
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<NewClientFormValues>({
    defaultValues: {
      name: '',
      sex: '',
      dateOfBirth: '',
      phoneNumber: '',
      address: '',
      deliveryZone: '',
      delivery: '',
      nit: '',
      businessName: '',
      planId: null,
      contractDate: format(startOfToday(), 'yyyy-MM-dd'),
      startDate: '',
      duration: 20,
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
      await create(
        {
          name: data.name,
          sex: data.sex,
          dateOfBirth: data.dateOfBirth,
          phoneNumber: data.phoneNumber,
          address: data.address,
          deliveryZone: data.deliveryZone,
          delivery: data.delivery,
          ...(data.nit ? { nit: data.nit } : {}),
          ...(data.businessName ? { businessName: data.businessName } : {}),
          underlyingDiseases: restrictions.underlyingDiseases,
          restrictions: restrictions.restrictions,
        },
        {
          planId: data.planId!,
          contractDate: data.contractDate,
          startDate: data.startDate,
          duration: data.duration,
          discount: data.discount,
        },
      );
      navigate('/clientes');
    } catch {
      setSubmitError('Error al guardar el cliente. Intenta de nuevo.');
    }
  });

  return (
    <div>
      <div className="px-4 py-5 lg:px-[44px] lg:pt-[30px] lg:pb-[20px] border-b border-hairline">
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-[.1em] text-faint uppercase mb-3">
          <button
            type="button"
            onClick={() => navigate('/clientes')}
            className="text-olive-600 hover:underline"
          >
            Clientes
          </button>
          <span className="opacity-50">/</span>
          <span>Directorio</span>
        </div>
        <h1 className="font-serif font-semibold text-[28px] lg:text-[38px] leading-none tracking-[.005em] text-ink">
          Agregar cliente
        </h1>
      </div>

      <div className="px-4 py-5 lg:px-[44px] lg:pt-[26px]">
        <div className="max-w-[680px] mx-auto">
          <StepIndicator steps={STEPS} current={step} />
        </div>
      </div>

      <div className="px-4 lg:px-[44px]">
        <div className="max-w-[860px] w-full mx-auto lg:pt-[30px]">
          {step === 1 && <StepIdentity register={register} control={control} errors={errors} />}
          {step === 2 && (
            <StepRestrictions
              value={restrictions}
              onChange={(u) => setRestrictions((prev) => ({ ...prev, ...u }))}
            />
          )}
          {step === 3 && (
            <StepPlan
              register={register}
              control={control}
              errors={errors}
              plans={plans}
              setValue={setValue}
            />
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
      </div>

      <div className="px-4 lg:px-[44px]">
        <div className="max-w-[860px] w-full mx-auto flex items-center justify-between gap-4 py-6 lg:py-[24px]">
          {step > 1 ? (
            <Button variant="secondary" onClick={handleBack} leftIcon="arrow-left">
              Atrás
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => navigate('/clientes')} leftIcon="arrow-left">
              Cancelar
            </Button>
          )}
          <div className="flex items-center gap-[14px]">
            <span className="font-mono text-[11px] tracking-[.06em] text-faint uppercase">
              Paso {step} de 4
            </span>
            {step < 4 ? (
              <Button onClick={handleNext} rightIcon="arrow-right">
                Siguiente
              </Button>
            ) : (
              <Button onClick={submit} loading={isCreating} rightIcon="check">
                Crear cliente
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
