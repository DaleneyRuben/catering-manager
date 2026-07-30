import { Icon } from '@ui/Icon';
import { Pagination } from '@ui/Pagination';
import { formatDate } from '@/utils/format';
import { initials } from '@/utils/string';
import { deriveAppointmentStatus } from '@/features/evaluations/deriveAppointmentStatus';
import { STATUS_CLASSES, STATUS_LABELS } from '@/features/evaluations/constants/appointmentStatus';
import type { Appointment } from '@/features/evaluations/types';

interface Props {
  appointments: Appointment[];
  total: number;
  page: number;
  limit: number;
  onChangePage: (page: number) => void;
  onChangeLimit: (limit: number) => void;
}

export function EvaluationHistoryTable({
  appointments,
  total,
  page,
  limit,
  onChangePage,
  onChangeLimit,
}: Props) {
  if (appointments.length === 0) {
    return (
      <div className="py-12 px-6 text-center bg-paper border border-rule rounded-[13px] flex flex-col items-center gap-3">
        <span className="w-12 h-12 rounded-[13px] bg-cream-2 text-rule-2 flex items-center justify-center">
          <Icon name="clock" size={24} stroke={1.4} />
        </span>
        <p className="font-serif font-semibold text-[21px] text-ink-2">Sin registros</p>
        <p className="text-[13.5px] text-faint max-w-[330px] leading-[1.5]">
          Las citas que resuelvas aparecerán acá con su estado de pago.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-paper border border-rule rounded-[13px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead>
            <tr className="bg-olive-50 border-b border-rule text-[10px] font-mono uppercase tracking-[.13em] text-muted">
              <th className="text-left px-5 py-[13px] font-semibold">Nombre</th>
              <th className="text-left px-5 py-[13px] font-semibold">Teléfono</th>
              <th className="text-left px-5 py-[13px] font-semibold">Fecha</th>
              <th className="text-left px-5 py-[13px] font-semibold">Hora</th>
              <th className="text-left px-5 py-[13px] font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => {
              const status = deriveAppointmentStatus(appointment);
              return (
                <tr
                  key={appointment.id}
                  className="border-b border-cream-2 last:border-0 hover:bg-row-hover transition-colors"
                >
                  <td className="px-5 py-[12px]">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-olive-100 border border-olive-200 text-olive-700 flex items-center justify-center font-mono text-[11px] font-semibold shrink-0">
                        {initials(appointment.name)}
                      </span>
                      <span className="font-semibold text-ink">{appointment.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-[12px] font-mono text-[12.5px] text-ink-2 tabular-nums">
                    {appointment.phone}
                  </td>
                  <td className="px-5 py-[12px] font-mono text-[12.5px] text-ink-2 tabular-nums whitespace-nowrap">
                    {formatDate(appointment.date)}
                  </td>
                  <td className="px-5 py-[12px] font-mono text-[12.5px] text-faint tabular-nums">
                    {appointment.time}
                  </td>
                  <td className="px-5 py-[12px]">
                    <span
                      className={`inline-flex items-center gap-[7px] text-[11.5px] font-semibold px-[11px] py-[4px] rounded-full whitespace-nowrap ${STATUS_CLASSES[status]}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                      {STATUS_LABELS[status]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        total={total}
        limit={limit}
        onChange={onChangePage}
        onLimitChange={onChangeLimit}
      />
    </div>
  );
}
