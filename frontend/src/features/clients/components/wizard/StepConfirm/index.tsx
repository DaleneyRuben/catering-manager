import { Icon } from '@ui/Icon';
import { ToggleGroup } from '@ui/ToggleGroup';
import { WizardSectionCard } from '@ui/WizardSectionCard';
import type { NewClientFormValues, RestrictionsState } from '@/features/clients/types';
import type { Plan } from '@/features/plans/types';
import { ClientPreviewCard } from '@/features/clients/components/wizard/StepConfirm/ClientPreviewCard';

const PAID_OPTIONS = ['Sí', 'No'] as const;

interface Props {
  formValues: NewClientFormValues;
  restrictions: RestrictionsState;
  plans: Plan[];
  submitError: string;
  origen?: 'Directo' | 'Cita';
  paid?: boolean | null;
  onPaidChange?: (paid: boolean) => void;
}

export function StepConfirm({
  formValues,
  restrictions,
  plans,
  submitError,
  origen = 'Directo',
  paid = null,
  onPaidChange,
}: Props) {
  const paidToggleValue = paid === null ? '' : PAID_OPTIONS[paid ? 0 : 1];

  return (
    <div>
      {origen === 'Cita' && (
        <WizardSectionCard
          icon="dollar-sign"
          iconBg="bg-nutritionist-bg"
          iconColor="text-nutritionist"
          title="¿Pagó el servicio?"
          description="Elige una opción para poder confirmar el alta."
          className="mb-5"
        >
          <ToggleGroup
            options={PAID_OPTIONS}
            value={paidToggleValue}
            onChange={(v) => onPaidChange?.(v === 'Sí')}
            selectedClassName="bg-olive-100 text-olive-700 border-olive-200"
          />
        </WizardSectionCard>
      )}

      <div className="bg-olive-100 border border-olive-200 rounded-[14px] py-[20px] px-[24px] mb-5 flex items-center gap-[14px]">
        <span className="w-[38px] h-[38px] rounded-full bg-olive-700 text-olive-50 flex items-center justify-center shrink-0">
          <Icon name="check" size={20} stroke={2.2} />
        </span>
        <div>
          <p className="font-serif text-[21px] font-semibold text-ink leading-[1.1]">
            Todo listo para crear
          </p>
          <p className="text-[13px] text-success-text mt-[3px]">
            Revisa el resumen y confirma el alta del cliente.
          </p>
        </div>
      </div>

      <ClientPreviewCard formValues={formValues} restrictions={restrictions} plans={plans} />

      {submitError && (
        <p className="mt-4 text-[13px] text-warn bg-warn-bg px-3 py-2 rounded-md">{submitError}</p>
      )}
    </div>
  );
}
