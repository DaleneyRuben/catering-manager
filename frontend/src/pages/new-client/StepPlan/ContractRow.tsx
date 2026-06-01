import { type UseFormRegister, type FieldErrors } from 'react-hook-form';
import { format } from 'date-fns';
import { Field, inputCls } from '../../../components/ui/Field';
import { addBusinessDays } from '../../../utils/businessDays';
import { formatDate } from '../../../utils/format';
import type { NewClientFormValues } from '../types';

interface Props {
  register: UseFormRegister<NewClientFormValues>;
  errors: FieldErrors<NewClientFormValues>;
  startDate: string;
  duration: number;
}

export function ContractRow({ register, errors, startDate, duration }: Props) {
  const today = format(new Date(), 'dd/MM/yyyy');
  const contractEndDate =
    startDate && duration > 0 ? formatDate(addBusinessDays(startDate, duration)) : '—';

  return (
    <div>
      <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-4">Contrato</p>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1.5">
            Firma de contrato
          </p>
          <p className="font-mono text-[13px] text-ink py-2 px-3 bg-cream-2 rounded-md border border-rule">
            {today}
          </p>
          <p className="text-[10.5px] font-mono text-muted mt-1">Hoy automáticamente</p>
        </div>
        <Field
          label="Inicio del servicio"
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
        <Field label="Duración (días)" htmlFor="duration" required error={errors.duration?.message}>
          <input
            id="duration"
            type="number"
            min={1}
            {...register('duration', {
              valueAsNumber: true,
              required: 'Duración es requerida',
              min: { value: 1, message: 'Mínimo 1 día' },
            })}
            className={inputCls(!!errors.duration)}
          />
          <p className="text-[10.5px] font-mono text-muted mt-1">días hábiles (L–V)</p>
        </Field>
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1.5">
            Fin de contrato
          </p>
          <p
            className="font-mono text-[13px] font-bold text-olive-800 py-2 px-3 rounded-md border"
            style={{ background: 'var(--olive-50)', borderColor: 'var(--olive-200)' }}
          >
            {contractEndDate}
          </p>
          <p className="text-[10.5px] font-mono text-olive-700 mt-1">calculado automáticamente</p>
        </div>
      </div>
    </div>
  );
}
