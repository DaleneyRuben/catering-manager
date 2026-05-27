import { useState } from 'react';
import { Field, inputCls, selectCls } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { TagInput } from '../components/ui/TagInput';
import { ToggleGroup } from '../components/ui/ToggleGroup';
import { DISEASES } from '../constants/diseases';
import type { Client } from '../types/client';

export interface EditDraft {
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

export function draftFromClient(c: Client): EditDraft {
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
