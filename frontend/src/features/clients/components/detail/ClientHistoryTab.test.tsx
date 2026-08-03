import { render, screen } from '@testing-library/react';
import { ClientHistoryTab } from '@/features/clients/components/detail/ClientHistoryTab';
import { useClientHistory } from '@/features/clients/hooks/useClientHistory';
import { HISTORY_EVENTS } from '@/features/clients/constants/historyEvents';
import type { ClientHistoryEntry, Subscription } from '@/features/clients/types';

jest.mock('@/features/clients/hooks/useClientHistory');
const mockUseClientHistory = useClientHistory as jest.Mock;

const entry = (overrides: Partial<ClientHistoryEntry> = {}): ClientHistoryEntry => ({
  id: '1',
  clientId: '1',
  eventType: HISTORY_EVENTS.PLAN_ASSIGNED,
  occurredAt: '2026-06-19T14:20:00',
  metadata: {},
  username: null,
  ...overrides,
});

const endedSub: Subscription = {
  id: '1',
  clientId: '1',
  planId: '2',
  contractDate: '2026-05-22',
  startDate: '2026-05-22',
  contractEndDate: '2026-06-18',
  discount: 0,
  duration: 20,
  suspendedDates: ['2026-05-27'],
  finalizedAt: '2026-06-18',
  specialInstructions: {},
  plan: { id: '2', name: 'Hiperproteico', price: 1390, meals: ['lunch'] },
};

