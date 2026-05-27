import { differenceInYears, parseISO } from 'date-fns';
import type { Plan } from '../../../types/client';
import { addBusinessDays } from '../../../utils/businessDays';
import type { NewClientFormValues, RestrictionsState } from '../types';

function formatSex(sex: string): string {
  if (sex === 'female') return 'F';
  if (sex === 'male') return 'M';
  return 'X';
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0] ?? '')
    .join('')
    .toUpperCase();
}

interface Props {
  formValues: NewClientFormValues;
  restrictions: RestrictionsState;
  plans: Plan[];
}

export function ClientPreviewCard({ formValues, restrictions, plans }: Props) {
  const selectedPlan = plans.find((p) => p.id === formValues.planId);
  const contractEndDate = formValues.startDate ? addBusinessDays(formValues.startDate, 20) : '—';
  const total = (selectedPlan?.price ?? 0) - (formValues.discount || 0);
  const age = formValues.dateOfBirth
    ? differenceInYears(new Date(), parseISO(formValues.dateOfBirth))
    : null;

  return (
    <div className="bg-cream-2 p-5 rounded-lg border border-rule space-y-3">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-olive-700 text-olive-100 flex items-center justify-center font-serif text-[22px] font-semibold shrink-0">
          {formValues.name ? initials(formValues.name) : '—'}
        </div>
        <div className="min-w-0">
          <div className="font-serif text-[24px] leading-tight text-ink">
            {formValues.name || '— Sin nombre —'}
          </div>
          <div className="font-mono text-[11px] text-muted mt-1">
            {age !== null ? `${age} años · ` : ''}
            {formatSex(formValues.sex)} · {formValues.zone} · entrega: {formValues.delivery}
          </div>
          {formValues.phoneNumber && (
            <div className="font-mono text-[11px] text-muted">{formValues.phoneNumber}</div>
          )}
          {formValues.address && (
            <div className="font-mono text-[11px] text-muted">{formValues.address}</div>
          )}
        </div>
        {selectedPlan && (
          <span className="ml-auto shrink-0 px-2.5 py-1 bg-olive-800 text-white text-[11px] font-mono rounded-full">
            {selectedPlan.name}
          </span>
        )}
      </div>

      <div className="bg-paper rounded-md border border-rule p-4">
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted">Plan</p>
            <p className="font-serif text-[20px]">{selectedPlan?.name ?? '—'}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted">
              Total mensual
            </p>
            <p className="font-serif text-[28px] leading-none text-olive-800">
              ${selectedPlan ? total : '—'}
            </p>
          </div>
        </div>

        <div className="border-t border-rule my-3" />

        <div className="grid grid-cols-3 gap-3 text-[13px]">
          <div>
            <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-0.5">
              Precio
            </p>
            <p className="font-mono">{selectedPlan ? `$${selectedPlan.price}` : '—'}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-0.5">
              Descuento
            </p>
            <p className="font-mono">{formValues.discount ? `− $${formValues.discount}` : '—'}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-0.5">
              Total
            </p>
            <p className="font-mono font-bold text-olive-800">{selectedPlan ? `$${total}` : '—'}</p>
          </div>
        </div>

        <div className="border-t border-rule my-3" />

        <div className="grid grid-cols-2 gap-3 text-[13px]">
          <div>
            <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-0.5">
              Inicio
            </p>
            <p className="font-mono">{formValues.startDate || '—'}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-0.5">
              Fin de contrato
            </p>
            <p className="font-mono">{contractEndDate}</p>
          </div>
        </div>

        {(formValues.nit || formValues.businessName) && (
          <>
            <div className="border-t border-rule my-3" />
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div>
                <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-0.5">
                  NIT
                </p>
                <p className="font-mono">{formValues.nit || '—'}</p>
              </div>
              <div>
                <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-0.5">
                  Razón social
                </p>
                <p className="font-mono">{formValues.businessName || '—'}</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-paper rounded-md border border-rule p-4">
        <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-2">
          Restricciones
        </p>
        {restrictions.restrictions.length === 0 ? (
          <p className="font-mono text-[12px] text-muted">Ninguna registrada.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {restrictions.restrictions.map((r) => (
              <span
                key={r}
                className="px-2.5 py-1 bg-warn-bg text-warn text-[12px] font-mono rounded-full"
              >
                {r}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
