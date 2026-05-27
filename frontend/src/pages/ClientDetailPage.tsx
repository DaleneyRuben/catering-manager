import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { differenceInDays, differenceInYears, format, parseISO } from 'date-fns';
import { Field, inputCls, selectCls } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { TagInput } from '../components/ui/TagInput';
import { ToggleGroup } from '../components/ui/ToggleGroup';
import { useClient } from '../hooks/useClient';
import { MEAL_LABELS } from '../constants/meals';
import type { Client, ClientStatus } from '../types/client';
import { clientStatus } from '../types/client';

const DISEASES = [
  'Diabetes',
  'Hipertensión',
  'Sobrepeso',
  'Gastritis',
  'Celíaco',
  'Intolerancia a la lactosa',
  'Enfermedad renal',
  'Anemia',
  'Postoperatorias',
  'Adulto mayor',
] as const;

type TabId = 'overview' | 'plan' | 'suspensions' | 'history';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Resumen' },
  { id: 'plan', label: 'Plan + facturación' },
  { id: 'suspensions', label: 'Suspensiones' },
  { id: 'history', label: 'Historial' },
];

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

function ClientEditModal({
  client,
  onSave,
  onClose,
  isSaving,
}: {
  client: Client;
  onSave: (draft: EditDraft) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [draft, setDraft] = useState<EditDraft>(() => draftFromClient(client));
  const [restrictionInput, setRestrictionInput] = useState('');

  const set = (updates: Partial<EditDraft>) => setDraft((prev) => ({ ...prev, ...updates }));

  const addRestriction = () => {
    const v = restrictionInput.trim();
    if (!v) return;
    set({ restrictions: [...draft.restrictions, v] });
    setRestrictionInput('');
  };

  const removeRestriction = (v: string) => {
    set({ restrictions: draft.restrictions.filter((r) => r !== v) });
  };

  const toggleDisease = (d: string) => {
    const selected = draft.underlyingDiseases.includes(d);
    set({
      underlyingDiseases: selected
        ? draft.underlyingDiseases.filter((x) => x !== d)
        : [...draft.underlyingDiseases, d],
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(780px,94vw)] max-h-[92vh] overflow-auto bg-cream border border-rule-2 rounded-xl shadow-2xl"
      >
        <div className="sticky top-0 bg-cream z-10 flex items-center gap-2.5 px-6 py-[18px] border-b border-rule">
          <Icon name="settings" size={16} />
          <div className="flex-1">
            <h2 id="edit-modal-title" className="font-serif text-[22px]">
              Editar cliente
            </h2>
            <p className="font-mono text-[11px] text-muted">{client.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-cream-2 transition-colors"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        <div className="p-[22px] space-y-6">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">
              Identidad
            </p>
            <div className="space-y-4">
              <Field label="Nombre completo" htmlFor="em-name" required>
                <input
                  id="em-name"
                  type="text"
                  value={draft.name}
                  onChange={(e) => set({ name: e.target.value })}
                  className={inputCls()}
                />
              </Field>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Sexo" htmlFor="em-sex" required>
                  <select
                    id="em-sex"
                    value={draft.sex}
                    onChange={(e) => set({ sex: e.target.value })}
                    className={selectCls()}
                  >
                    <option value="female">Femenino</option>
                    <option value="male">Masculino</option>
                    <option value="other">Otro</option>
                  </select>
                </Field>
                <Field label="Fecha de nacimiento" htmlFor="em-dob" required>
                  <input
                    id="em-dob"
                    type="date"
                    value={draft.dateOfBirth}
                    onChange={(e) => set({ dateOfBirth: e.target.value })}
                    className={inputCls()}
                  />
                </Field>
                <Field label="Celular" htmlFor="em-phone" required>
                  <input
                    id="em-phone"
                    type="tel"
                    value={draft.phoneNumber}
                    onChange={(e) => set({ phoneNumber: e.target.value })}
                    className={inputCls()}
                  />
                </Field>
              </div>
            </div>
          </div>

          <hr className="border-rule" />

          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">
              Dirección y entrega
            </p>
            <div className="space-y-4">
              <Field label="Dirección" htmlFor="em-address" required>
                <input
                  id="em-address"
                  type="text"
                  value={draft.address}
                  onChange={(e) => set({ address: e.target.value })}
                  className={inputCls()}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Zona" htmlFor="em-zone" required>
                  <ToggleGroup
                    options={['Centro', 'Sur']}
                    value={draft.zone}
                    onChange={(v) => set({ zone: v })}
                  />
                </Field>
                <Field label="Delivery" htmlFor="em-delivery" required>
                  <ToggleGroup
                    options={['La Oliva', 'Otro']}
                    value={draft.delivery}
                    onChange={(v) => set({ delivery: v })}
                  />
                </Field>
              </div>
            </div>
          </div>

          <hr className="border-rule" />

          <TagInput
            label="Alergias, intolerancias y gustos"
            tags={draft.restrictions}
            input={restrictionInput}
            setInput={setRestrictionInput}
            onAdd={addRestriction}
            onRemove={removeRestriction}
          />

          <div>
            <p className="text-[13px] font-semibold text-ink mb-1">Enfermedades de base</p>
            <p className="text-[11.5px] font-mono text-muted mb-3">Seleccioná las que apliquen.</p>
            <div className="flex flex-wrap gap-2">
              {DISEASES.map((d) => {
                const selected = draft.underlyingDiseases.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleDisease(d)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-mono border transition-colors ${
                      selected
                        ? 'bg-olive-700 text-white border-olive-800'
                        : 'bg-paper text-ink border-rule hover:border-olive-700'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-rule" />

          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">
              Facturación
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="NIT" htmlFor="em-nit">
                <input
                  id="em-nit"
                  type="text"
                  value={draft.nit}
                  onChange={(e) => set({ nit: e.target.value })}
                  placeholder="Opcional"
                  className={inputCls()}
                />
              </Field>
              <Field label="Razón social" htmlFor="em-business">
                <input
                  id="em-business"
                  type="text"
                  value={draft.businessName}
                  onChange={(e) => set({ businessName: e.target.value })}
                  placeholder="Opcional"
                  className={inputCls()}
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-cream border-t border-rule px-6 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-[13px] font-semibold border border-rule rounded-md text-ink hover:bg-cream-2 transition-colors"
          >
            Cancelar
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => onSave(draft)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <Icon name="check" size={14} />
            )}
            Guardar cambios
          </button>
        </div>
      </div>
    </>
  );
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { client, update, isUpdating } = useClient(id!);
  const [tab, setTab] = useState<TabId>('overview');
  const [editOpen, setEditOpen] = useState(false);

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
    setEditOpen(false);
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
  const age = differenceInYears(new Date(), parseISO(client.dateOfBirth));
  const remaining = sub ? differenceInDays(parseISO(sub.contractEndDate), new Date()) : 0;

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

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="w-16 h-16 rounded-full bg-olive-800 text-white flex items-center justify-center font-serif text-[26px] font-semibold shrink-0">
          {initials(client.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-[36px] leading-none text-ink">{client.name}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono ${STATUS_CLASSES[status]}`}
            >
              {STATUS_LABELS[status]}
            </span>
          </div>
          <p className="font-mono text-[12px] text-muted mt-1.5">
            {age} años · {client.sex} · {client.zone} · {client.phoneNumber}
          </p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          {client.isActive ? (
            <button
              type="button"
              onClick={handleToggleActive}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border border-rule rounded-md text-ink hover:bg-cream-2 transition-colors"
            >
              <Icon name="calendar" size={14} />
              Pausar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleActive}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors"
            >
              <Icon name="check" size={14} />
              Reanudar
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors"
          >
            <Icon name="settings" size={14} />
            Editar
          </button>
        </div>
      </div>

      <div role="tablist" className="flex border-b border-rule mb-5">
        {TABS.map(({ id: tId, label }) => (
          <button
            key={tId}
            type="button"
            role="tab"
            aria-selected={tab === tId}
            onClick={() => setTab(tId)}
            className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
              tab === tId
                ? 'border-olive-800 text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
            <div className="bg-paper border border-rule rounded-lg p-5">
              <div className="flex items-center mb-3">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                  Plan vigente
                </p>
                {sub && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cream-2 border border-rule text-ink">
                      {sub.plan.name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono text-muted">
                      {sub.plan.price}/mes
                    </span>
                  </div>
                )}
              </div>
              {sub ? (
                <>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {sub.plan.meals.map((m) => (
                      <span
                        key={m}
                        className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-cream-2 border border-rule text-ink"
                      >
                        {MEAL_LABELS[m] ?? m}
                      </span>
                    ))}
                  </div>
                  <p className="font-mono text-[11.5px] text-muted">
                    {fmt(sub.startDate)} → {fmt(sub.contractEndDate)} · quedan {remaining} día
                    {remaining === 1 ? '' : 's'}
                  </p>
                </>
              ) : (
                <p className="text-[13px] text-muted">Sin suscripción activa.</p>
              )}
            </div>

            <div className="bg-paper border border-rule rounded-lg p-5">
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">
                Contacto
              </p>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <Icon name="phone" size={14} />
                  <span className="font-mono text-[13px]">{client.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Icon name="pin" size={14} />
                  <span className="text-[13px]">{client.address}</span>
                  <span className="text-muted text-[13px]"> · </span>
                  <span className="text-[13px]">{client.zone}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Icon name="refresh" size={14} />
                  <span className="text-[13px] text-muted">
                    Entrega: <strong className="text-ink font-semibold">{client.delivery}</strong>
                  </span>
                </div>
              </div>
              {(client.nit || client.businessName) && (
                <>
                  <hr className="border-rule my-3" />
                  <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-2">
                    Facturación
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                        NIT
                      </p>
                      <p className="font-mono text-[13px]">{client.nit || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                        Razón social
                      </p>
                      <p className="font-mono text-[13px]">{client.businessName || '—'}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
            <div className="bg-paper border border-rule rounded-lg p-5">
              <div className="flex items-center mb-3">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                  Restricciones
                </p>
                <span className="ml-auto font-mono text-[10.5px] text-muted">
                  {client.restrictions.length}
                </span>
              </div>
              {client.underlyingDiseases.length === 0 && client.restrictions.length === 0 ? (
                <p className="font-mono text-[12px] text-muted">Sin restricciones registradas.</p>
              ) : (
                <div className="space-y-3">
                  {client.underlyingDiseases.length > 0 && (
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1.5">
                        Enfermedades
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {client.underlyingDiseases.map((d) => (
                          <span
                            key={d}
                            className="px-2.5 py-1 rounded-full text-[12px] font-mono bg-cream-2 border border-rule text-ink"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {client.restrictions.length > 0 && (
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1.5">
                        Alergias y gustos
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {client.restrictions.map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-warn-bg text-warn text-[12px] font-mono rounded-full"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-paper border border-rule rounded-lg p-5">
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">
                Acciones rápidas
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2.5 text-[13px] border border-rule rounded-md text-ink hover:bg-cream-2 transition-colors"
                >
                  <Icon name="calendar" size={14} />
                  Suspender días
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2.5 text-[13px] border border-rule rounded-md text-ink hover:bg-cream-2 transition-colors"
                >
                  <Icon name="refresh" size={14} />
                  Cambiar de plan
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2.5 text-[13px] border border-[#e9c4bb] rounded-md text-alert hover:bg-cream-2 transition-colors"
                >
                  Finalizar plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'plan' && (
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-7">
            <div className="bg-paper border border-rule rounded-lg p-5">
              {sub ? (
                <>
                  <div className="flex items-start flex-wrap gap-3 mb-4">
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1">
                        Plan asignado
                      </p>
                      <p className="font-serif text-[28px]">{sub.plan.name}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="font-mono text-[10.5px] text-muted">Total mensual</p>
                      <p className="font-serif text-[40px] text-olive-800 tabular-nums">
                        {sub.plan.price}
                      </p>
                    </div>
                  </div>
                  <hr className="border-rule mb-4" />
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {sub.plan.meals.map((m) => (
                      <span
                        key={m}
                        className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-cream-2 border border-rule text-ink"
                      >
                        {MEAL_LABELS[m] ?? m}
                      </span>
                    ))}
                  </div>
                  <hr className="border-rule mb-4" />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                        Precio
                      </p>
                      <p className="font-mono text-[14px]">{sub.plan.price}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                        Descuento
                      </p>
                      <p className="font-mono text-[14px] text-muted">—</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                        Total
                      </p>
                      <p className="font-mono text-[14px] font-bold text-olive-800">
                        {sub.plan.price}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-[13px] text-muted">Sin suscripción activa.</p>
              )}
            </div>
          </div>
          {sub && (
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
              <div className="bg-paper border border-rule rounded-lg p-5">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">
                  Contrato
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                      Firma
                    </p>
                    <p className="font-mono text-[13px]">{fmt(sub.contractDate)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                      Inicio
                    </p>
                    <p className="font-mono text-[13px]">{fmt(sub.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted">Fin</p>
                    <p className="font-mono text-[13px]">{fmt(sub.contractEndDate)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                      Restan
                    </p>
                    <p className="font-mono text-[13px]">{remaining} d. hábiles</p>
                  </div>
                </div>
              </div>
              <div className="bg-paper border border-rule rounded-lg p-5">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">
                  Facturación
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted">NIT</p>
                    <p className="font-mono text-[13px]">{client.nit || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                      Razón social
                    </p>
                    <p className="font-mono text-[13px] break-words">
                      {client.businessName || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'suspensions' && (
        <div className="bg-paper border border-rule rounded-lg p-10 text-center">
          <p className="font-mono text-[13px] text-muted">Sin suspensiones registradas.</p>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-paper border border-rule rounded-lg p-10 text-center">
          <p className="font-mono text-[13px] text-muted">Sin eventos en el historial.</p>
        </div>
      )}

      {editOpen && (
        <ClientEditModal
          client={client}
          onSave={handleSave}
          onClose={() => setEditOpen(false)}
          isSaving={isUpdating}
        />
      )}
    </div>
  );
}
