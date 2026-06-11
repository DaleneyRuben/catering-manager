import { type UseFormRegister, type FieldErrors, type Control, Controller } from 'react-hook-form';
import { startOfToday, isWeekend, parseISO } from 'date-fns';
import { Field, inputCls } from '../../../components/ui/Field';
import { DatePickerInput } from '../../../components/ui/DatePickerInput';
import { addBusinessDays } from '../../../utils/businessDays';
import { formatDate } from '../../../utils/format';
import type { NewClientFormValues } from '../types';

interface Props {
  register: UseFormRegister<NewClientFormValues>;
  control: Control<NewClientFormValues>;
  errors: FieldErrors<NewClientFormValues>;
  startDate: string;
  duration: number;
}

export function ContractRow({ register, control, errors, startDate, duration }: Props) {
  const contractEndDate =
    // duration - 1 because startDate counts as day 1
    startDate && duration > 0 ? formatDate(addBusinessDays(startDate, duration - 1)) : '—';

  return (
    <div>
      <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-4">Contrato</p>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* TODO: restrict to today-only once backfilling of existing clients is complete */}
        <Controller
          name="contractDate"
          control={control}
          rules={{ required: 'Fecha de contrato es requerida' }}
          render={({ field }) => (
            <Field
              label="Firma de contrato"
              htmlFor="contractDate"
              required
              error={errors.contractDate?.message}
            >
              <DatePickerInput
                id="contractDate"
                value={field.value ?? ''}
                onChange={field.onChange}
                hasError={!!errors.contractDate}
                endMonth={startOfToday()}
              />
            </Field>
          )}
        />
        {/* TODO: restrict to future-only once backfilling of existing clients is complete */}
        <Controller
          name="startDate"
          control={control}
          rules={{
            required: 'Fecha de inicio es requerida',
            validate: (v) =>
              !v || !isWeekend(parseISO(v)) || 'El inicio debe ser un día hábil (lunes a viernes)',
          }}
          render={({ field }) => (
            <Field
              label="Inicio del servicio"
              htmlFor="startDate"
              required
              error={errors.startDate?.message}
            >
              <DatePickerInput
                id="startDate"
                value={field.value ?? ''}
                onChange={field.onChange}
                hasError={!!errors.startDate}
                endMonth={startOfToday()}
              />
            </Field>
          )}
        />
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
