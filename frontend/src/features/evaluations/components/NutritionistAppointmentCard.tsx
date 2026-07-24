import { Link } from 'react-router-dom';
import { Icon } from '@ui/Icon';
import { formatDate } from '@/utils/format';
import { deriveAppointmentStatus } from '@/features/evaluations/deriveAppointmentStatus';
import { STATUS_CLASSES, STATUS_LABELS } from '@/features/evaluations/constants/appointmentStatus';
import type { Appointment } from '@/features/evaluations/types';

interface Props {
  appointment: Appointment;
}

const CARD_BASE = 'bg-paper border border-rule rounded-[14px] p-5 transition-all';

export function NutritionistAppointmentCard({ appointment }: Props) {
  const status = deriveAppointmentStatus(appointment);
  const meta = `${appointment.phone} · ${formatDate(appointment.date)} · ${appointment.time}`;

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-serif font-semibold text-[22px] leading-[1.1] text-ink truncate">
          {appointment.name}
        </h3>
        <p className="font-mono text-[10.5px] text-faint mt-2">{meta}</p>
      </div>
      <span
        className={`font-mono text-[10px] font-semibold uppercase tracking-[.08em] px-[10px] py-[4px] rounded-full whitespace-nowrap shrink-0 ${STATUS_CLASSES[status]}`}
      >
        {STATUS_LABELS[status]}
      </span>
    </div>
  );

  if (status === 'pendiente') {
    return (
      <Link
        to={`/clientes/nuevo?appointmentId=${appointment.id}`}
        className={`${CARD_BASE} block cursor-pointer hover:border-olive-200 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5`}
      >
        {header}
        <div className="flex items-center gap-[7px] mt-[18px] text-[12.5px] font-semibold text-ok">
          <Icon name="stethoscope" size={15} stroke={1.9} />
          Convertir a cliente
          <Icon name="arrow-right" size={15} stroke={2} className="-ml-0.5" />
        </div>
      </Link>
    );
  }

  const convertedLabel =
    status === 'pagado' ? 'Convertido · pago confirmado' : 'Convertido · pago pendiente';

  return (
    <div className={`${CARD_BASE} cursor-default`}>
      {header}
      <div className="flex items-center gap-[7px] mt-[18px] font-mono text-[11px] text-faint">
        <Icon name="check" size={14} stroke={1.7} />
        {convertedLabel}
      </div>
    </div>
  );
}
