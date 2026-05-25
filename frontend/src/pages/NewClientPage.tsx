import { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Icon } from '../components/ui/Icon';
import api from '../services/api';
import { Plan } from '../types/client';
import { addBusinessDays } from '../utils/businessDays';

const STEPS = ['Identidad', 'Restricciones', 'Plan', 'Confirmar'];

const inputCls = (hasError?: boolean) =>
  `w-full border rounded-md px-3 py-2 text-[13px] bg-cream focus:outline-none transition-colors ${
    hasError ? 'border-warn focus:border-warn' : 'border-rule focus:border-olive-600'
  }`;

const selectCls = (hasError?: boolean) =>
  `w-full border rounded-md px-3 py-2 text-[13px] bg-cream focus:outline-none transition-colors cursor-pointer ${
    hasError ? 'border-warn focus:border-warn' : 'border-rule focus:border-olive-600'
  }`;

function stepCircleClass(isActive: boolean, isDone: boolean): string {
  if (isActive) return 'bg-olive-800 text-white';
  if (isDone) return 'bg-ok-bg text-ok';
  return 'bg-cream-2 border border-rule text-muted';
}

function formatSex(sex: string): string {
  if (sex === 'female') return 'Femenino';
  if (sex === 'male') return 'Masculino';
  return 'Otro';
}

