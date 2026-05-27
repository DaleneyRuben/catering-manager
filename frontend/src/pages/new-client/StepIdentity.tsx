import { type UseFormRegister, type FieldErrors, type Control, Controller } from 'react-hook-form';
import { Field, inputCls, selectCls } from '../../components/ui/Field';
import { Icon } from '../../components/ui/Icon';
import { ToggleGroup } from '../../components/ui/ToggleGroup';
import type { NewClientFormValues } from './types';

interface Props {
  register: UseFormRegister<NewClientFormValues>;
  control: Control<NewClientFormValues>;
  errors: FieldErrors<NewClientFormValues>;
}

const ZONES = ['Centro', 'Sur'] as const;
const DELIVERIES = ['La Oliva', 'Otro'] as const;

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
              placeholder="Ej. María García Soler"
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
            <option value="female">Femenino</option>
            <option value="male">Masculino</option>
            <option value="other">Otro</option>
          </select>
        </Field>

        <Field
          label="Fecha de nacimiento"
          htmlFor="dateOfBirth"
          required
          error={errors.dateOfBirth?.message}
        >
          <input
            id="dateOfBirth"
            type="date"
            {...register('dateOfBirth', { required: 'Fecha de nacimiento es requerida' })}
            className={inputCls(!!errors.dateOfBirth)}
          />
        </Field>

        <Field label="Teléfono" htmlFor="phoneNumber" required error={errors.phoneNumber?.message}>
          <input
            id="phoneNumber"
            type="tel"
            placeholder="+34 …"
            {...register('phoneNumber', { required: 'Teléfono es requerido' })}
            className={inputCls(!!errors.phoneNumber)}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Dirección" htmlFor="address" required error={errors.address?.message}>
            <input
              id="address"
              type="text"
              placeholder="Calle, número, piso…"
              {...register('address', { required: 'Dirección es requerida' })}
              className={inputCls(!!errors.address)}
            />
          </Field>
        </div>

        <Controller
          name="zone"
          control={control}
          rules={{ required: 'Zona es requerida' }}
          render={({ field }) => (
            <Field label="Zona" htmlFor="zone" required error={errors.zone?.message}>
              <ToggleGroup
                options={ZONES}
                value={field.value as (typeof ZONES)[number] | ''}
                onChange={field.onChange}
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
