import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginHistoryModal } from '@/features/users/components/LoginHistoryModal';
import { useLoginHistory, type LoginEntry } from '@/features/users/hooks/useLoginHistory';
import type { AppUser } from '@/features/users/hooks/useUsers';

jest.mock('@/features/users/hooks/useLoginHistory', () => ({
  useLoginHistory: jest.fn(),
}));

const mockUseLoginHistory = useLoginHistory as jest.Mock;

const user: AppUser = {
  id: 'abc',
  username: 'caro',
  role: 'kitchen',
  lastLoginAt: '2026-07-03T12:30:00.000Z',
  lastDeviceType: 'mobile',
  lastOs: 'Android 14',
  lastBrowser: 'Chrome 126',
};

const entries: LoginEntry[] = [
  {
    deviceType: 'mobile',
    os: 'Android 14',
    browser: 'Chrome 126',
    createdAt: '2026-07-03T12:30:00.000Z',
  },
  { deviceType: null, os: null, browser: null, createdAt: '2026-07-01T08:00:00.000Z' },
];

function mockHistory(overrides: Partial<ReturnType<typeof useLoginHistory>> = {}) {
  mockUseLoginHistory.mockReturnValue({
    entries: [],
    isLoading: false,
    error: null,
    ...overrides,
  });
}

beforeEach(() => jest.clearAllMocks());

describe('LoginHistoryModal', () => {
  it('shows the title with the username', () => {
    mockHistory();
    render(<LoginHistoryModal user={user} onClose={jest.fn()} />);

    expect(screen.getByText('Historial de acceso')).toBeInTheDocument();
    expect(screen.getByText('caro')).toBeInTheDocument();
  });

  it('fetches the history for the given user', () => {
    mockHistory();
    render(<LoginHistoryModal user={user} onClose={jest.fn()} />);

    expect(mockUseLoginHistory).toHaveBeenCalledWith('abc');
  });

  it('renders a row per entry with timestamp and device', () => {
    mockHistory({ entries });
    render(<LoginHistoryModal user={user} onClose={jest.fn()} />);

    expect(screen.getByText('Chrome 126 · Android 14 · Móvil')).toBeInTheDocument();
    expect(screen.getByText('Dispositivo desconocido')).toBeInTheDocument();
  });

  it('shows an empty state when there are no entries', () => {
    mockHistory();
    render(<LoginHistoryModal user={user} onClose={jest.fn()} />);

    expect(screen.getByText('Sin inicios de sesión')).toBeInTheDocument();
  });

  it('shows a loading state', () => {
    mockHistory({ isLoading: true });
    render(<LoginHistoryModal user={user} onClose={jest.fn()} />);

    expect(screen.getByText('Cargando…')).toBeInTheDocument();
    expect(screen.queryByText('Sin inicios de sesión')).not.toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = jest.fn();
    mockHistory();
    render(<LoginHistoryModal user={user} onClose={onClose} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalled();
  });
});
