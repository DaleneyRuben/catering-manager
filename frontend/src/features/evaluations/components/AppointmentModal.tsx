import { useState } from 'react';
import { startOfToday } from 'date-fns';
import { Icon } from '@ui/Icon';
import { IconButton } from '@ui/IconButton';
import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import { Field, inputCls } from '@ui/Field';
import { DatePickerInput } from '@ui/DatePickerInput';
import { TimePickerInput } from '@ui/TimePickerInput';
import { MODAL_CANCEL_STYLE, MODAL_CONFIRM_STYLE } from '@ui/modalButtonStyles';
import type { Appointment, AppointmentDraft } from '@/features/evaluations/types';

const EMPTY_DRAFT: AppointmentDraft = { name: '', phone: '', date: '', time: '' };

type CreateProps = {
  mode: 'create';
  isSaving: boolean;
  onSave: (draft: AppointmentDraft) => Promise<void>;
  onClose: () => void;
};

type EditProps = {
  mode: 'edit';
  appointment: Appointment;
  isSaving: boolean;
  onSave: (draft: AppointmentDraft) => Promise<void>;
  onClose: () => void;
};

type Props = CreateProps | EditProps;

export function AppointmentModal(props: Props) {
  const { mode, onClose, isSaving, onSave } = props;
  const appointment = mode === 'edit' ? (props as EditProps).appointment : null;

  const [draft, setDraft] = useState<AppointmentDraft>(
    appointment
      ? {
          name: appointment.name,
          phone: appointment.phone,
          date: appointment.date,
          time: appointment.time,
        }
      : EMPTY_DRAFT,
  );

  const handleSubmit = async () => {
    await onSave(draft);
    onClose();
  };

  return (
    <Modal onClose={onClose} className="w-[min(420px,92vw)] max-h-[92vh] overflow-auto">
      <div className="flex items-center gap-3 px-[28px] py-[22px] border-b border-hairline">
        <span className="w-[34px] h-[34px] rounded-[9px] bg-olive-100 text-olive-700 flex items-center justify-center shrink-0">
          <Icon name="calendar-check" size={17} stroke={1.8} />
        </span>
        <h3 className="flex-1 font-serif font-semibold text-[23px] leading-none text-ink">
          {mode === 'create' ? 'Nueva cita' : 'Editar cita'}
        </h3>
        <IconButton
          icon="x"
          label="Cerrar"
          onClick={onClose}
          size={20}
          stroke={1.8}
          className="p-1 text-faint hover:text-ink-2"
        />
      </div>

      <div className="px-[28px] py-[22px] flex flex-col gap-4">
        <Field label="Nombre" htmlFor="am-name" required>
          <input
            id="am-name"
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className={inputCls()}
          />
        </Field>

        <Field label="Teléfono" htmlFor="am-phone" required>
          <input
            id="am-phone"
            type="tel"
            value={draft.phone}
            onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            className={inputCls()}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha" htmlFor="am-date" required>
            <DatePickerInput
              id="am-date"
              value={draft.date}
              onChange={(date) => setDraft({ ...draft, date })}
              disabled={{ before: startOfToday() }}
            />
          </Field>

          <Field label="Hora" htmlFor="am-time" required>
            <TimePickerInput
              id="am-time"
              value={draft.time}
              onChange={(time) => setDraft({ ...draft, time })}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2.5 mt-1">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
            style={MODAL_CANCEL_STYLE}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isSaving}
            leftIcon="check"
            style={MODAL_CONFIRM_STYLE}
          >
            {mode === 'create' ? 'Crear cita' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
