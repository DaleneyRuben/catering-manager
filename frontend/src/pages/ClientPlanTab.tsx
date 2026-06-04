import { useState } from 'react';
import { startOfToday } from 'date-fns';
import { MEAL_LABELS } from '../constants/meals';
import type { Client, Subscription } from '../types/client';
import { formatDate } from '../utils/format';
import { addBusinessDays } from '../utils/businessDays';
import { DatePickerInput } from '../components/ui/DatePickerInput';
import { Icon } from '../components/ui/Icon';

interface ContractDraft {
  contractDate: string;
  startDate: string;
  duration: number;
}

interface Props {
  client: Client;
  sub: Subscription | undefined;
  remaining: number;
  onUpdateContract: (draft: ContractDraft) => Promise<void>;
}

function ContractCard({
  sub,
  remaining,
  onUpdateContract,
}: {
  sub: Subscription;
  remaining: number;
  onUpdateContract: (draft: ContractDraft) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<ContractDraft>({
    contractDate: sub.contractDate,
    startDate: sub.startDate,
    duration: sub.duration,
  });

  const previewEndDate =
    draft.startDate && draft.duration > 0
      ? addBusinessDays(draft.startDate, draft.duration)
      : sub.contractEndDate;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateContract(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft({ contractDate: sub.contractDate, startDate: sub.startDate, duration: sub.duration });
    setEditing(false);
  };

  return (
    <div className="bg-paper border border-rule rounded-lg p-5">
      <div className="flex items-center mb-3">
        <p className="text-[11px] font-mono uppercase tracking-wider text-muted">Contrato</p>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-auto flex items-center gap-1.5 text-[11px] font-mono text-muted hover:text-ink transition-colors"
          >
            <Icon name="settings" size={11} />
            Editar
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1">
                Firma
              </p>
              <DatePickerInput
                value={draft.contractDate}
                onChange={(v) => setDraft((d) => ({ ...d, contractDate: v }))}
                endMonth={startOfToday()}
              />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1">
                Inicio
              </p>
              <DatePickerInput
                value={draft.startDate}
                onChange={(v) => setDraft((d) => ({ ...d, startDate: v }))}
              />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1">
                Duración (días hábiles)
              </p>
              <input
                type="number"
                min={1}
                value={draft.duration}
                onChange={(e) => setDraft((d) => ({ ...d, duration: Number(e.target.value) }))}
                className="w-full px-2.5 py-1.5 text-[13px] font-mono border border-rule rounded-md bg-cream focus:outline-none focus:border-olive-600"
              />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1">Fin</p>
              <p className="font-mono text-[13px] py-1.5">{formatDate(previewEndDate)}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-3 py-1.5 text-[12px] font-semibold border border-rule rounded-md text-ink hover:bg-cream-2 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors disabled:opacity-60"
            >
              {saving && (
                <span className="inline-block w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              )}
              Guardar
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted">Firma</p>
            <p className="font-mono text-[13px]">{formatDate(sub.contractDate)}</p>
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted">Inicio</p>
            <p className="font-mono text-[13px]">{formatDate(sub.startDate)}</p>
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted">Fin</p>
            <p className="font-mono text-[13px]">{formatDate(sub.contractEndDate)}</p>
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted">Restan</p>
            <p className="font-mono text-[13px]">{remaining} d. hábiles</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ClientPlanTab({ client, sub, remaining, onUpdateContract }: Props) {
  if (!sub) {
    return <p className="text-[13px] text-muted">Sin suscripción activa.</p>;
  }

  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-12 lg:col-span-7">
        <div className="bg-paper border border-rule rounded-lg p-5">
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
                {Number(sub.plan.price) - sub.discount}
              </p>
            </div>
          </div>
          <hr className="border-rule mb-4" />
          <div className="flex flex-wrap gap-1.5 mb-4">
            {sub.plan.meals.map((m) => (
              <span
                key={m}
                className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-olive-100 border border-rule text-ink"
              >
                {MEAL_LABELS[m] ?? m}
              </span>
            ))}
          </div>
          <hr className="border-rule mb-4" />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted">Precio</p>
              <p className="font-mono text-[14px]">{sub.plan.price}</p>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted">Descuento</p>
              <p className="font-mono text-[14px] text-muted">
                {sub.discount > 0 ? sub.discount : '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted">Total</p>
              <p className="font-mono text-[14px] font-bold text-olive-800">
                {Number(sub.plan.price) - sub.discount}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
        <ContractCard sub={sub} remaining={remaining} onUpdateContract={onUpdateContract} />
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
              <p className="font-mono text-[13px] break-words">{client.businessName || '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
