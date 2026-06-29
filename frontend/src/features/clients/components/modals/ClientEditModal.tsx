import { useState } from 'react';
import { parseISO, startOfToday } from 'date-fns';
import { Field, inputCls, selectCls } from '@ui/Field';
import { DatePickerInput } from '@ui/DatePickerInput';
import { Icon } from '@ui/Icon';
import { Label } from '@ui/Label';
import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import { MODAL_CANCEL_STYLE, MODAL_CONFIRM_STYLE } from '@ui/modalButtonStyles';
import { TagInput } from '@ui/TagInput';
import { ToggleGroup } from '@ui/ToggleGroup';
import { DISEASES } from '@/features/clients/constants/diseases';
import { ZONES, DELIVERIES, SEX_OPTIONS } from '@/features/clients/constants/clientOptions';
import type { Client } from '@/features/clients/types';

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
    <Modal onClose={onClose} className="max-w-[560px] w-full max-h-[90vh] overflow-auto">
      <div aria-labelledby="edit-modal-title">
        <div className="sticky top-0 bg-cream z-10 flex items-center gap-[12px] px-[28px] py-[22px] border-b border-hairline">
          <Icon name="settings" size={20} stroke={1.7} className="text-olive-700" />
          <div className="flex-1">
            <h2 id="edit-modal-title" className="font-serif text-[23px] font-semibold leading-none">
              Editar cliente
            </h2>
            <p className="font-mono text-[11px] text-faint mt-[3px]">{client.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-faint hover:text-ink-2 transition-colors flex"
          >
            <Icon name="x" size={20} stroke={1.8} />
          </button>
        </div>

        <div className="py-[22px] px-[28px] space-y-6">
          <div>
            <Label variant="section" className="mb-[13px]">
              Identidad
            </Label>
            <div className="space-y-4">
              <Field label="Nombre completo" htmlFor="em-name" required variant="plain">
                <input
                  id="em-name"
                  type="text"
                  value={draft.name}
                  onChange={(e) => set({ name: e.target.value })}
                  className={inputCls()}
                />
              </Field>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Sexo" htmlFor="em-sex" required variant="plain">
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
                <Field label="Fecha de nacimiento" htmlFor="em-dob" required variant="plain">
                  <DatePickerInput
                    value={draft.dateOfBirth}
                    onChange={(v) => set({ dateOfBirth: v })}
                    captionLayout="dropdown"
                    startMonth={parseISO('1940-01-01')}
                    endMonth={startOfToday()}
                    disabled={{ after: startOfToday() }}
                  />
                </Field>
                <Field label="Celular" htmlFor="em-phone" required variant="plain">
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

          <hr className="border-hairline" />

          <div>
            <Label variant="section" className="mb-[13px]">
              Dirección y entrega
            </Label>
            <div className="space-y-4">
              <Field label="Dirección" htmlFor="em-address" required variant="plain">
                <input
                  id="em-address"
                  type="text"
                  value={draft.address}
                  onChange={(e) => set({ address: e.target.value })}
                  className={inputCls()}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Zona" htmlFor="em-deliveryZone" required variant="plain">
                  <ToggleGroup
                    options={ZONES}
                    value={draft.deliveryZone}
                    onChange={(v) => set({ deliveryZone: v })}
                    selectedClassName="bg-olive-100 text-olive-700 border-olive-200"
                  />
                </Field>
                <Field label="Delivery" htmlFor="em-delivery" required variant="plain">
                  <ToggleGroup
                    options={DELIVERIES}
                    value={draft.delivery}
                    onChange={(v) => set({ delivery: v })}
                    selectedClassName="bg-olive-100 text-olive-700 border-olive-200"
                  />
                </Field>
              </div>
            </div>
          </div>

          <hr className="border-hairline" />

          <TagInput
            label="Alergias, intolerancias y gustos"
            labelClassName="text-[13.5px] font-bold text-ink mb-[13px]"
            placeholder="Ej. lácteos, maní, cebolla…"
            tags={draft.restrictions}
            input={restrictionInput}
            setInput={setRestrictionInput}
            onAdd={addRestriction}
            onRemove={removeRestriction}
            tagClassName="bg-warn-bg border-warn-border text-warn"
          />

          <div>
            <p className="text-[13.5px] font-bold text-ink mb-[5px]">Enfermedades de base</p>
            <p className="font-mono text-[11px] text-faint mb-[13px]">
              Selecciona las que apliquen.
            </p>
            <div className="flex flex-wrap gap-2">
              {DISEASES.map((d) => {
                const selected = draft.underlyingDiseases.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleDisease(d)}
                    className={`py-[6px] px-[13px] rounded-full text-[12.5px] border transition-colors ${
                      selected
                        ? 'font-semibold bg-olive-100 text-olive-700 border-olive-200'
                        : 'font-medium bg-paper text-muted border-rule hover:border-olive-200'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-hairline" />

          <div>
            <Label variant="section" className="mb-[13px]">
              Facturación
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <Field label="NIT" htmlFor="em-nit" variant="plain">
                <input
                  id="em-nit"
                  type="text"
                  value={draft.nit}
                  onChange={(e) => set({ nit: e.target.value })}
                  placeholder="Opcional"
                  className={inputCls()}
                />
              </Field>
              <Field label="Razón social" htmlFor="em-business" variant="plain">
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

        <div className="sticky bottom-0 bg-cream border-t border-hairline px-[28px] py-[16px] flex items-center justify-end gap-[10px]">
          <Button variant="secondary" onClick={onClose} style={MODAL_CANCEL_STYLE}>
            Cancelar
          </Button>
          <Button
            onClick={() => onSave(draft)}
            loading={isSaving}
            leftIcon="check"
            style={MODAL_CONFIRM_STYLE}
          >
            Guardar cambios
          </Button>
        </div>
      </div>
    </Modal>
  );
}
