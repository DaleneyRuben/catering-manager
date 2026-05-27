import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Field, inputCls, selectCls } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { TagInput } from '../components/ui/TagInput';
import { useClient } from '../hooks/useClient';
import type { Client, ClientStatus } from '../types/client';
import { clientStatus } from '../types/client';

const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Activo',
  paused: 'Pausado',
  expiring: 'Por vencer',
  ended: 'Finalizado',
};

const STATUS_CLASSES: Record<ClientStatus, string> = {
  active: 'bg-ok-bg text-ok',
  paused: 'bg-warn-bg text-warn',
  expiring: 'bg-warn-bg text-warn',
  ended: 'bg-rule text-muted',
};

function formatSex(sex: string) {
  if (sex === 'female') return 'Femenino';
  if (sex === 'male') return 'Masculino';
  return 'Otro';
}

function fmt(iso: string) {
  return format(parseISO(iso), 'dd/MM/yyyy');
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('');
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-[13px]">
      <dt className="text-muted w-28 shrink-0">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

interface EditDraft {
  name: string;
  sex: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  zone: string;
  delivery: string;
  nit: string;
  businessName: string;
  underlyingDiseases: string[];
  restrictions: string[];
}

function draftFromClient(c: Client): EditDraft {
  return {
    name: c.name,
    sex: c.sex,
    dateOfBirth: c.dateOfBirth,
    phoneNumber: c.phoneNumber,
    address: c.address,
    zone: c.zone,
    delivery: c.delivery,
    nit: c.nit ?? '',
    businessName: c.businessName ?? '',
    underlyingDiseases: [...c.underlyingDiseases],
    restrictions: [...c.restrictions],
  };
}

function EditClientForm({
  client,
  onSave,
  onCancel,
}: {
  client: Client;
  onSave: (draft: EditDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<EditDraft>(() => draftFromClient(client));
  const [diseaseInput, setDiseaseInput] = useState('');
  const [restrictionInput, setRestrictionInput] = useState('');

  const set = (updates: Partial<EditDraft>) => setDraft((prev) => ({ ...prev, ...updates }));

  const addDisease = () => {
    const v = diseaseInput.trim();
    if (v && !draft.underlyingDiseases.includes(v)) {
      set({ underlyingDiseases: [...draft.underlyingDiseases, v] });
    }
    setDiseaseInput('');
  };

  const removeDisease = (v: string) => {
    set({ underlyingDiseases: draft.underlyingDiseases.filter((d) => d !== v) });
  };

  const addRestriction = () => {
    const v = restrictionInput.trim();
    if (v && !draft.restrictions.includes(v)) {
      set({ restrictions: [...draft.restrictions, v] });
    }
    setRestrictionInput('');
  };

  const removeRestriction = (v: string) => {
    set({ restrictions: draft.restrictions.filter((r) => r !== v) });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
      <div className="bg-paper border border-rule rounded-lg p-6">
        <h3 className="text-[11px] font-mono uppercase tracking-wider text-muted mb-4">
          Identidad
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <Field label="Nombre completo" htmlFor="edit-name" required>
            <input
              id="edit-name"
              type="text"
              value={draft.name}
              onChange={(e) => set({ name: e.target.value })}
              className={inputCls()}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sexo" htmlFor="edit-sex" required>
              <select
                id="edit-sex"
                value={draft.sex}
                onChange={(e) => set({ sex: e.target.value })}
                className={selectCls()}
              >
                <option value="female">Femenino</option>
                <option value="male">Masculino</option>
                <option value="other">Otro</option>
              </select>
            </Field>
            <Field label="Fecha de nacimiento" htmlFor="edit-dob" required>
              <input
                id="edit-dob"
                type="date"
                value={draft.dateOfBirth}
                onChange={(e) => set({ dateOfBirth: e.target.value })}
                className={inputCls()}
              />
            </Field>
          </div>
          <Field label="Teléfono" htmlFor="edit-phone" required>
            <input
              id="edit-phone"
              type="tel"
              value={draft.phoneNumber}
              onChange={(e) => set({ phoneNumber: e.target.value })}
              className={inputCls()}
            />
          </Field>
          <Field label="Dirección" htmlFor="edit-address" required>
            <input
              id="edit-address"
              type="text"
              value={draft.address}
              onChange={(e) => set({ address: e.target.value })}
              className={inputCls()}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Zona" htmlFor="edit-zone" required>
              <select
                id="edit-zone"
                value={draft.zone}
                onChange={(e) => set({ zone: e.target.value })}
                className={selectCls()}
              >
                <option value="Centro">Centro</option>
                <option value="Sur">Sur</option>
              </select>
            </Field>
            <Field label="Delivery" htmlFor="edit-delivery" required>
              <select
                id="edit-delivery"
                value={draft.delivery}
                onChange={(e) => set({ delivery: e.target.value })}
                className={selectCls()}
              >
                <option value="La Oliva">La Oliva</option>
                <option value="Otro">Otro</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="NIT" htmlFor="edit-nit">
              <input
                id="edit-nit"
                type="text"
                value={draft.nit}
                onChange={(e) => set({ nit: e.target.value })}
                placeholder="Opcional"
                className={inputCls()}
              />
            </Field>
            <Field label="Razón social" htmlFor="edit-business">
              <input
                id="edit-business"
                type="text"
                value={draft.businessName}
                onChange={(e) => set({ businessName: e.target.value })}
                placeholder="Opcional"
                className={inputCls()}
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-rule grid grid-cols-1 gap-6">
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-muted -mb-2">
            Restricciones
          </h3>
          <TagInput
            label="Enfermedades de base"
            tags={draft.underlyingDiseases}
            input={diseaseInput}
            setInput={setDiseaseInput}
            onAdd={addDisease}
            onRemove={removeDisease}
          />
          <TagInput
            label="Restricciones alimentarias"
            tags={draft.restrictions}
            input={restrictionInput}
            setInput={setRestrictionInput}
            onAdd={addRestriction}
            onRemove={removeRestriction}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:pt-0">
        <div className="flex gap-3 mt-2 sm:mt-0 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-[13px] font-semibold border border-rule rounded-md text-ink hover:bg-cream-2 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors"
          >
            <Icon name="check" size={14} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { client, update } = useClient(id!);
  const [isEditing, setIsEditing] = useState(false);

  const handleToggleActive = async () => {
    if (!client) return;
    await update({ isActive: !client.isActive });
  };

  const handleSave = async (draft: EditDraft) => {
    await update({
      name: draft.name,
      sex: draft.sex,
      dateOfBirth: draft.dateOfBirth,
      phoneNumber: draft.phoneNumber,
      address: draft.address,
      zone: draft.zone,
      delivery: draft.delivery,
      nit: draft.nit || null,
      businessName: draft.businessName || null,
      underlyingDiseases: draft.underlyingDiseases,
      restrictions: draft.restrictions,
    });
    setIsEditing(false);
  };

  if (!client) {
    return (
      <div className="p-7 max-w-[1320px] mx-auto">
        <p className="text-muted text-[13px]">Cargando…</p>
      </div>
    );
  }

  const sub = client.subscriptions[0];
  const status = clientStatus(client);

  const identityRows: [string, string][] = [
    ['Sexo', formatSex(client.sex)],
    ['Nacimiento', fmt(client.dateOfBirth)],
    ['Teléfono', client.phoneNumber],
    ['Dirección', client.address],
    ['Zona', client.zone],
    ['Delivery', client.delivery],
    ...(client.nit ? ([['NIT', client.nit]] as [string, string][]) : []),
    ...(client.businessName ? ([['Razón social', client.businessName]] as [string, string][]) : []),
  ];

  return (
    <div className="p-7 max-w-[1320px] mx-auto">
      <button
        type="button"
        onClick={() => navigate('/clientes')}
        className="flex items-center gap-1.5 text-[13px] text-muted hover:text-ink mb-5 transition-colors"
      >
        <Icon name="arrow-left" size={13} />
        Clientes
      </button>

      <div className="flex items-start gap-4 mb-8 flex-wrap">
        <div className="w-14 h-14 rounded-full bg-olive-800 text-white flex items-center justify-center font-serif text-xl font-semibold shrink-0">
          {initials(client.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-1">
            Directorio
          </p>
          <h1 className="font-serif text-[44px] leading-none text-ink">{client.name}</h1>
          <span
            className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-mono ${STATUS_CLASSES[status]}`}
          >
            {STATUS_LABELS[status]}
          </span>
        </div>
        {!isEditing && (
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2.5 text-[13px] font-semibold border border-rule rounded-md text-ink hover:bg-cream-2 transition-colors"
            >
              Editar
            </button>
            {client.isActive ? (
              <button
                type="button"
                onClick={handleToggleActive}
                className="px-4 py-2.5 text-[13px] font-semibold border border-rule rounded-md text-ink hover:bg-cream-2 transition-colors"
              >
                Pausar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleToggleActive}
                className="px-4 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors"
              >
                Reanudar
              </button>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <EditClientForm client={client} onSave={handleSave} onCancel={() => setIsEditing(false)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="bg-paper border border-rule rounded-lg p-6">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-muted mb-4">
              Identidad
            </h3>
            <dl className="space-y-3">
              {identityRows.map(([label, value]) => (
                <InfoRow key={label} label={label} value={value} />
              ))}
            </dl>

            {(client.underlyingDiseases.length > 0 || client.restrictions.length > 0) && (
              <div className="mt-6 pt-5 border-t border-rule">
                <h3 className="text-[11px] font-mono uppercase tracking-wider text-muted mb-4">
                  Restricciones
                </h3>
                <dl className="space-y-3">
                  {client.underlyingDiseases.length > 0 && (
                    <InfoRow label="Enfermedades" value={client.underlyingDiseases.join(', ')} />
                  )}
                  {client.restrictions.length > 0 && (
                    <InfoRow label="Restricciones" value={client.restrictions.join(', ')} />
                  )}
                </dl>
              </div>
            )}
          </div>

          <div className="bg-paper border border-rule rounded-lg p-6">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-muted mb-4">
              Plan actual
            </h3>
            {sub ? (
              <dl className="space-y-3">
                <InfoRow label="Plan" value={sub.plan.name} />
                <InfoRow label="Precio" value={String(sub.plan.price)} />
                <InfoRow label="Inicio" value={fmt(sub.startDate)} />
                <InfoRow label="Fin contrato" value={fmt(sub.contractEndDate)} />
                <InfoRow label="Contratado" value={fmt(sub.contractDate)} />
              </dl>
            ) : (
              <p className="text-[13px] text-muted">Sin suscripción activa.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
