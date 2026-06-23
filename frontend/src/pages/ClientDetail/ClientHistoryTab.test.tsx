import { render, screen } from '@testing-library/react';
import { ClientHistoryTab } from './ClientHistoryTab';
import * as useClientHistoryModule from '../../hooks/useClientHistory';
import type { ClientHistoryEntry } from '../../types/client';

jest.mock('../../hooks/useClientHistory');
const mockUseClientHistory = useClientHistoryModule.useClientHistory as jest.Mock;

const entry = (overrides: Partial<ClientHistoryEntry> = {}): ClientHistoryEntry => ({
  id: '1',
  clientId: '1',
  eventType: 'plan_assigned',
  occurredAt: '2026-06-19T14:20:00',
  metadata: {},
  ...overrides,
});

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
});
