import type { Plan } from '../../../types/client';
import type { NewClientFormValues, RestrictionsState } from '../types';
import { ClientPreviewCard } from './ClientPreviewCard';

interface Props {
  formValues: NewClientFormValues;
  restrictions: RestrictionsState;
  plans: Plan[];
  submitError: string;
}

export function StepConfirm({ formValues, restrictions, plans, submitError }: Props) {
  return (
    <div>
      <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-4">
        Vista previa
      </p>

      <ClientPreviewCard formValues={formValues} restrictions={restrictions} plans={plans} />

      {submitError && (
        <p className="mt-4 text-[13px] text-warn bg-warn-bg px-3 py-2 rounded-md">{submitError}</p>
      )}
    </div>
  );
}
