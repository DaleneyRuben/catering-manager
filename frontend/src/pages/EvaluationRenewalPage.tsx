import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@ui/Button';
import { PageHeader } from '@ui/PageHeader';
import { useAppointment } from '@/features/evaluations/hooks/useAppointment';
import { useClient } from '@/features/clients/hooks/useClient';
import { CLIENT_STATUS } from '@/features/clients/constants/clientStatus';
import { RenewalModal } from '@/features/clients/components/modals/RenewalModal';
import { ExistingClientSummaryCard } from '@/features/evaluations/components/ExistingClientSummaryCard';
import type { RenewalPayload } from '@/features/clients/types';

export function EvaluationRenewalPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appointment, isLoading: isLoadingAppointment, linkSubscription } = useAppointment(id!);
  const { client, isLoading: isLoadingClient, renew } = useClient(appointment?.clientId ?? '');

  const handleRenew = async (data: RenewalPayload) => {
    const subscription = await renew({ ...data, appointmentId: id });
    await linkSubscription(subscription.id);
    return subscription;
  };

  if (isLoadingAppointment || (appointment && isLoadingClient) || !client) {
    return <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]" />;
  }

  const sub = client.subscriptions[0];

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
      <Button
        variant="ghost"
        onClick={() => navigate('/evaluaciones')}
        leftIcon="arrow-left"
        className="font-mono uppercase tracking-[.08em] hover:underline mb-5"
        style={{ padding: 0, fontSize: '11px', gap: '7px' }}
      >
        Volver a Evaluaciones
      </Button>

      <PageHeader label="Evaluaciones · Renovación" title={client.name} />

      <ExistingClientSummaryCard client={client} sub={sub} />

      <RenewalModal
        client={client}
        sub={sub}
        isReactivation={client.status === CLIENT_STATUS.ENDED}
        onClose={() => navigate('/evaluaciones')}
        onRenew={handleRenew}
        showPaidToggle
      />
    </div>
  );
}
