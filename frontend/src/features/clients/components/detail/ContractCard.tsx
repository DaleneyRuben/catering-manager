import { useState } from 'react';
import { startOfToday } from 'date-fns';
import { Button } from '@ui/Button';
import { Card } from '@ui/Card';
import { DatePickerInput } from '@ui/DatePickerInput';
import { IconButton } from '@ui/IconButton';
import { Label } from '@ui/Label';
import { addBusinessDays } from '@/utils/businessDays';
import { formatDate } from '@/utils/format';
import type { Subscription } from '@/features/clients/types';

export interface ContractDraft {
  contractDate: string;
  startDate: string;
  duration: number;
}

interface Props {
  sub: Subscription;
  remaining: number;
  onUpdateContract: (draft: ContractDraft) => Promise<void>;
}

export function ContractCard({ sub, remaining, onUpdateContract }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contractDate, setContractDate] = useState(sub.contractDate);
  const [startDate, setStartDate] = useState(sub.startDate ?? '');
  const [durationStr, setDurationStr] = useState(String(sub.duration));

  const parsedDuration = parseInt(durationStr, 10);
  const validDuration = !Number.isNaN(parsedDuration) && parsedDuration > 0 ? parsedDuration : 0;
  const previewEndDate =
    startDate && validDuration > 0
      ? addBusinessDays(startDate, validDuration - 1 + sub.suspendedDates.length) // duration - 1 because startDate counts as day 1; add suspensions
      : sub.contractEndDate;

  const handleSave = async () => {
    if (!validDuration) return;
    setSaving(true);
    try {
      await onUpdateContract({ contractDate, startDate, duration: validDuration });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setContractDate(sub.contractDate);
    setStartDate(sub.startDate ?? '');
    setDurationStr(String(sub.duration));
    setEditing(false);
  };

  const delivered = Math.max(0, sub.duration - remaining);
  const progressPct = sub.duration > 0 ? Math.min(100, (delivered / sub.duration) * 100) : 0;

  return (
    <Card>
      <div className="flex items-center mb-3">
        <Label variant="section">Contrato</Label>
        {!editing && (
          <IconButton
            icon="pencil"
            label="Editar"
            onClick={() => setEditing(true)}
            size={15}
            stroke={1.7}
            className="ml-auto text-olive-700 hover:opacity-70 transition-opacity p-[3px]"
          />
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label variant="field" className="mb-1">
                Firma
              </Label>
              <DatePickerInput
                value={contractDate}
                onChange={setContractDate}
                endMonth={startOfToday()}
              />
            </div>
            <div>
              <Label variant="field" className="mb-1">
                Inicio
              </Label>
              <DatePickerInput value={startDate} onChange={setStartDate} />
            </div>
            <div>
              <Label variant="field" className="mb-1">
                Duración (días hábiles)
              </Label>
              <input
                type="text"
                inputMode="numeric"
                value={durationStr}
                onChange={(e) => setDurationStr(e.target.value.replace(/\D/g, ''))}
                className="w-full px-2.5 py-1.5 text-[13px] font-mono border border-rule rounded-md bg-cream focus:outline-none focus:border-olive-600"
              />
            </div>
            <div>
              <Label variant="field" className="mb-1">
                Fin
              </Label>
              <p className="font-mono text-[13px] py-1.5">{formatDate(previewEndDate)}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            <Button variant="secondary" size="sm" onClick={handleCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} loading={saving} leftIcon="check">
              Guardar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="flex items-end justify-between gap-3 mb-[15px]">
            <div>
              <Label variant="field" className="mb-1">
                Días restantes
              </Label>
              <div className="flex items-baseline gap-[7px]">
                <span className="font-serif font-semibold text-[40px] leading-[.85] text-olive-700">
                  {remaining}
                </span>
                <span className="font-mono text-[12px] text-muted">días hábiles</span>
              </div>
            </div>
            <div className="text-right font-mono text-[10.5px] text-faint leading-[1.5]">
              <span>
                {delivered} de {sub.duration}
              </span>
              <br />
              <span>entregados</span>
            </div>
          </div>

          <div className="relative h-2 mb-[9px]">
            <div className="absolute inset-0 rounded-full bg-progress-track" />
            <div
              data-testid="contract-progress-fill"
              className="absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r from-olive-300 to-olive-700"
              style={{ width: `${progressPct}%` }}
            />
            <div
              className="absolute top-1/2 w-[14px] h-[14px] rounded-full bg-paper"
              style={{
                left: `${progressPct}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: 'inset 0 0 0 3px var(--color-olive-700)',
              }}
            />
          </div>
          <div className="flex justify-between font-mono text-[10.5px] text-ink mb-4">
            <span>
              {formatDate(sub.startDate)} <span className="text-faint">· inicio</span>
            </span>
            <span>
              <span className="text-faint">fin ·</span> {formatDate(sub.contractEndDate)}
            </span>
          </div>

          <hr className="border-cream-2 mb-4" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label variant="field">Firma</Label>
              <p className="font-mono text-[13px]">{formatDate(sub.contractDate)}</p>
            </div>
            <div>
              <Label variant="field">Duración</Label>
              <p className="font-mono text-[13px]">{sub.duration} días hábiles</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
