import type { Client, Subscription } from '@/features/clients/types';
import { BillingCard } from '@/features/clients/components/detail/BillingCard';
import { ContractCard } from '@/features/clients/components/detail/ContractCard';
import { ActivePlanCard } from '@/features/clients/components/detail/ActivePlanCard';
import { ClientSuspensionsTab } from '@/features/clients/components/detail/ClientSuspensionsTab';
import { ClientGroupTab } from '@/features/clients/components/detail/ClientGroupTab';

export type { ContractDraft } from '@/features/clients/components/detail/ContractCard';

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
        <ActivePlanCard
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
