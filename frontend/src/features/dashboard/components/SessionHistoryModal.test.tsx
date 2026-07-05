import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { set, subDays, subMinutes } from 'date-fns';
import { SessionHistoryModal } from '@/features/dashboard/components/SessionHistoryModal';
import { useSessionHistory, type SessionEntry } from '@/features/dashboard/hooks/useSessionHistory';

jest.mock('@/features/dashboard/hooks/useSessionHistory', () => ({
  useSessionHistory: jest.fn(),
}));

jest.mock('@ui/Icon', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

const mockUseSessionHistory = useSessionHistory as jest.Mock;

const entries: SessionEntry[] = [
  {
    username: 'merlyn',
    role: 'kitchen',
    deviceType: 'mobile',
    os: 'Android',
    browser: 'Chrome 149',
    createdAt: subMinutes(new Date(), 8).toISOString(),
  },
  {
    username: 'daleney',
    role: 'super_admin',
    deviceType: null,
    os: null,
    browser: null,
    createdAt: set(subDays(new Date(), 2), { hours: 7, minutes: 58 }).toISOString(),
  },
];

function mockSessions(overrides: Partial<ReturnType<typeof useSessionHistory>> = {}) {
  mockUseSessionHistory.mockReturnValue({
    entries: [],
    isLoading: false,
    error: null,
    ...overrides,
  });
}

beforeEach(() => jest.clearAllMocks());

describe('SessionHistoryModal', () => {
  it('shows the title with the session count subtitle', () => {
    mockSessions({ entries });
    render(<SessionHistoryModal onClose={jest.fn()} />);

    expect(screen.getByText('Historial de sesiones')).toBeInTheDocument();
    expect(screen.getByText('2 sesiones · últimas 2 semanas')).toBeInTheDocument();
  });

  it('requests only kitchen and delivery sessions', () => {
    mockSessions();
    render(<SessionHistoryModal onClose={jest.fn()} />);

    expect(mockUseSessionHistory).toHaveBeenCalledWith(['kitchen', 'delivery']);
  });

  it('groups sessions under day headers', () => {
    mockSessions({ entries });
    render(<SessionHistoryModal onClose={jest.fn()} />);

    expect(screen.getByText(/^Hoy · /)).toBeInTheDocument();
  });

  it('renders the username with a role tag and device meta per session', () => {
    mockSessions({ entries });
    render(<SessionHistoryModal onClose={jest.fn()} />);

    expect(screen.getByText('merlyn')).toBeInTheDocument();
    expect(screen.getByText('Cocina')).toBeInTheDocument();
    expect(screen.getByText('Chrome 149 · Android · Móvil')).toBeInTheDocument();
  });

  it('shows the Activa badge only for logins within the last hour', () => {
    mockSessions({ entries });
    render(<SessionHistoryModal onClose={jest.fn()} />);

    expect(screen.getAllByText('Activa')).toHaveLength(1);
  });

  it('shows the device icon chip per session, falling back to history', () => {
    mockSessions({ entries });
    render(<SessionHistoryModal onClose={jest.fn()} />);

    expect(screen.getByTestId('icon-smartphone')).toBeInTheDocument();
    // header icon + fallback chip for the entry without device info
    expect(screen.getAllByTestId('icon-history')).toHaveLength(2);
  });

  it('does not render a standalone status dot next to the device icon', () => {
    mockSessions({ entries });
    render(<SessionHistoryModal onClose={jest.fn()} />);

    expect(document.querySelectorAll('.w-\\[9px\\].h-\\[9px\\].rounded-full')).toHaveLength(0);
  });

  it('marks sessions without device info as unknown', () => {
    mockSessions({ entries });
    render(<SessionHistoryModal onClose={jest.fn()} />);

    expect(screen.getByText('Dispositivo desconocido')).toBeInTheDocument();
  });

  it('shows an empty state when there are no sessions', () => {
    mockSessions();
    render(<SessionHistoryModal onClose={jest.fn()} />);

    expect(screen.getByText('Sin inicios de sesión')).toBeInTheDocument();
  });

  it('shows a loading state', () => {
    mockSessions({ isLoading: true });
    render(<SessionHistoryModal onClose={jest.fn()} />);

    expect(screen.getByText('Cargando…')).toBeInTheDocument();
    expect(screen.queryByText('Sin inicios de sesión')).not.toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = jest.fn();
    mockSessions();
    render(<SessionHistoryModal onClose={onClose} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalled();
  });
});
