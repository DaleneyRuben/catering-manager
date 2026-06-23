import { type UseFormRegister, type FieldErrors, type Control, Controller } from 'react-hook-form';
import { parseISO, startOfToday } from 'date-fns';
import { Field, inputCls, selectCls } from '../../components/ui/Field';
import { Icon } from '../../components/ui/Icon';
import { ToggleGroup } from '../../components/ui/ToggleGroup';
import { DatePickerInput } from '../../components/ui/DatePickerInput';
import type { NewClientFormValues } from './types';
import { ZONES, DELIVERIES, SEX_OPTIONS } from '../../constants/clientOptions';

interface Props {
  register: UseFormRegister<NewClientFormValues>;
  control: Control<NewClientFormValues>;
  errors: FieldErrors<NewClientFormValues>;
}

export function StepIdentity({ register, control, errors }: Props) {
  return (
    <div>
      <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-4">
        Identidad y contacto
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <Field label="Nombre completo" htmlFor="name" required error={errors.name?.message}>
            <input
              id="name"
              type="text"
              {...register('name', { required: 'Nombre es requerido' })}
              className={inputCls(!!errors.name)}
            />
          </Field>
        </div>

        <Field label="Sexo" htmlFor="sex" required error={errors.sex?.message}>
          <select
            id="sex"
            {...register('sex', { required: 'Sexo es requerido' })}
            className={selectCls(!!errors.sex)}
          >
            <option value="">Seleccionar…</option>
            {SEX_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Controller
          name="dateOfBirth"
          control={control}
          rules={{ required: 'Fecha de nacimiento es requerida' }}
          render={({ field }) => (
            <Field
              label="Fecha de nacimiento"
              htmlFor="dateOfBirth"
              required
              error={errors.dateOfBirth?.message}
            >
              <DatePickerInput
                id="dateOfBirth"
                value={field.value ?? ''}
                onChange={field.onChange}
                hasError={!!errors.dateOfBirth}
                captionLayout="dropdown"
                startMonth={parseISO('1940-01-01')}
                endMonth={startOfToday()}
                disabled={{ after: startOfToday() }}
              />
            </Field>
          )}
        />

        <Field label="Celular" htmlFor="phoneNumber" required error={errors.phoneNumber?.message}>
          <input
            id="phoneNumber"
            type="tel"
            {...register('phoneNumber', { required: 'Teléfono es requerido' })}
            className={inputCls(!!errors.phoneNumber)}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Dirección" htmlFor="address" required error={errors.address?.message}>
            <input
              id="address"
              type="text"
              {...register('address', { required: 'Dirección es requerida' })}
              className={inputCls(!!errors.address)}
            />
          </Field>
        </div>

        <Controller
          name="deliveryZone"
          control={control}
          rules={{ required: 'Zona es requerida' }}
          render={({ field }) => (
            <Field
              label="Zona"
              htmlFor="deliveryZone"
              required
              error={errors.deliveryZone?.message}
            >
              <ToggleGroup
                options={ZONES}
                value={field.value as (typeof ZONES)[number] | ''}
                onChange={field.onChange}
                selectedClassName="bg-olive-100 text-olive-700 border-olive-200"
              />
            </Field>
          )}
        />

        <Controller
          name="delivery"
          control={control}
          rules={{ required: 'Delivery es requerido' }}
          render={({ field }) => (
            <Field label="Delivery" htmlFor="delivery" required error={errors.delivery?.message}>
              <ToggleGroup
                options={DELIVERIES}
                value={field.value as (typeof DELIVERIES)[number] | ''}
                onChange={field.onChange}
                selectedClassName="bg-olive-100 text-olive-700 border-olive-200"
              />
            </Field>
          )}
        />
      </div>

      <div className="border-t border-rule mt-6 pt-5">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="report" size={14} />
          <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted">
            Facturación (opcional)
          </p>
          <span className="text-[11px] font-mono text-muted">NIT y razón social</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="NIT" htmlFor="nit">
            <input
              id="nit"
              type="text"
              placeholder="—"
              {...register('nit')}
              className={inputCls()}
            />
          </Field>
          <Field label="Razón social" htmlFor="businessName">
            <input
              id="businessName"
              type="text"
              placeholder="—"
              {...register('businessName')}
              className={inputCls()}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
