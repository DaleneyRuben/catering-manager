import { Field, inputCls, selectCls } from '../../components/ui/Field';
import type { Plan } from '../../types/client';
import { addBusinessDays } from '../../utils/businessDays';
import type { PlanState } from './types';

interface Props {
  value: PlanState;
  onChange: (updates: Partial<PlanState>) => void;
  plans: Plan[];
  errors: Record<string, string>;
}

export function StepPlan({ value, onChange, plans, errors }: Props) {
  const selectedPlan = plans.find((p) => p.id === value.planId);
  const contractEndDate = value.startDate ? addBusinessDays(value.startDate, 20) : '';

  return (
    <div>
      <h2 className="font-semibold text-ink text-[15px] mb-6">Plan</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Plan" htmlFor="planId" required error={errors.planId}>
          <select
            id="planId"
            value={value.planId ?? ''}
            onChange={(e) => onChange({ planId: e.target.value ? Number(e.target.value) : null })}
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
            value={value.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
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
  );
}
