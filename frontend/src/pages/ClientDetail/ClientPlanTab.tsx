import type { Client, Subscription } from '../../types/client';
import { BillingCard } from './BillingCard';
import { ContractCard } from './ContractCard';
import { PlanCard } from './PlanCard';

export type { ContractDraft } from './ContractCard';

interface Props {
  client: Client;
  sub: Subscription | undefined;
  remaining: number;
  onUpdateContract: (draft: import('./ContractCard').ContractDraft) => Promise<void>;
  onUpdateBilling: (discount: number) => Promise<void>;
}

export function ClientPlanTab({
  client,
  sub,
  remaining,
  onUpdateContract,
  onUpdateBilling,
}: Props) {
  if (!sub) {
    return <p className="text-[13px] text-muted">Sin suscripción activa.</p>;
  }

  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-12 lg:col-span-7">
        <PlanCard sub={sub} onUpdateBilling={onUpdateBilling} />
      </div>
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
        <ContractCard sub={sub} remaining={remaining} onUpdateContract={onUpdateContract} />
        <BillingCard nit={client.nit} businessName={client.businessName} />
      </div>
    </div>
  );
}
