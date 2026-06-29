import { type UseFormRegister, type FieldErrors, type Control, Controller } from 'react-hook-form';
import { startOfToday, isWeekend, parseISO } from 'date-fns';
import { Field, inputCls } from '@ui/Field';
import { DatePickerInput } from '@ui/DatePickerInput';
import { WizardSectionCard } from '@ui/WizardSectionCard';
import { addBusinessDays } from '@/utils/businessDays';
import { formatDate } from '@/utils/format';
import type { NewClientFormValues } from '@/features/clients/types';

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
    <WizardSectionCard icon="calendar" iconBg="bg-cream-2" iconColor="text-muted" title="Contrato">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-[22px] gap-y-[18px]">
        {/* TODO: restrict to today-only once backfilling of existing clients is complete */}
        <Controller
          name="contractDate"
          control={control}
          rules={{ required: 'Fecha de contrato es requerida' }}
          render={({ field }) => (
            <Field
              label="Fecha de firma"
              htmlFor="contractDate"
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
              label="Fecha de inicio"
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
        <Field
          label="Duración (días hábiles)"
          htmlFor="duration"
          required
          error={errors.duration?.message}
        >
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
        </Field>
        <Field label="Fin de contrato (auto)" htmlFor="contractEndDatePreview">
          <p
            id="contractEndDatePreview"
            className="font-mono text-[14px] text-muted bg-empty-bg border border-hairline rounded-[9px] py-[11px] px-[14px]"
          >
            {contractEndDate}
          </p>
        </Field>
      </div>
    </WizardSectionCard>
  );
}
