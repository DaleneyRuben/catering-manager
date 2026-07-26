import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@ui/Button';
import { PageHeader } from '@ui/PageHeader';
import { useAppointment } from '@/features/evaluations/hooks/useAppointment';
import { useClient } from '@/features/clients/hooks/useClient';
import { CLIENT_STATUS } from '@/features/clients/constants/clientStatus';
import { RenewalModal } from '@/features/clients/components/modals/RenewalModal';
import { ExistingClientSummaryCard } from '@/features/evaluations/components/ExistingClientSummaryCard';

function BackToEvaluaciones({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      leftIcon="arrow-left"
      className="font-mono uppercase tracking-[.08em] hover:underline mb-5"
      style={{ padding: 0, fontSize: '11px', gap: '7px' }}
    >
      Volver a Evaluaciones
    </Button>
  );
}

export function EvaluationRenewalPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = () => navigate('/evaluaciones');
  const {
    appointment,
    isLoading: isLoadingAppointment,
    isError: isAppointmentError,
    resolveRenewal,
  } = useAppointment(id!);
  const {
    client,
    isLoading: isLoadingClient,
    isError: isClientError,
  } = useClient(appointment?.clientId ?? '');

  const notFound =
    (!isLoadingAppointment && (isAppointmentError || !appointment || !appointment.clientId)) ||
    (!!appointment?.clientId && !isLoadingClient && (isClientError || !client));

  if (notFound) {
    return (
      <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
        <BackToEvaluaciones onClick={goBack} />
        <p className="text-[13.5px] text-muted">Cita no encontrada.</p>
      </div>
    );
  }

  if (isLoadingAppointment || (appointment && isLoadingClient) || !client) {
    return <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]" />;
  }

  const sub = client.subscriptions[0];

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
      <BackToEvaluaciones onClick={goBack} />

      <PageHeader label="Evaluaciones · Renovación" title={client.name} />

      <ExistingClientSummaryCard client={client} sub={sub} />

      <RenewalModal
        client={client}
        sub={sub}
        isReactivation={client.status === CLIENT_STATUS.ENDED}
        onClose={goBack}
        onRenew={resolveRenewal}
        showPaidToggle
      />
    </div>
  );
}
