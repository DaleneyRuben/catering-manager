import { PageHeader } from '@ui/PageHeader';
import { Icon } from '@ui/Icon';
import { useNutritionistQueue } from '@/features/evaluations/hooks/useNutritionistQueue';
import { NutritionistAppointmentCard } from '@/features/evaluations/components/NutritionistAppointmentCard';
import { EvaluationHistoryTable } from '@/features/evaluations/components/EvaluationHistoryTable';
import { deriveAppointmentStatus } from '@/features/evaluations/deriveAppointmentStatus';

export function NutritionistEvaluationsView() {
  const { appointments } = useNutritionistQueue();

  const pendientes = appointments.filter((a) => deriveAppointmentStatus(a) === 'pendiente');
  const historial = appointments.filter((a) => deriveAppointmentStatus(a) !== 'pendiente');
  const nPagados = historial.filter((a) => deriveAppointmentStatus(a) === 'pagado').length;

  const pendSubtitle =
    pendientes.length === 0
      ? 'Nada por resolver'
      : `${pendientes.length} ${pendientes.length === 1 ? 'cita por resolver' : 'citas por resolver'}`;
  const histSubtitle = `${historial.length} ${
    historial.length === 1 ? 'cita resuelta' : 'citas resueltas'
  } · ${nPagados} con pago confirmado`;

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
      <PageHeader label="Evaluaciones · Nutrición" title="Evaluaciones" />

      <div className="flex flex-col gap-9 mt-7">
        <section>
          <div className="mb-4">
            <h2 className="font-serif font-semibold text-[24px] leading-none text-ink">
              Pendientes
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-[.06em] text-faint mt-2">
              {pendSubtitle}
            </p>
          </div>

          {pendientes.length === 0 ? (
            <div className="py-16 px-6 text-center bg-paper border border-rule rounded-[14px] flex flex-col items-center gap-3.5">
              <span className="w-[52px] h-[52px] rounded-[14px] bg-cream-2 text-rule-2 flex items-center justify-center">
                <Icon name="calendar-check" size={26} stroke={1.4} />
              </span>
              <p className="font-serif font-semibold text-[22px] text-ink-2">
                Sin citas pendientes
              </p>
              <p className="text-[13.5px] text-faint max-w-[330px] leading-[1.5]">
                Todas las evaluaciones asignadas ya fueron resueltas. Las nuevas citas aparecerán
                acá.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
              {pendientes.map((appointment) => (
                <NutritionistAppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4">
            <h2 className="font-serif font-semibold text-[24px] leading-none text-ink">
              Historial
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-[.06em] text-faint mt-2">
              {histSubtitle}
            </p>
          </div>

          <EvaluationHistoryTable appointments={historial} />
        </section>
      </div>
    </div>
  );
}
