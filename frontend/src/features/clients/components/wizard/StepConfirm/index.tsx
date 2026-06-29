import type { Plan , NewClientFormValues, RestrictionsState } from '@/features/clients/types';
import { Icon } from '@/components/ui/Icon';
import { ClientPreviewCard } from '@/features/clients/components/wizard/StepConfirm/ClientPreviewCard';

interface Props {
  formValues: NewClientFormValues;
  restrictions: RestrictionsState;
  plans: Plan[];
  submitError: string;
}

export function StepConfirm({ formValues, restrictions, plans, submitError }: Props) {
  return (
    <div>
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