describe('ClientHistoryTab', () => {
  it('shows the date and time separated by a middle dot', () => {
    mockUseClientHistory.mockReturnValue({ history: [entry()], isLoading: false });
    render(<ClientHistoryTab clientId="1" />);
    expect(screen.getByText('19/06/2026 · 14:20')).toBeInTheDocument();
  });

  it('shows a deleted renewal with the contract that was removed', () => {
    mockUseClientHistory.mockReturnValue({
      history: [
        entry({
          eventType: HISTORY_EVENTS.RENEWAL_DELETED,
          metadata: {
            planName: 'Hiperproteico',
            startDate: '2026-07-02',
            contractEndDate: '2026-07-29',
          },
        }),
      ],
      isLoading: false,
    });

    render(<ClientHistoryTab clientId="1" />);

    expect(screen.getByText('Renovación eliminada')).toBeInTheDocument();
    expect(screen.getByText('Hiperproteico')).toBeInTheDocument();
    expect(screen.getByText('02/07/2026 → 29/07/2026')).toBeInTheDocument();
  });

  it('names who deleted the renewal and when it had been registered', () => {
    mockUseClientHistory.mockReturnValue({
      history: [
        entry({
          eventType: HISTORY_EVENTS.RENEWAL_DELETED,
          username: 'Daleney',
          metadata: {
            planName: 'Hiperproteico',
            startDate: '2026-07-02',
            contractEndDate: '2026-07-29',
            registeredAt: '2026-06-19T09:40:00',
          },
        }),
      ],
      isLoading: false,
    });

    render(<ClientHistoryTab clientId="1" />);

    expect(
      screen.getByText('Eliminada por Daleney · registrada el 19/06/2026 · 09:40'),
    ).toBeInTheDocument();
  });

  it('does not also show the generic actor line on a deleted renewal', () => {
    mockUseClientHistory.mockReturnValue({
      history: [
        entry({
          eventType: HISTORY_EVENTS.RENEWAL_DELETED,
          username: 'Daleney',
          metadata: {
            planName: 'Hiperproteico',
            startDate: '2026-07-02',
            contractEndDate: '2026-07-29',
            registeredAt: '2026-06-19T09:40:00',
          },
        }),
      ],
      isLoading: false,
    });

    render(<ClientHistoryTab clientId="1" />);

    expect(screen.queryByText('por Daleney')).not.toBeInTheDocument();
  });

  it('names the deleter alone when the registration time is unknown', () => {
    mockUseClientHistory.mockReturnValue({
      history: [
        entry({ eventType: HISTORY_EVENTS.RENEWAL_DELETED, username: 'Daleney', metadata: {} }),
      ],
      isLoading: false,
    });

    render(<ClientHistoryTab clientId="1" />);

    expect(screen.getByText('Eliminada por Daleney')).toBeInTheDocument();
  });

  it('omits the line entirely on a renewal deleted before users were tracked', () => {
    mockUseClientHistory.mockReturnValue({
      history: [entry({ eventType: HISTORY_EVENTS.RENEWAL_DELETED })],
      isLoading: false,
    });

    render(<ClientHistoryTab clientId="1" />);

    expect(screen.queryByText(/^Eliminada por/)).not.toBeInTheDocument();
  });

  it('names the user who triggered the event', () => {
    mockUseClientHistory.mockReturnValue({
      history: [entry({ username: 'daleney' })],
      isLoading: false,
    });

    render(<ClientHistoryTab clientId="1" />);

    expect(screen.getByText('por daleney')).toBeInTheDocument();
  });

  it('omits the actor line for an event recorded before users were tracked', () => {
    mockUseClientHistory.mockReturnValue({ history: [entry()], isLoading: false });

    render(<ClientHistoryTab clientId="1" />);

    expect(screen.queryByText(/^por /)).not.toBeInTheDocument();
  });

  it('formats the plan price without a dollar sign and with dot thousands separator', () => {
    mockUseClientHistory.mockReturnValue({
      history: [entry({ metadata: { planName: 'Hiperproteico', planPrice: 1390, discount: 0 } })],
      isLoading: false,
    });
    render(<ClientHistoryTab clientId="1" />);
    expect(screen.getByText('1.390/mes')).toBeInTheDocument();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });

  it('labels a contract edit by the dates it moved, and shows them', () => {
    mockUseClientHistory.mockReturnValue({
      history: [
        entry({
          eventType: HISTORY_EVENTS.DATES_CHANGED,
          metadata: { startDate: '2026-07-02', duration: 20, contractEndDate: '2026-07-29' },
        }),
      ],
      isLoading: false,
    });

    render(<ClientHistoryTab clientId="1" />);

    expect(screen.getByText('Fechas modificadas')).toBeInTheDocument();
    expect(screen.getByText('02/07/2026 → 29/07/2026 · 20 días')).toBeInTheDocument();
    expect(screen.queryByText(/\/mes$/)).not.toBeInTheDocument();
  });

  it('calls a price edit a price edit, and shows what the client paid before', () => {
    mockUseClientHistory.mockReturnValue({
      history: [
        entry({
          eventType: HISTORY_EVENTS.TERMS_CHANGED,
          metadata: {
            planId: '2',
            planName: 'Reductor',
            planPrice: 1450,
            previousPlanId: '2',
            previousPlanName: 'Reductor',
            discount: 150,
            previousDiscount: 0,
          },
        }),
      ],
      isLoading: false,
    });

    render(<ClientHistoryTab clientId="1" />);

    expect(screen.getByText('Precio modificado')).toBeInTheDocument();
    expect(screen.getByText('Reductor')).toBeInTheDocument();
    expect(screen.getByText('antes 1.450 · ahora 1.300/mes')).toBeInTheDocument();
  });

  it('shows the plan the client moved to and from on a plan change', () => {
    mockUseClientHistory.mockReturnValue({
      history: [
        entry({
          eventType: HISTORY_EVENTS.TERMS_CHANGED,
          metadata: {
            planId: '5',
            planName: 'Completo',
            planPrice: 1800,
            previousPlanId: '2',
            previousPlanName: 'Ligero',
            discount: 250,
            previousDiscount: 100,
          },
        }),
      ],
      isLoading: false,
    });

    render(<ClientHistoryTab clientId="1" />);

    expect(screen.getByText('Plan y precio modificados')).toBeInTheDocument();
    expect(screen.getByText('Completo')).toBeInTheDocument();
    expect(screen.getByText('antes Ligero · ahora Completo')).toBeInTheDocument();
  });

  it('names a reactivation after the plan, matching a renewal', () => {
    mockUseClientHistory.mockReturnValue({
      history: [
        entry({
          eventType: HISTORY_EVENTS.PLAN_REACTIVATED,
          metadata: { planName: 'Completo', planPrice: 1800 },
        }),
      ],
      isLoading: false,
    });

    render(<ClientHistoryTab clientId="1" />);

    expect(screen.getByText('Plan reactivado')).toBeInTheDocument();
    expect(screen.queryByText('Cliente reactivado')).not.toBeInTheDocument();
  });

  it('does not show the delivery calendar for an active client', () => {
    mockUseClientHistory.mockReturnValue({ history: [entry()], isLoading: false });
    render(<ClientHistoryTab clientId="1" sub={endedSub} isEnded={false} />);
    expect(screen.queryByText('Calendario de entregas')).not.toBeInTheDocument();
  });

  it('does not show the delivery calendar when the client is ended but has no contract dates', () => {
    mockUseClientHistory.mockReturnValue({ history: [entry()], isLoading: false });
    render(
      <ClientHistoryTab
        clientId="1"
        sub={{ ...endedSub, startDate: null, contractEndDate: null }}
        isEnded
      />,
    );
    expect(screen.queryByText('Calendario de entregas')).not.toBeInTheDocument();
  });

  it('shows the full delivery calendar for a finalized client, as of the contract end date', () => {
    mockUseClientHistory.mockReturnValue({ history: [entry()], isLoading: false });
    render(<ClientHistoryTab clientId="1" sub={endedSub} isEnded />);
    expect(screen.getByText('Calendario de entregas')).toBeInTheDocument();
    expect(screen.getByText('entregas realizadas').previousElementSibling).toHaveTextContent(
      // business days 22/05 - 18/06 = 20, minus the suspended 27/05 = 19 delivered
      '19',
    );
    expect(screen.getByText('días suspendidos').previousElementSibling).toHaveTextContent('1');
  });

  it('hides the pending legend on the finalized client calendar', () => {
    mockUseClientHistory.mockReturnValue({ history: [entry()], isLoading: false });
    render(<ClientHistoryTab clientId="1" sub={endedSub} isEnded />);
    expect(screen.queryByText('Pendiente')).not.toBeInTheDocument();
  });
});
