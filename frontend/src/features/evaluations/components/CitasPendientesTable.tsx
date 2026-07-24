import { Icon } from '@ui/Icon';
import { IconButton } from '@ui/IconButton';
import { Button } from '@ui/Button';
import { formatDate } from '@/utils/format';
import { initials } from '@/utils/string';
import type { Appointment } from '@/features/evaluations/types';

interface Props {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
  onNewCita: () => void;
}

export function CitasPendientesTable({ appointments, onEdit, onCancel, onNewCita }: Props) {
  if (appointments.length === 0) {
    return (
      <div className="py-16 px-6 text-center bg-paper border border-rule rounded-[14px] flex flex-col items-center gap-3.5">
        <span className="w-[52px] h-[52px] rounded-[14px] bg-cream-2 text-rule-2 flex items-center justify-center">
          <Icon name="calendar-check" size={26} stroke={1.4} />
        </span>
        <p className="font-serif font-semibold text-[22px] text-ink-2">Sin citas pendientes</p>
        <Button onClick={onNewCita} leftIcon="plus" size="sm" className="mt-1">
          Nueva cita
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-paper border border-rule rounded-[13px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-olive-50 border-b border-rule text-[10px] font-mono uppercase tracking-[.13em] text-muted">
              <th className="text-left px-5 py-[13px] font-semibold">Nombre</th>
              <th className="text-left px-5 py-[13px] font-semibold">Teléfono</th>
              <th className="text-left px-5 py-[13px] font-semibold">Fecha</th>
              <th className="text-left px-5 py-[13px] font-semibold">Hora</th>
              <th className="text-right px-5 py-[13px] font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr
                key={appointment.id}
                className="border-b border-cream-2 last:border-0 hover:bg-row-hover transition-colors"
              >
                <td className="px-5 py-[13px]">
                  <div className="flex items-center gap-3">
                    <span className="w-[34px] h-[34px] rounded-full bg-nutritionist-bg text-nutritionist flex items-center justify-center font-mono text-[11.5px] font-semibold shrink-0">
                      {initials(appointment.name)}
                    </span>
                    <span className="font-semibold text-ink">{appointment.name}</span>
                  </div>
                </td>
                <td className="px-5 py-[13px] text-ink-2">{appointment.phone}</td>
                <td className="px-5 py-[13px] text-ink-2">{formatDate(appointment.date)}</td>
                <td className="px-5 py-[13px] text-ink-2">{appointment.time}</td>
                <td className="px-5 py-[13px]">
                  <div className="flex justify-end items-center gap-1">
                    <IconButton
                      icon="pencil"
                      label="Editar cita"
                      onClick={() => onEdit(appointment)}
                      size={16}
                      stroke={1.7}
                      className="w-[34px] h-[34px] rounded-lg text-plan-edit hover:bg-olive-100 hover:text-olive-700"
                    />
                    <IconButton
                      icon="trash"
                      label="Cancelar cita"
                      onClick={() => onCancel(appointment)}
                      size={16}
                      stroke={1.7}
                      className="w-[34px] h-[34px] rounded-lg text-plan-delete hover:bg-danger-bg hover:text-danger"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
