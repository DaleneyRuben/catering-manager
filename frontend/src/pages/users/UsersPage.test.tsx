import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useUsers } from '../../hooks/useUsers';
import { UsersPage } from './UsersPage';

jest.mock('../../hooks/useUsers', () => ({
  useUsers: jest.fn(),
}));

jest.mock('./UserModal', () => ({
  UserModal: () => <div>user-modal</div>,
}));

jest.mock('../../components/ui/PageLoader', () => ({
  PageLoader: () => <div>cargando</div>,
}));

const defaultUsers = [
  { id: '1', username: 'admin', role: 'admin' as const },
  { id: '2', username: 'chef', role: 'manager' as const },
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
});
