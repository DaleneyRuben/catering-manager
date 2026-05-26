import {
  type UseFormRegister,
  type FieldErrors,
  type Control,
  Controller,
  useWatch,
} from 'react-hook-form';
import { Field, inputCls, selectCls } from '../../components/ui/Field';
import type { Plan } from '../../types/client';
import { addBusinessDays } from '../../utils/businessDays';
import type { NewClientFormValues } from './types';

interface Props {
  register: UseFormRegister<NewClientFormValues>;
  control: Control<NewClientFormValues>;
  errors: FieldErrors<NewClientFormValues>;
  plans: Plan[];
}

export function StepPlan({ register, control, errors, plans }: Props) {
  const startDate = useWatch({ control, name: 'startDate' });
  const planId = useWatch({ control, name: 'planId' });
  const selectedPlan = plans.find((p) => p.id === planId);
  const contractEndDate = startDate ? addBusinessDays(startDate, 20) : '';

  return (
    <div>
      <h2 className="font-semibold text-ink text-[15px] mb-6">Plan</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Controller
          name="planId"
          control={control}
          rules={{ required: 'Plan es requerido' }}
          render={({ field }) => (
            <Field label="Plan" htmlFor="planId" required error={errors.planId?.message}>
              <select
                id="planId"
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                onBlur={field.onBlur}
                className={selectCls(!!errors.planId)}
              >
                <option value="">Selecciona un plan…</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ${p.price}
                  </option>
                ))}
              </select>
            </Field>
          )}
        />
        <Field
          label="Fecha de inicio"
          htmlFor="startDate"
          required
          error={errors.startDate?.message}
        >
          <input
            id="startDate"
            type="date"
            {...register('startDate', { required: 'Fecha de inicio es requerida' })}
            className={inputCls(!!errors.startDate)}
          />
        </Field>
        <Field label="Descuento" htmlFor="discount">
          <input
            id="discount"
            type="number"
            min={0}
            {...register('discount', { valueAsNumber: true, min: 0 })}
            className={inputCls(false)}
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
