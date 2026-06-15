import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addDays, format } from 'date-fns';
import { useClientList } from '../hooks/useClientList';
import { RenewalsPage } from './RenewalsPage';

jest.mock('../hooks/useClientList', () => ({
  useClientList: jest.fn(),
}));

jest.mock('../hooks/useClient', () => ({
  useClient: jest.fn(() => ({ renew: jest.fn() })),
}));

jest.mock('../components/modals/RenewalModal', () => ({
  RenewalModal: () => <div>renewal-modal</div>,
}));

// A date 7 days from now — always within the 14-day expiry window
const soonDate = format(addDays(new Date(), 7), 'yyyy-MM-dd');

function makeClient(overrides: object = {}) {
  return {
    id: '1',
    name: 'Ana García',
    deliveryZone: 'Centro',
    status: 'active',
    subscriptions: [{ id: 'sub-1', planId: 'plan-1', contractEndDate: soonDate }],
    ...overrides,
  };
}

describe('RenewalsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading indicator while fetching', () => {
    (useClientList as jest.Mock).mockReturnValue({ clients: [], isLoading: true });
    render(<RenewalsPage />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('shows empty state when no contracts are expiring', () => {
    (useClientList as jest.Mock).mockReturnValue({ clients: [], isLoading: false });
    render(<RenewalsPage />);
    expect(screen.getByText('Sin renovaciones')).toBeInTheDocument();
  });

  it('shows empty state when no inactive clients', () => {
    (useClientList as jest.Mock).mockReturnValue({ clients: [], isLoading: false });
    render(<RenewalsPage />);
    expect(screen.getByText('Sin inactivos')).toBeInTheDocument();
  });

  it('renders an expiring client in the Por vencer column', () => {
    const client = makeClient({ status: 'active' });
    (useClientList as jest.Mock).mockReturnValue({ clients: [client], isLoading: false });
    render(<RenewalsPage />);
    expect(screen.getByText('Ana García')).toBeInTheDocument();
  });

  it('renders an ended client in the Inactivos column', () => {
    const client = makeClient({
      status: 'ended',
      subscriptions: [{ id: 'sub-1', planId: 'p1', contractEndDate: '2026-05-01' }],
    });
    (useClientList as jest.Mock).mockReturnValue({ clients: [client], isLoading: false });
    render(<RenewalsPage />);
    expect(screen.getByText('Ana García')).toBeInTheDocument();
  });

  it('opens renewal modal when a client row is clicked', async () => {
    const client = makeClient({ status: 'active' });
    (useClientList as jest.Mock).mockReturnValue({ clients: [client], isLoading: false });
    render(<RenewalsPage />);
    await userEvent.click(screen.getByText('Ana García'));
    expect(screen.getByText('renewal-modal')).toBeInTheDocument();
  });
});
