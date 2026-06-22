import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../contexts/AuthContext';
import { UsersPage } from './UsersPage';

jest.mock('../../hooks/useUsers', () => ({
  useUsers: jest.fn(),
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

let capturedModalProps: Record<string, unknown> = {};
jest.mock('./UserModal', () => ({
  UserModal: (props: Record<string, unknown>) => {
    capturedModalProps = props;
    return <div>user-modal</div>;
  },
}));

jest.mock('../../components/ui/PageLoader', () => ({
  PageLoader: () => <div>cargando</div>,
}));

const defaultUsers = [
  {
    id: '1',
    username: 'admin',
    role: 'admin' as const,
    lastLoginAt: '2026-06-20T14:30:00',
    deletedAt: null,
  },
  { id: '2', username: 'chef', role: 'kitchen' as const, lastLoginAt: null, deletedAt: null },
  {
    id: '3',
    username: 'rocio',
    role: 'kitchen' as const,
    lastLoginAt: null,
    deletedAt: '2026-06-10T00:00:00.000Z',
  },
];

function setupUsers(overrides: object = {}) {
  (useUsers as jest.Mock).mockReturnValue({
    users: defaultUsers,
    isLoading: false,
    isSaving: false,
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    ...overrides,
  });
}

describe('UsersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedModalProps = {};
    (useAuth as jest.Mock).mockReturnValue({ user: { id: '1', username: 'admin', role: 'admin' } });
    setupUsers();
  });

  it('renders the Usuarios heading', () => {
    render(<UsersPage />);
    expect(screen.getByRole('heading', { name: 'Usuarios' })).toBeInTheDocument();
  });

  it('renders a row for each user', () => {
    render(<UsersPage />);
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('chef')).toBeInTheDocument();
  });

  it('renders the PageLoader while loading', () => {
    setupUsers({ isLoading: true, users: [] });
    render(<UsersPage />);
    expect(screen.getByText('cargando')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Usuarios' })).not.toBeInTheDocument();
  });

  it('shows empty state when no users exist', () => {
    setupUsers({ users: [] });
    render(<UsersPage />);
    expect(screen.getByText('Sin usuarios')).toBeInTheDocument();
  });

  it('opens create modal when Agregar usuario is clicked', async () => {
    render(<UsersPage />);
    await userEvent.click(screen.getByRole('button', { name: /agregar usuario/i }));
    expect(screen.getByText('user-modal')).toBeInTheDocument();
  });

  it('opens edit modal when the settings button for a user is clicked', async () => {
    render(<UsersPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Editar admin' }));
    expect(screen.getByText('user-modal')).toBeInTheDocument();
  });

  it('passes isSelf=true when editing the currently logged-in user', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: '1', username: 'admin', role: 'admin' } });
    render(<UsersPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Editar admin' }));
    expect(capturedModalProps.isSelf).toBe(true);
  });

  it('passes isSelf=false when editing a different user', async () => {
    render(<UsersPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Editar chef' }));
    expect(capturedModalProps.isSelf).toBe(false);
  });

  it('shows a role summary card with the count of users per role', () => {
    render(<UsersPage />);
    const kitchenCard = screen.getAllByText('Cocina')[0].closest('div');
    expect(kitchenCard).toHaveTextContent('2');
  });

  it('shows the total user count', () => {
    render(<UsersPage />);
    expect(screen.getByText('3 usuarios')).toBeInTheDocument();
  });

  it('filters the table by username when searching', async () => {
    render(<UsersPage />);
    await userEvent.type(screen.getByPlaceholderText(/buscar usuario/i), 'chef');
    expect(screen.getByText('chef')).toBeInTheDocument();
    expect(screen.queryByText('admin')).not.toBeInTheDocument();
  });

  it('shows the formatted last login date', () => {
    render(<UsersPage />);
    expect(screen.getByText('20/06/2026 14:30')).toBeInTheDocument();
  });

  it('shows Nunca when the user has never logged in', () => {
    render(<UsersPage />);
    expect(screen.getAllByText('Nunca')).toHaveLength(2);
  });

  it('shows Activo for users without a deletedAt', () => {
    render(<UsersPage />);
    expect(screen.getAllByText('Activo')).toHaveLength(2);
  });

  it('shows Inactivo for soft-deleted users', () => {
    render(<UsersPage />);
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });
});
