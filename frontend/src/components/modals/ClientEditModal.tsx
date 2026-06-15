import { useState } from 'react';
import { parseISO, startOfToday } from 'date-fns';
import { Field, inputCls, selectCls } from '../ui/Field';
import { DatePickerInput } from '../ui/DatePickerInput';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TagInput } from '../ui/TagInput';
import { ToggleGroup } from '../ui/ToggleGroup';
import { DISEASES } from '../../constants/diseases';
import { ZONES, DELIVERIES, SEX_OPTIONS } from '../../constants/clientOptions';
import type { Client } from '../../types/client';

export interface EditDraft {
  name: string;
  sex: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  deliveryZone: string;
  delivery: string;
  nit: string;
  businessName: string;
  underlyingDiseases: string[];
  restrictions: string[];
}

export function draftFromClient(c: Client): EditDraft {
  return {
    name: c.name,
    sex: c.sex,
    dateOfBirth: c.dateOfBirth,
    phoneNumber: c.phoneNumber,
    address: c.address,
    deliveryZone: c.deliveryZone,
    delivery: c.delivery,
    nit: c.nit ?? '',
    businessName: c.businessName ?? '',
    underlyingDiseases: [...c.underlyingDiseases],
    restrictions: [...c.restrictions],
  };
}

export function ClientEditModal({
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
    <Modal onClose={onClose} className="rounded-xl w-[min(780px,94vw)] max-h-[92vh] overflow-auto">
      <div aria-labelledby="edit-modal-title">
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
                    {SEX_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Fecha de nacimiento" htmlFor="em-dob" required>
                  <DatePickerInput
                    value={draft.dateOfBirth}
                    onChange={(v) => set({ dateOfBirth: v })}
                    captionLayout="dropdown"
                    startMonth={parseISO('1940-01-01')}
                    endMonth={startOfToday()}
                    disabled={{ after: startOfToday() }}
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
                <Field label="Zona" htmlFor="em-deliveryZone" required>
                  <ToggleGroup
                    options={ZONES}
                    value={draft.deliveryZone}
                    onChange={(v) => set({ deliveryZone: v })}
                    selectedClassName="bg-olive-100 text-ink border-olive-200"
                  />
                </Field>
                <Field label="Delivery" htmlFor="em-delivery" required>
                  <ToggleGroup
                    options={DELIVERIES}
                    value={draft.delivery}
                    onChange={(v) => set({ delivery: v })}
                    selectedClassName="bg-olive-100 text-ink border-olive-200"
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
            tagClassName="bg-olive-100 border-olive-200 text-ink"
          />

          <div>
            <p className="text-[13px] font-semibold text-ink mb-1">Enfermedades de base</p>
            <p className="text-[11.5px] font-mono text-muted mb-3">Selecciona las que apliquen.</p>
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
                        ? 'bg-olive-100 text-ink border-olive-200'
                        : 'bg-paper text-ink border-rule hover:border-olive-200'
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
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <div className="flex-1" />
          <Button onClick={() => onSave(draft)} loading={isSaving} leftIcon="check">
            Guardar cambios
          </Button>
        </div>
      </div>
    </Modal>
  );
}
