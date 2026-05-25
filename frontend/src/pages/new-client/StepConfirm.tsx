import type { Plan } from '../../types/client';
import { addBusinessDays } from '../../utils/businessDays';
import type { IdentityState, PlanState, RestrictionsState } from './types';

function formatSex(sex: string): string {
  if (sex === 'female') return 'Femenino';
  if (sex === 'male') return 'Masculino';
  return 'Otro';
}

interface Props {
  identity: IdentityState;
  restrictions: RestrictionsState;
  planData: PlanState;
  plans: Plan[];
  submitError: string;
}

export function StepConfirm({ identity, restrictions, planData, plans, submitError }: Props) {
  const selectedPlan = plans.find((p) => p.id === planData.planId);
  const contractEndDate = planData.startDate ? addBusinessDays(planData.startDate, 20) : '';

  const identityRows: [string, string][] = [
    ['Nombre', identity.name],
    ['Sexo', formatSex(identity.sex)],
    ['Nacimiento', identity.dateOfBirth],
    ['Teléfono', identity.phoneNumber],
    ['Dirección', identity.address],
    ['Zona', identity.zone],
    ['Delivery', identity.delivery],
    ...(identity.nit ? ([['NIT', identity.nit]] as [string, string][]) : []),
    ...(identity.businessName
      ? ([['Razón Social', identity.businessName]] as [string, string][])
      : []),
  ];

  const planRows: [string, string][] = [
    ['Plan', selectedPlan?.name ?? '—'],
    ['Precio', selectedPlan ? `$${selectedPlan.price}` : '—'],
    ['Inicio', planData.startDate],
    ['Fin contrato', contractEndDate],
  ];

  return (
    <div>
      <h2 className="font-semibold text-ink text-[15px] mb-6">Confirmar</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">
            Identidad
          </h3>
          <dl className="space-y-2.5">
            {identityRows.map(([k, v]) => (
              <div key={k} className="flex gap-3 text-[13px]">
                <dt className="text-muted w-24 shrink-0">{k}</dt>
                <dd className="text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          {(restrictions.underlyingDiseases.length > 0 || restrictions.restrictions.length > 0) && (
            <div className="mt-5">
              <h3 className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">
                Restricciones
              </h3>
              <dl className="space-y-2.5">
                {restrictions.underlyingDiseases.length > 0 && (
                  <div className="flex gap-3 text-[13px]">
                    <dt className="text-muted w-24 shrink-0">Enfermedades</dt>
                    <dd className="text-ink">{restrictions.underlyingDiseases.join(', ')}</dd>
                  </div>
                )}
                {restrictions.restrictions.length > 0 && (
                  <div className="flex gap-3 text-[13px]">
                    <dt className="text-muted w-24 shrink-0">Restricciones</dt>
                    <dd className="text-ink">{restrictions.restrictions.join(', ')}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">Plan</h3>
          <dl className="space-y-2.5">
            {planRows.map(([k, v]) => (
              <div key={k} className="flex gap-3 text-[13px]">
                <dt className="text-muted w-24 shrink-0">{k}</dt>
                <dd className="text-ink font-mono">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      {submitError && (
        <p className="mt-6 text-[13px] text-warn bg-warn-bg px-3 py-2 rounded-md">{submitError}</p>
      )}
    </div>
  );
}
