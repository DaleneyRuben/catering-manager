import { PageHeader } from '@ui/PageHeader';
import { Icon } from '@ui/Icon';
import { useNutritionistQueue } from '@/features/evaluations/hooks/useNutritionistQueue';
import { NutritionistAppointmentCard } from '@/features/evaluations/components/NutritionistAppointmentCard';

export function NutritionistEvaluationsView() {
  const { appointments } = useNutritionistQueue();

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
      <PageHeader label="Evaluaciones · Nutrición" title="Evaluaciones" />

      {appointments.length === 0 ? (
        <div className="py-16 px-6 text-center bg-paper border border-rule rounded-[14px] flex flex-col items-center gap-3.5">
          <span className="w-[52px] h-[52px] rounded-[14px] bg-cream-2 text-rule-2 flex items-center justify-center">
            <Icon name="calendar-check" size={26} stroke={1.4} />
          </span>
          <p className="font-serif font-semibold text-[22px] text-ink-2">Sin citas asignadas</p>
          <p className="text-[13.5px] text-faint max-w-[320px] leading-[1.5]">
            Cuando se agenden evaluaciones aparecerán aquí, en orden cronológico.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
          {appointments.map((appointment) => (
            <NutritionistAppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      )}
    </div>
  );
}
