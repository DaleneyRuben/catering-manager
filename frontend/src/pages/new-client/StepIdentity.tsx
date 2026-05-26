import { type UseFormRegister, type FieldErrors } from 'react-hook-form';
import { Field, inputCls, selectCls } from '../../components/ui/Field';
import type { NewClientFormValues } from './types';

interface Props {
  register: UseFormRegister<NewClientFormValues>;
  errors: FieldErrors<NewClientFormValues>;
}

export function StepIdentity({ register, errors }: Props) {
  return (
    <div>
      <h2 className="font-semibold text-ink text-[15px] mb-6">Identidad</h2>
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
            {...register('phoneNumber', { required: 'Teléfono es requerido' })}
            className={inputCls(!!errors.phoneNumber)}
          />
        </Field>
        <Field label="Dirección" htmlFor="address" required error={errors.address?.message}>
          <input
            id="address"
            type="text"
            {...register('address', { required: 'Dirección es requerida' })}
            className={inputCls(!!errors.address)}
          />
        </Field>
        <Field label="Zona" htmlFor="zone" required error={errors.zone?.message}>
          <select
            id="zone"
            {...register('zone', { required: 'Zona es requerida' })}
            className={selectCls(!!errors.zone)}
          >
            <option value="">Seleccionar…</option>
            <option value="Centro">Centro</option>
            <option value="Sur">Sur</option>
          </select>
        </Field>
        <Field label="Delivery" htmlFor="delivery" required error={errors.delivery?.message}>
          <select
            id="delivery"
            {...register('delivery', { required: 'Delivery es requerido' })}
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
            placeholder="Opcional"
            {...register('nit')}
            className={inputCls()}
          />
        </Field>
        <Field label="Razón social" htmlFor="businessName">
          <input
            id="businessName"
            type="text"
            placeholder="Opcional"
            {...register('businessName')}
            className={inputCls()}
          />
        </Field>
      </div>
    </div>
  );
}
