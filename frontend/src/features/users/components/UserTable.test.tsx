import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { subHours, subMinutes } from 'date-fns';
import type { AppUser } from '@/features/users/hooks/useUsers';
import { UserTable } from './UserTable';

const noDevice = { lastDeviceType: null, lastOs: null, lastBrowser: null };

const makeUser = (overrides: Partial<AppUser> = {}): AppUser => ({
  id: '1',
  username: 'admin',
  role: 'admin',
  lastLoginAt: null,
  ...noDevice,
  ...overrides,
});

describe('UserTable', () => {
  it('shows the empty state when there are no users', () => {
    render(<UserTable users={[]} onHistory={() => {}} onEdit={() => {}} />);
    expect(screen.getByText('Sin usuarios')).toBeInTheDocument();
    expect(
      screen.getByText('Agrega el primer usuario usando el botón de arriba.'),
    ).toBeInTheDocument();
  });

  it('renders a row per user', () => {
    render(
      <UserTable
        users={[makeUser({ username: 'admin' }), makeUser({ id: '2', username: 'chef' })]}
        onHistory={() => {}}
        onEdit={() => {}}
      />,
    );
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('chef')).toBeInTheDocument();
  });

  it('shows Nunca when the user has never logged in', () => {
    render(
      <UserTable
        users={[makeUser({ lastLoginAt: null })]}
        onHistory={() => {}}
        onEdit={() => {}}
      />,
    );
    expect(screen.getByText('Nunca')).toBeInTheDocument();
  });

  it('shows Activo for a user who logged in within the last 8 hours', () => {
    render(
      <UserTable
        users={[makeUser({ lastLoginAt: subMinutes(new Date(), 8).toISOString() })]}
        onHistory={() => {}}
        onEdit={() => {}}
      />,
    );
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('shows Inactivo for a user who logged in more than 8 hours ago', () => {
    render(
      <UserTable
        users={[makeUser({ lastLoginAt: subHours(new Date(), 10).toISOString() })]}
        onHistory={() => {}}
        onEdit={() => {}}
      />,
    );
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  it('calls onHistory with the clicked user', async () => {
    const onHistory = jest.fn();
    const user = makeUser({ username: 'admin' });
    render(<UserTable users={[user]} onHistory={onHistory} onEdit={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Historial de admin' }));
    expect(onHistory).toHaveBeenCalledWith(user);
  });

  it('calls onEdit with the clicked user', async () => {
    const onEdit = jest.fn();
    const user = makeUser({ username: 'admin' });
    render(<UserTable users={[user]} onHistory={() => {}} onEdit={onEdit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Editar admin' }));
    expect(onEdit).toHaveBeenCalledWith(user);
  });
});
