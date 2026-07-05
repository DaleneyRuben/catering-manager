import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { set, subDays } from 'date-fns';
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
  lastOs: 'Android',
  lastBrowser: 'Chrome 126',
};

const todayNoon = set(new Date(), { hours: 12, minutes: 30, seconds: 0, milliseconds: 0 });

const entries: LoginEntry[] = [
  {
    deviceType: 'mobile',
    os: 'Android',
    browser: 'Chrome 126',
    createdAt: todayNoon.toISOString(),
  },
  {
    deviceType: null,
    os: null,
    browser: null,
    createdAt: set(subDays(todayNoon, 3), { hours: 8, minutes: 0 }).toISOString(),
  },
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
  it('shows the username as title with the two week subtitle', () => {
    mockHistory();
    render(<LoginHistoryModal user={user} onClose={jest.fn()} />);

    expect(screen.getByText('caro')).toBeInTheDocument();
    expect(screen.getByText('Historial de accesos · últimas 2 semanas')).toBeInTheDocument();
  });

  it('shows the user initials in a role-colored avatar', () => {
    mockHistory();
    render(<LoginHistoryModal user={user} onClose={jest.fn()} />);

    const avatar = screen.getByText('c');
    expect(avatar.className).toContain('bg-warn-bg');
  });

  it('fetches the history for the given user', () => {
    mockHistory();
    render(<LoginHistoryModal user={user} onClose={jest.fn()} />);

    expect(mockUseLoginHistory).toHaveBeenCalledWith('abc');
  });

  it('groups entries under day headers', () => {
    mockHistory({ entries });
    render(<LoginHistoryModal user={user} onClose={jest.fn()} />);

    expect(screen.getByText(/^Hoy · /)).toBeInTheDocument();
  });

  it('renders browser and os with the device label and time per entry', () => {
    mockHistory({ entries });
    render(<LoginHistoryModal user={user} onClose={jest.fn()} />);

    expect(screen.getByText('Chrome 126 · Android')).toBeInTheDocument();
    expect(screen.getByText('Móvil')).toBeInTheDocument();
    expect(screen.getByText('12:30')).toBeInTheDocument();
  });

  it('marks entries without device info as unknown', () => {
    mockHistory({ entries });
    render(<LoginHistoryModal user={user} onClose={jest.fn()} />);

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
