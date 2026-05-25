import { Field, inputCls, selectCls } from '../../components/ui/Field';
import type { IdentityState } from './types';

interface Props {
  value: IdentityState;
  onChange: (updates: Partial<IdentityState>) => void;
  errors: Record<string, string>;
}

export function StepIdentity({ value, onChange, errors }: Props) {
  return (
    <div>
      <h2 className="font-semibold text-ink text-[15px] mb-6">Identidad</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <Field label="Nombre completo" htmlFor="name" required error={errors.name}>
            <input
              id="name"
              type="text"
              value={value.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className={inputCls(!!errors.name)}
            />
          </Field>
        </div>
        <Field label="Sexo" htmlFor="sex" required error={errors.sex}>
          <select
            id="sex"
            value={value.sex}
            onChange={(e) => onChange({ sex: e.target.value })}
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
            value={value.dateOfBirth}
            onChange={(e) => onChange({ dateOfBirth: e.target.value })}
            className={inputCls(!!errors.dateOfBirth)}
          />
        </Field>
        <Field label="Teléfono" htmlFor="phoneNumber" required error={errors.phoneNumber}>
          <input
            id="phoneNumber"
            type="tel"
            value={value.phoneNumber}
            onChange={(e) => onChange({ phoneNumber: e.target.value })}
            className={inputCls(!!errors.phoneNumber)}
          />
        </Field>
        <Field label="Dirección" htmlFor="address" required error={errors.address}>
          <input
            id="address"
            type="text"
            value={value.address}
            onChange={(e) => onChange({ address: e.target.value })}
            className={inputCls(!!errors.address)}
          />
        </Field>
        <Field label="Zona" htmlFor="zone" required error={errors.zone}>
          <select
            id="zone"
            value={value.zone}
            onChange={(e) => onChange({ zone: e.target.value })}
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
            value={value.delivery}
            onChange={(e) => onChange({ delivery: e.target.value })}
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
            value={value.nit}
            onChange={(e) => onChange({ nit: e.target.value })}
            placeholder="Opcional"
            className={inputCls()}
          />
        </Field>
        <Field label="Razón social" htmlFor="businessName">
          <input
            id="businessName"
            type="text"
            value={value.businessName}
            onChange={(e) => onChange({ businessName: e.target.value })}
            placeholder="Opcional"
            className={inputCls()}
          />
        </Field>
      </div>
    </div>
  );
}
