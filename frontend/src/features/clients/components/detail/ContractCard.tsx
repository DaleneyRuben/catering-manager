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
      ? addBusinessDays(startDate, validDuration - 1) // duration - 1 because startDate counts as day 1
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label variant="field">Firma</Label>
            <p className="font-mono text-[13px]">{formatDate(sub.contractDate)}</p>
          </div>
          <div>
            <Label variant="field">Inicio</Label>
            <p className="font-mono text-[13px]">{formatDate(sub.startDate)}</p>
          </div>
          <div>
            <Label variant="field">Fin</Label>
            <p className="font-mono text-[13px]">{formatDate(sub.contractEndDate)}</p>
          </div>
          <div>
            <Label variant="field">Restan</Label>
            <p className="font-mono text-[13px] font-semibold text-olive-700">
              {remaining} d. hábiles
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
