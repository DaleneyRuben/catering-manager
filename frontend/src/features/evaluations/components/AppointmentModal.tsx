import { useState } from 'react';
import { startOfToday } from 'date-fns';
import { Icon } from '@ui/Icon';
import { IconButton } from '@ui/IconButton';
import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import { Field, inputCls } from '@ui/Field';
import { ToggleGroup } from '@ui/ToggleGroup';
import { DatePickerInput } from '@ui/DatePickerInput';
import { TimePickerInput } from '@ui/TimePickerInput';
import { MODAL_CANCEL_STYLE, MODAL_CONFIRM_STYLE } from '@ui/modalButtonStyles';
import { useDebounce } from '@/hooks/useDebounce';
import { useClientSearch } from '@/features/evaluations/hooks/useClientSearch';
import type {
  Appointment,
  AppointmentDraft,
  ClientSearchResult,
} from '@/features/evaluations/types';

const EMPTY_DRAFT: AppointmentDraft = { name: '', phone: '', date: '', time: '' };

const CLIENT_MODES = ['Cliente nuevo', 'Cliente existente'] as const;
type ClientMode = (typeof CLIENT_MODES)[number];

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

  const [clientMode, setClientMode] = useState<ClientMode>('Cliente nuevo');
  const [selectedClient, setSelectedClient] = useState<ClientSearchResult | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const debouncedPhone = useDebounce(draft.phone ?? '');

  const isExistingClientMode = mode === 'create' && clientMode === 'Cliente existente';
  const isNewClientMode = mode === 'create' && clientMode === 'Cliente nuevo';

  let activeQuery = '';
  if (isExistingClientMode) activeQuery = debouncedSearch;
  else if (isNewClientMode) activeQuery = debouncedPhone;
  const { results } = useClientSearch(activeQuery);

  const phoneMatchesExistingClient =
    isNewClientMode &&
    !!draft.phone &&
    results.some((client) => client.phoneNumber === draft.phone);

  const handleClientModeChange = (value: string) => {
    setClientMode(value as ClientMode);
    setSelectedClient(null);
    setSearch('');
  };

  const handleSelectClient = (client: ClientSearchResult) => {
    setSelectedClient(client);
    setSearch('');
  };

  const handleSubmit = async () => {
    if (isExistingClientMode && selectedClient) {
      await onSave({ clientId: selectedClient.id, date: draft.date, time: draft.time });
    } else {
      await onSave({ name: draft.name, phone: draft.phone, date: draft.date, time: draft.time });
    }
    onClose();
  };

  let clientFieldsSection: React.ReactNode;
  if (isExistingClientMode && selectedClient) {
    clientFieldsSection = (
      <div className="flex flex-col gap-1 px-3 py-2.5 bg-paper border border-rule rounded-md">
        <span className="font-mono text-[13px] text-ink">{selectedClient.name}</span>
        <span className="font-mono text-[12px] text-muted">{selectedClient.phoneNumber}</span>
      </div>
    );
  } else if (isExistingClientMode) {
    clientFieldsSection = (
      <>
        <div className="relative">
          <Icon
            name="search"
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls()} pl-[35px]`}
          />
        </div>

        {search && (
          <div className="border border-rule rounded-md overflow-hidden bg-white">
            {results.length > 0 ? (
              <ul>
                {results.map((client) => (
                  <li key={client.id}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSelectClient(client)}
                      className="w-full justify-start gap-2 border-0 border-b border-rule rounded-none font-mono font-normal last:border-b-0"
                    >
                      <span>{client.name}</span>
                      <span className="text-muted">{client.phoneNumber}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3 py-2.5 font-mono text-[12px] text-muted">Sin resultados.</p>
            )}
          </div>
        )}
      </>
    );
  } else {
    clientFieldsSection = (
      <>
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

        {phoneMatchesExistingClient && (
          <p className="text-[12px] text-warn -mt-2">
            Ya existe un cliente con este número — ¿quisiste buscarlo en su lugar?
          </p>
        )}
      </>
    );
  }

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
        {mode === 'create' && (
          <ToggleGroup
            options={CLIENT_MODES}
            value={clientMode}
            onChange={handleClientModeChange}
            selectedClassName="bg-olive-100 text-olive-700 border-olive-200"
          />
        )}

        {clientFieldsSection}

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
            disabled={isExistingClientMode && !selectedClient}
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
