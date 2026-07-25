import { useState } from 'react';
import { PageHeader } from '@ui/PageHeader';
import { Icon } from '@ui/Icon';
import { Button } from '@ui/Button';
import { ConfirmModal } from '@ui/ConfirmModal';
import { useAppointments } from '@/features/evaluations/hooks/useAppointments';
import { usePendingPayment } from '@/features/evaluations/hooks/usePendingPayment';
import { AppointmentModal } from '@/features/evaluations/components/AppointmentModal';
import { CitasPendientesTable } from '@/features/evaluations/components/CitasPendientesTable';
import { PendingPaymentCard } from '@/features/evaluations/components/PendingPaymentCard';
import type { Appointment } from '@/features/evaluations/types';
import type { Client } from '@/features/clients/types';

type ModalState =
  | { type: 'appointment'; mode: 'create' }
  | { type: 'appointment'; mode: 'edit'; appointment: Appointment }
  | { type: 'cancel-appointment'; appointment: Appointment }
  | { type: 'mark-paid'; client: Client }
  | { type: 'delete-client'; client: Client }
  | null;

export function AdminEvaluationsView() {
  const { appointments, isSaving, create, update, cancel } = useAppointments();
  const { clients, markPaid, remove } = usePendingPayment();
  const [modal, setModal] = useState<ModalState>(null);
  const closeModal = () => setModal(null);

  const citasSubtitle =
    appointments.length === 1 ? '1 cita por atender' : `${appointments.length} citas por atender`;
  const pagosSubtitle =
    clients.length === 1
      ? '1 cliente esperando confirmación'
      : `${clients.length} clientes esperando confirmación`;

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
      <PageHeader
        label="Gestión · Evaluaciones"
        title="Evaluaciones"
        action={
          <Button onClick={() => setModal({ type: 'appointment', mode: 'create' })} leftIcon="plus">
            Nueva cita
          </Button>
        }
      />

      <div className="flex flex-col gap-[34px] mt-7">
        <section>
          <div className="mb-4">
            <h2 className="font-serif font-semibold text-[22px] leading-none text-ink">
              Citas pendientes
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-[.06em] text-faint mt-2">
              {citasSubtitle}
            </p>
          </div>
          <CitasPendientesTable
            appointments={appointments}
            onEdit={(appointment) => setModal({ type: 'appointment', mode: 'edit', appointment })}
            onCancel={(appointment) => setModal({ type: 'cancel-appointment', appointment })}
            onNewCita={() => setModal({ type: 'appointment', mode: 'create' })}
          />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="font-serif font-semibold text-[22px] leading-none text-ink">
              Pendientes de pago
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-[.06em] text-faint mt-2">
              {pagosSubtitle}
            </p>
          </div>
          {clients.length === 0 ? (
            <div className="py-12 px-6 text-center bg-paper border border-rule rounded-[13px] flex flex-col items-center gap-3">
              <span className="w-12 h-12 rounded-[13px] bg-cream-2 text-rule-2 flex items-center justify-center">
                <Icon name="plan" size={24} stroke={1.4} />
              </span>
              <p className="font-serif font-semibold text-[21px] text-ink-2">
                Sin clientes pendientes de pago
              </p>
              <p className="text-[13.5px] text-faint max-w-[340px] leading-[1.5]">
                Los clientes convertidos aparecerán acá hasta que confirmes su pago.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
              {clients.map((client) => (
                <PendingPaymentCard
                  key={client.id}
                  client={client}
                  onMarkPaid={(c) => setModal({ type: 'mark-paid', client: c })}
                  onDelete={(c) => setModal({ type: 'delete-client', client: c })}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {modal?.type === 'appointment' && modal.mode === 'create' && (
        <AppointmentModal mode="create" isSaving={isSaving} onSave={create} onClose={closeModal} />
      )}
      {modal?.type === 'appointment' && modal.mode === 'edit' && (
        <AppointmentModal
          mode="edit"
          appointment={modal.appointment}
          isSaving={isSaving}
          onSave={(draft) => update(modal.appointment.id, draft)}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'cancel-appointment' && (
        <ConfirmModal
          title="Cancelar cita"
          message={
            <>
              ¿Seguro que quieres cancelar la cita de{' '}
              <span className="font-semibold">{modal.appointment.name}</span>? Esta acción no se
              puede deshacer.
            </>
          }
          confirmLabel="Cancelar cita"
          icon="trash"
          onClose={closeModal}
          onConfirm={() => cancel(modal.appointment.id)}
        />
      )}
      {modal?.type === 'mark-paid' && (
        <ConfirmModal
          title="Marcar como pagado"
          message={
            <>
              ¿Confirmas que <span className="font-semibold">{modal.client.name}</span> pagó su
              suscripción? Pasará a aparecer en la tabla de Clientes.
            </>
          }
          confirmLabel="Confirmar pago"
          icon="check"
          variant="primary"
          onClose={closeModal}
          onConfirm={() => markPaid(modal.client.id)}
        />
      )}
      {modal?.type === 'delete-client' && (
        <ConfirmModal
          title="Eliminar cliente pendiente"
          message={
            <>
              ¿Seguro que quieres eliminar a{' '}
              <span className="font-semibold">{modal.client.name}</span>? Se descartará la
              conversión y no aparecerá en Clientes. Esta acción no se puede deshacer.
            </>
          }
          confirmLabel="Eliminar"
          icon="trash"
          onClose={closeModal}
          onConfirm={() => remove(modal.client.id)}
        />
      )}
    </div>
  );
}
