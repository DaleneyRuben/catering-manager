import { type UseFormRegister, type FieldErrors, type Control, Controller } from 'react-hook-form';
import { parseISO, startOfToday } from 'date-fns';
import { Field, inputCls, selectCls } from '@/components/ui/Field';
import { ToggleGroup } from '@/components/ui/ToggleGroup';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { WizardSectionCard } from '@/components/ui/WizardSectionCard';
import type { NewClientFormValues } from '@/features/clients/types';
import { ZONES, DELIVERIES, SEX_OPTIONS } from '@/constants/clientOptions';

interface Props {
  register: UseFormRegister<NewClientFormValues>;
  control: Control<NewClientFormValues>;
  errors: FieldErrors<NewClientFormValues>;
}

export function StepIdentity({ register, control, errors }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <WizardSectionCard
        icon="user-plus"
        iconBg="bg-olive-100"
        iconColor="text-olive-700"
        title="Identidad y contacto"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[22px] gap-y-[18px]">
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
      </WizardSectionCard>

      <WizardSectionCard
        icon="report"
        iconBg="bg-cream-2"
        iconColor="text-muted"
        title="Facturación"
        badge="opcional"
        description="NIT y razón social para emisión de factura."
      >
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-x-[22px] gap-y-[18px]">
          <Field label="NIT" htmlFor="nit">
            <input
              id="nit"
              type="text"
              placeholder="0000000000"
              {...register('nit')}
              className={inputCls()}
            />
          </Field>
          <Field label="Razón social" htmlFor="businessName">
            <input
              id="businessName"
              type="text"
              placeholder="Nombre o empresa"
              {...register('businessName')}
              className={inputCls()}
            />
          </Field>
        </div>
      </WizardSectionCard>
    </div>
  );
}
