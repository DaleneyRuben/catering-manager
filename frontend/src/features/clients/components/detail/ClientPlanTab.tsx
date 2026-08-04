import type { Client, Subscription, SubscriptionTermsDraft } from '@/features/clients/types';
import { BillingCard } from '@/features/clients/components/detail/BillingCard';
import { ContractCard } from '@/features/clients/components/detail/ContractCard';
import { ActivePlanCard } from '@/features/clients/components/detail/ActivePlanCard';

export type { ContractDraft } from '@/features/clients/components/detail/ContractCard';

interface Props {
  client: Client;
  sub: Subscription | undefined;
  remaining: number;
  onUpdateContract: (draft: import('./ContractCard').ContractDraft) => Promise<void>;
  onUpdateTerms: (terms: SubscriptionTermsDraft) => Promise<void>;
  onUpdateInstructions: (specialInstructions: Record<string, string>) => Promise<void>;
}

export function ClientPlanTab({
  client,
  sub,
  remaining,
  onUpdateContract,
  onUpdateTerms,
  onUpdateInstructions,
}: Props) {
  if (!sub) {
    return <p className="text-[13px] text-muted">Sin suscripción activa.</p>;
  }

  return (
    <div className="grid grid-cols-12 gap-[20px]">
      <div className="col-span-12 lg:col-span-7 flex flex-col gap-[20px]">
        <ActivePlanCard
          sub={sub}
          onUpdateTerms={onUpdateTerms}
          onUpdateInstructions={onUpdateInstructions}
        />
      </div>
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-[20px]">
        <ContractCard sub={sub} remaining={remaining} onUpdateContract={onUpdateContract} />
        <BillingCard nit={client.nit} businessName={client.businessName} />
      </div>
    </div>
  );
}
