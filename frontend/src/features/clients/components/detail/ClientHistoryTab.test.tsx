import { render, screen } from '@testing-library/react';
import { ClientHistoryTab } from '@/features/clients/components/detail/ClientHistoryTab';
import * as useClientHistoryModule from '@/features/clients/hooks/useClientHistory';
import type { ClientHistoryEntry, Subscription } from '@/features/clients/types';

jest.mock('@/features/clients/hooks/useClientHistory');
const mockUseClientHistory = useClientHistoryModule.useClientHistory as jest.Mock;

const entry = (overrides: Partial<ClientHistoryEntry> = {}): ClientHistoryEntry => ({
  id: '1',
  clientId: '1',
  eventType: 'plan_assigned',
  occurredAt: '2026-06-19T14:20:00',
  metadata: {},
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

  it('formats the plan price without a dollar sign and with dot thousands separator', () => {
    mockUseClientHistory.mockReturnValue({
      history: [entry({ metadata: { planName: 'Hiperproteico', planPrice: 1390, discount: 0 } })],
      isLoading: false,
    });
    render(<ClientHistoryTab clientId="1" />);
    expect(screen.getByText('1.390/mes')).toBeInTheDocument();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
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
