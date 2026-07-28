import { useState } from 'react';
import { isWeekend, parseISO, startOfTomorrow } from 'date-fns';
import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import { Field } from '@ui/Field';
import { DatePickerInput } from '@ui/DatePickerInput';
import { MODAL_CANCEL_STYLE, MODAL_CONFIRM_STYLE } from '@ui/modalButtonStyles';

interface Props {
  clientName: string;
  planName: string;
  duration: number;
  onClose: () => void;
  onAssign: (startDate: string) => Promise<void>;
}

export function AssignStartDateModal({ clientName, planName, duration, onClose, onAssign }: Props) {
  const [startDate, setStartDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAssign = async () => {
    if (isWeekend(parseISO(startDate))) {
      setError('El inicio debe ser un día hábil (lunes a viernes)');
      return;
    }
    setIsSaving(true);
    try {
      await onAssign(startDate);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} className="w-[min(440px,92vw)]">
      <div className="px-[28px] py-[26px]">
        <h3 className="font-serif text-[24px] font-semibold text-ink mb-2.5">
          Asignar fecha de inicio
        </h3>
        <p className="text-[13.5px] leading-[1.55] text-ink-2 mb-3.5">
          La renovación de <span className="font-semibold">{clientName}</span> empieza el día que
          elijas y el plan se reanuda automáticamente.
        </p>
        <div className="bg-empty-bg border border-hairline rounded-[10px] px-3.5 py-3 mb-4">
          <p className="font-mono text-[11px] text-muted">
            {planName} · {duration} días hábiles
          </p>
        </div>

        <Field label="Fecha de inicio" htmlFor="assignStartDate" error={error ?? undefined}>
          <DatePickerInput
            id="assignStartDate"
            value={startDate}
            onChange={(value) => {
              setStartDate(value);
              setError(null);
            }}
            hasError={Boolean(error)}
            disabled={{ before: startOfTomorrow() }}
          />
        </Field>

        <div className="flex justify-end gap-2.5 mt-[22px]">
          <Button variant="ghost" onClick={onClose} style={MODAL_CANCEL_STYLE}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleAssign}
            disabled={!startDate || isSaving}
            loading={isSaving}
            style={MODAL_CONFIRM_STYLE}
          >
            Asignar fecha
          </Button>
        </div>
      </div>
    </Modal>
  );
}