function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-mono uppercase tracking-wider text-muted mb-1.5"
      >
        {label}
        {required && <span className="ml-0.5 text-warn">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] text-warn">{error}</p>}
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-start">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const isActive = n === current;
        const isDone = n < current;
        return (
          <Fragment key={label}>
            <div className="flex flex-col items-center min-w-[56px] sm:min-w-[72px]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-mono font-medium ${stepCircleClass(isActive, isDone)}`}
              >
                {isDone ? <Icon name="check" size={12} stroke={2} /> : n}
              </div>
              <span
                className={`text-[10px] sm:text-[11px] mt-1.5 text-center ${isActive ? 'font-medium text-ink' : 'text-muted'}`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-[1px] mt-4 ${isDone ? 'bg-ok' : 'bg-rule'}`} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function TagInput({
  label,
  tags,
  input,
  setInput,
  onAdd,
  onRemove,
}: {
  label: string;
  tags: string[];
  input: string;
  setInput: (v: string) => void;
  onAdd: () => void;
  onRemove: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-cream-2 border border-rule text-ink"
          >
            {t}
            <button
              type="button"
              aria-label={`Quitar ${t}`}
              onClick={() => onRemove(t)}
              className="text-muted hover:text-ink transition-colors"
            >
              <Icon name="x" size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder="Escribí y presioná Enter…"
          className={`flex-1 ${inputCls()}`}
        />
        <button
          type="button"
          aria-label="Agregar"
          onClick={onAdd}
          className="px-3 py-2 border border-rule rounded-md hover:bg-cream-2 transition-colors"
        >
          <Icon name="plus" size={14} />
        </button>
      </div>
    </div>
  );
}

interface IdentidadState {
  name: string;
  sex: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  zone: string;
  delivery: string;
  nit: string;
  businessName: string;
}

interface RestriccionesState {
  underlyingDiseases: string[];
  restrictions: string[];
}

interface PlanState {
  planId: number | null;
  startDate: string;
}

export function NewClientPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [identidad, setIdentidad] = useState<IdentidadState>({
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
  const [restricciones, setRestricciones] = useState<RestriccionesState>({
    underlyingDiseases: [],
    restrictions: [],
  });
  const [planData, setPlanData] = useState<PlanState>({ planId: null, startDate: '' });
  const [plans, setPlans] = useState<Plan[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [diseaseInput, setDiseaseInput] = useState('');
  const [restrictionInput, setRestrictionInput] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const loadPlans = async () => {
      const res = await api.get('/plans');
      setPlans(res.data.data);
    };
    loadPlans();
  }, []);

  const handleNext = () => {
    if (step === 1) {
      const e: Record<string, string> = {};
      if (!identidad.name.trim()) e.name = 'Nombre es requerido';
      if (!identidad.sex) e.sex = 'Sexo es requerido';
      if (!identidad.dateOfBirth) e.dateOfBirth = 'Fecha de nacimiento es requerida';
      if (!identidad.phoneNumber.trim()) e.phoneNumber = 'Teléfono es requerido';
      if (!identidad.address.trim()) e.address = 'Dirección es requerida';
      if (!identidad.zone) e.zone = 'Zona es requerida';
      if (!identidad.delivery) e.delivery = 'Delivery es requerido';
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
      const clientRes = await api.post('/clients', {
        name: identidad.name,
        sex: identidad.sex,
        dateOfBirth: identidad.dateOfBirth,
        phoneNumber: identidad.phoneNumber,
        address: identidad.address,
        zone: identidad.zone,
        delivery: identidad.delivery,
        ...(identidad.nit ? { nit: identidad.nit } : {}),
        ...(identidad.businessName ? { businessName: identidad.businessName } : {}),
        underlyingDiseases: restricciones.underlyingDiseases,
        restrictions: restricciones.restrictions,
      });
      const clientId = clientRes.data.data.id as number;
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
      setSubmitError('Error al guardar el cliente. Intentá de nuevo.');
    }
  };

  const addDisease = () => {
    const v = diseaseInput.trim();
    if (v && !restricciones.underlyingDiseases.includes(v)) {
      setRestricciones((r) => ({ ...r, underlyingDiseases: [...r.underlyingDiseases, v] }));
    }
    setDiseaseInput('');
  };

  const removeDisease = (v: string) => {
    setRestricciones((r) => ({
      ...r,
      underlyingDiseases: r.underlyingDiseases.filter((d) => d !== v),
    }));
  };

  const addRestriction = () => {
    const v = restrictionInput.trim();
    if (v && !restricciones.restrictions.includes(v)) {
      setRestricciones((r) => ({ ...r, restrictions: [...r.restrictions, v] }));
    }
    setRestrictionInput('');
  };

  const removeRestriction = (v: string) => {
    setRestricciones((r) => ({ ...r, restrictions: r.restrictions.filter((d) => d !== v) }));
  };

  const selectedPlan = plans.find((p) => p.id === planData.planId);
  const contractEndDate = planData.startDate ? addBusinessDays(planData.startDate, 20) : '';

  return (
    <div className="p-7 max-w-[1320px] mx-auto">
      {/* Header */}
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

      <StepIndicator current={step} />

      {/* Form card */}
      <div className="bg-paper border border-rule rounded-lg p-6 sm:p-8 mt-7">
        {/* Step 1: Identidad */}
        {step === 1 && (
          <div>
            <h2 className="font-semibold text-ink text-[15px] mb-6">Identidad</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <Field label="Nombre completo" htmlFor="name" required error={errors.name}>
                  <input
                    id="name"
                    type="text"
                    value={identidad.name}
                    onChange={(e) => setIdentidad((i) => ({ ...i, name: e.target.value }))}
                    className={inputCls(!!errors.name)}
                  />
                </Field>
              </div>
              <Field label="Sexo" htmlFor="sex" required error={errors.sex}>
                <select
                  id="sex"
                  value={identidad.sex}
                  onChange={(e) => setIdentidad((i) => ({ ...i, sex: e.target.value }))}
                  className={selectCls(!!errors.sex)}
                >
                  <option value="">Seleccionar…</option>
                  <option value="female">Femenino</option>
                  <option value="male">Masculino</option>
                  <option value="other">Otro</option>
                </select>
              </Field>
              <Field
                label="Fecha de nacimiento"
                htmlFor="dateOfBirth"
                required
                error={errors.dateOfBirth}
              >
                <input
                  id="dateOfBirth"
                  type="date"
                  value={identidad.dateOfBirth}
                  onChange={(e) => setIdentidad((i) => ({ ...i, dateOfBirth: e.target.value }))}
                  className={inputCls(!!errors.dateOfBirth)}
                />
              </Field>
              <Field label="Teléfono" htmlFor="phoneNumber" required error={errors.phoneNumber}>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={identidad.phoneNumber}
                  onChange={(e) => setIdentidad((i) => ({ ...i, phoneNumber: e.target.value }))}
                  className={inputCls(!!errors.phoneNumber)}
                />
              </Field>
              <Field label="Dirección" htmlFor="address" required error={errors.address}>
                <input
                  id="address"
                  type="text"
                  value={identidad.address}
                  onChange={(e) => setIdentidad((i) => ({ ...i, address: e.target.value }))}
                  className={inputCls(!!errors.address)}
                />
              </Field>
              <Field label="Zona" htmlFor="zone" required error={errors.zone}>
                <select
                  id="zone"
                  value={identidad.zone}
                  onChange={(e) => setIdentidad((i) => ({ ...i, zone: e.target.value }))}
                  className={selectCls(!!errors.zone)}
                >
                  <option value="">Seleccionar…</option>
                  <option value="Centro">Centro</option>
                  <option value="Sur">Sur</option>
                </select>
              </Field>
              <Field label="Delivery" htmlFor="delivery" required error={errors.delivery}>
                <select
                  id="delivery"
                  value={identidad.delivery}
                  onChange={(e) => setIdentidad((i) => ({ ...i, delivery: e.target.value }))}
                  className={selectCls(!!errors.delivery)}
                >
                  <option value="">Seleccionar…</option>
                  <option value="La Oliva">La Oliva</option>
                  <option value="Otro">Otro</option>
                </select>
              </Field>
              <Field label="NIT" htmlFor="nit">
                <input
                  id="nit"
                  type="text"
                  value={identidad.nit}
                  onChange={(e) => setIdentidad((i) => ({ ...i, nit: e.target.value }))}
                  placeholder="Opcional"
                  className={inputCls()}
                />
              </Field>
              <Field label="Razón social" htmlFor="businessName">
                <input
                  id="businessName"
                  type="text"
                  value={identidad.businessName}
                  onChange={(e) => setIdentidad((i) => ({ ...i, businessName: e.target.value }))}
                  placeholder="Opcional"
                  className={inputCls()}
                />
              </Field>
            </div>
          </div>
        )}

        {/* Step 2: Restricciones */}
        {step === 2 && (
          <div>
            <h2 className="font-semibold text-ink text-[15px] mb-6">Restricciones</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <TagInput
                label="Enfermedades de base"
                tags={restricciones.underlyingDiseases}
                input={diseaseInput}
                setInput={setDiseaseInput}
                onAdd={addDisease}
                onRemove={removeDisease}
              />
              <TagInput
                label="Restricciones alimentarias"
                tags={restricciones.restrictions}
                input={restrictionInput}
                setInput={setRestrictionInput}
                onAdd={addRestriction}
                onRemove={removeRestriction}
              />
            </div>
          </div>
        )}

        {/* Step 3: Plan */}
        {step === 3 && (
          <div>
            <h2 className="font-semibold text-ink text-[15px] mb-6">Plan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Plan" htmlFor="planId" required error={errors.planId}>
                <select
                  id="planId"
                  value={planData.planId ?? ''}
                  onChange={(e) =>
                    setPlanData((p) => ({
                      ...p,
                      planId: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className={selectCls(!!errors.planId)}
                >
                  <option value="">Seleccioná un plan…</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${p.price}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fecha de inicio" htmlFor="startDate" required error={errors.startDate}>
                <input
                  id="startDate"
                  type="date"
                  value={planData.startDate}
                  onChange={(e) => setPlanData((p) => ({ ...p, startDate: e.target.value }))}
                  className={inputCls(!!errors.startDate)}
                />
              </Field>
              {contractEndDate && (
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1.5">
                    Fecha de fin
                  </p>
                  <p className="text-[13px] text-ink font-mono py-2">{contractEndDate}</p>
                </div>
              )}
              {selectedPlan && (
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1.5">
                    Precio
                  </p>
                  <p className="text-[13px] text-ink font-mono py-2">${selectedPlan.price}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Confirmar */}
        {step === 4 && (
          <div>
            <h2 className="font-semibold text-ink text-[15px] mb-6">Confirmar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <h3 className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">
                  Identidad
                </h3>
                <dl className="space-y-2.5">
                  {(
                    [
                      ['Nombre', identidad.name],
                      ['Sexo', formatSex(identidad.sex)],
                      ['Nacimiento', identidad.dateOfBirth],
                      ['Teléfono', identidad.phoneNumber],
                      ['Dirección', identidad.address],
                      ['Zona', identidad.zone],
                      ['Delivery', identidad.delivery],
                      ...(identidad.nit ? [['NIT', identidad.nit]] : []),
                      ...(identidad.businessName ? [['Razón Social', identidad.businessName]] : []),
                    ] as [string, string][]
                  ).map(([k, v]) => (
                    <div key={k} className="flex gap-3 text-[13px]">
                      <dt className="text-muted w-24 shrink-0">{k}</dt>
                      <dd className="text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
                {(restricciones.underlyingDiseases.length > 0 ||
                  restricciones.restrictions.length > 0) && (
                  <div className="mt-5">
                    <h3 className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">
                      Restricciones
                    </h3>
                    <dl className="space-y-2.5">
                      {restricciones.underlyingDiseases.length > 0 && (
                        <div className="flex gap-3 text-[13px]">
                          <dt className="text-muted w-24 shrink-0">Enfermedades</dt>
                          <dd className="text-ink">
                            {restricciones.underlyingDiseases.join(', ')}
                          </dd>
                        </div>
                      )}
                      {restricciones.restrictions.length > 0 && (
                        <div className="flex gap-3 text-[13px]">
                          <dt className="text-muted w-24 shrink-0">Restricciones</dt>
                          <dd className="text-ink">{restricciones.restrictions.join(', ')}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">
                  Plan
                </h3>
                <dl className="space-y-2.5">
                  {(
                    [
                      ['Plan', selectedPlan?.name ?? '—'],
                      ['Precio', selectedPlan ? `$${selectedPlan.price}` : '—'],
                      ['Inicio', planData.startDate],
                      ['Fin contrato', contractEndDate],
                    ] as [string, string][]
                  ).map(([k, v]) => (
                    <div key={k} className="flex gap-3 text-[13px]">
                      <dt className="text-muted w-24 shrink-0">{k}</dt>
                      <dd className="text-ink font-mono">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            {submitError && (
              <p className="mt-6 text-[13px] text-warn bg-warn-bg px-3 py-2 rounded-md">
                {submitError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
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
