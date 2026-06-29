import type { ReactNode } from 'react';
import { Card } from '@ui/Card';
import { Label } from '@ui/Label';
import type { Plan, NewClientFormValues, RestrictionsState } from '@/features/clients/types';
import { addBusinessDays } from '@/utils/businessDays';
import { formatDate } from '@/utils/format';
import { SEX_LABELS } from '@/features/clients/constants/clientOptions';

interface Props {
  formValues: NewClientFormValues;
  restrictions: RestrictionsState;
  plans: Plan[];
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-faint mb-[3px]">{label}</p>
      <p className="text-[14px] text-ink font-medium">{value}</p>
    </div>
  );
}

export function ClientPreviewCard({ formValues, restrictions, plans }: Props) {
  const selectedPlan = plans.find((p) => p.id === formValues.planId);
  const contractEndDate =
    formValues.startDate && formValues.duration > 0
      ? formatDate(addBusinessDays(formValues.startDate, formValues.duration - 1)) // duration - 1 because startDate counts as day 1
      : '—';
  const total = (selectedPlan?.price ?? 0) - (formValues.discount || 0);
  const fmt = (n: number) => n.toLocaleString('es-BO');
  const sexLabel = SEX_LABELS[formValues.sex] || formValues.sex || '—';
  const alergList = restrictions.restrictions.length
    ? restrictions.restrictions.join(', ')
    : 'Ninguna';
  const condList = restrictions.underlyingDiseases.length
    ? restrictions.underlyingDiseases.join(', ')
    : 'Ninguna';

  const sections: { title: string; rows: { k: string; v: ReactNode }[] }[] = [
    {
      title: 'Identidad y contacto',
      rows: [
        { k: 'Nombre completo', v: formValues.name || '—' },
        { k: 'Sexo', v: sexLabel },
        { k: 'Celular', v: formValues.phoneNumber || '—' },
        {
          k: 'Dirección',
          v: formValues.address ? `${formValues.address}, ${formValues.deliveryZone}` : '—',
        },
      ],
    },
    {
      title: 'Restricciones',
      rows: [
        { k: 'Alergias y gustos', v: alergList },
        { k: 'Enfermedades de base', v: condList },
      ],
    },
    {
      title: 'Plan y contrato',
      rows: [
        { k: 'Plan', v: selectedPlan?.name ?? '—' },
        { k: 'Precio sin descuento', v: selectedPlan ? fmt(selectedPlan.price) : '—' },
        { k: 'Descuento', v: fmt(formValues.discount || 0) },
        {
          k: 'Inicio del contrato',
          v: formValues.startDate ? formatDate(formValues.startDate) : '—',
        },
        { k: 'Fin del contrato', v: contractEndDate },
      ],
    },
  ];

  return (
    <Card padding="0" className="overflow-hidden">
      {sections.map((sec) => (
        <div key={sec.title} className="py-5 px-[26px] border-b border-cream-2">
          <Label variant="section" className="mb-[15px]">
            {sec.title}
          </Label>
          <div className="grid grid-cols-2 gap-x-[22px] gap-y-[14px]">
            {sec.rows.map((row) => (
              <Row key={row.k} label={row.k} value={row.v} />
            ))}
          </div>
        </div>
      ))}
      <div className="py-[18px] px-[26px] flex items-center justify-between bg-olive-50">
        <span className="font-mono text-[11px] tracking-[.08em] uppercase text-muted">
          Total mensual
        </span>
        <span className="font-serif text-[28px] font-semibold text-ink tabular-nums">
          {selectedPlan ? fmt(total) : '—'}
        </span>
      </div>
    </Card>
  );
}
