import type { Client, Subscription } from '../../types/client';
import { BillingCard } from './BillingCard';
import { ContractCard } from './ContractCard';
import { PlanCard } from './PlanCard';
import { ClientSuspensionsTab } from './ClientSuspensionsTab';
import { ClientGroupTab } from './ClientGroupTab';

export type { ContractDraft } from './ContractCard';

interface Props {
  client: Client;
  sub: Subscription | undefined;
  remaining: number;
  onUpdateContract: (draft: import('./ContractCard').ContractDraft) => Promise<void>;
  onUpdateBilling: (discount: number) => Promise<void>;
  onUpdateInstructions: (specialInstructions: Record<string, string>) => Promise<void>;
  onSuspend: () => void;
}

export function ClientPlanTab({
  client,
  sub,
  remaining,
  onUpdateContract,
  onUpdateBilling,
  onUpdateInstructions,
  onSuspend,
}: Props) {
  if (!sub) {
    return <p className="text-[13px] text-muted">Sin suscripción activa.</p>;
  }

  return (
    <div className="grid grid-cols-12 gap-[20px]">
      <div className="col-span-12 lg:col-span-7 flex flex-col gap-[20px]">
        <PlanCard
          sub={sub}
          onUpdateBilling={onUpdateBilling}
          onUpdateInstructions={onUpdateInstructions}
        />
        <ContractCard sub={sub} remaining={remaining} onUpdateContract={onUpdateContract} />
        <BillingCard nit={client.nit} businessName={client.businessName} />
      </div>
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-[20px]">
        <ClientSuspensionsTab sub={sub} onSuspend={onSuspend} />
        <ClientGroupTab clientId={client.id} initialMembers={client.groupMembers} />
      </div>
    </div>
  );
}
