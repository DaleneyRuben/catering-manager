import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Icon } from '../components/ui/Icon';
import { StepIndicator } from '../components/ui/StepIndicator';
import api from '../services/api';
import type { Plan } from '../types/client';
import { addBusinessDays } from '../utils/businessDays';
import { StepConfirm } from './new-client/StepConfirm';
import { StepIdentity } from './new-client/StepIdentity';
import { StepPlan } from './new-client/StepPlan';
import { StepRestrictions } from './new-client/StepRestrictions';
import type { IdentityState, PlanState, RestrictionsState } from './new-client/types';

const STEPS = ['Identidad', 'Restricciones', 'Plan', 'Confirmar'];

export function NewClientPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [identity, setIdentity] = useState<IdentityState>({
    name: '',
    sex: '',
    dateOfBirth: '',
    phoneNumber: '',
    address: '',
    zone: '',
    delivery: '',
    nit: '',
    businessName: '',
  });
  const [restrictions, setRestrictions] = useState<RestrictionsState>({
    underlyingDiseases: [],
    restrictions: [],
  });
  const [planData, setPlanData] = useState<PlanState>({ planId: null, startDate: '' });
  const [plans, setPlans] = useState<Plan[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const loadPlans = async () => {
      const fetched = await api.get<Plan[]>('/plans');
      setPlans(fetched);
    };
    loadPlans();
  }, []);

  const handleNext = () => {
    if (step === 1) {
      const e: Record<string, string> = {};
      if (!identity.name.trim()) e.name = 'Nombre es requerido';
      if (!identity.sex) e.sex = 'Sexo es requerido';
      if (!identity.dateOfBirth) e.dateOfBirth = 'Fecha de nacimiento es requerida';
      if (!identity.phoneNumber.trim()) e.phoneNumber = 'Teléfono es requerido';
      if (!identity.address.trim()) e.address = 'Dirección es requerida';
      if (!identity.zone) e.zone = 'Zona es requerida';
      if (!identity.delivery) e.delivery = 'Delivery es requerido';
      if (Object.keys(e).length > 0) {
        setErrors(e);
        return;
      }
    }
    if (step === 3) {
      const e: Record<string, string> = {};
      if (!planData.planId) e.planId = 'Plan es requerido';
      if (!planData.startDate) e.startDate = 'Fecha de inicio es requerida';
      if (Object.keys(e).length > 0) {
        setErrors(e);
        return;
      }
    }
    setErrors({});
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitError('');
    try {
      const created = await api.post<{ id: number }>('/clients', {
        name: identity.name,
        sex: identity.sex,
        dateOfBirth: identity.dateOfBirth,
        phoneNumber: identity.phoneNumber,
        address: identity.address,
        zone: identity.zone,
        delivery: identity.delivery,
        ...(identity.nit ? { nit: identity.nit } : {}),
        ...(identity.businessName ? { businessName: identity.businessName } : {}),
        underlyingDiseases: restrictions.underlyingDiseases,
        restrictions: restrictions.restrictions,
      });
      const clientId = created.id;
      const contractDate = format(new Date(), 'yyyy-MM-dd');
      const contractEndDate = addBusinessDays(planData.startDate!, 20);
      await api.post(`/clients/${clientId}/subscriptions`, {
        planId: planData.planId,
        startDate: planData.startDate,
        contractDate,
        contractEndDate,
      });
      navigate('/clientes');
    } catch {
      setSubmitError('Error al guardar el cliente. Intenta de nuevo.');
    }
  };

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
        {step === 1 && (
          <StepIdentity
            value={identity}
            onChange={(u) => setIdentity((prev) => ({ ...prev, ...u }))}
            errors={errors}
          />
        )}
        {step === 2 && (
          <StepRestrictions
            value={restrictions}
            onChange={(u) => setRestrictions((prev) => ({ ...prev, ...u }))}
          />
        )}
        {step === 3 && (
          <StepPlan
            value={planData}
            onChange={(u) => setPlanData((prev) => ({ ...prev, ...u }))}
            plans={plans}
            errors={errors}
          />
        )}
        {step === 4 && (
          <StepConfirm
            identity={identity}
            restrictions={restrictions}
            planData={planData}
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
            onClick={handleSubmit}
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
