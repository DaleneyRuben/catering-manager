import { render, screen } from '@testing-library/react';
import type { AppUser } from '@/features/users/hooks/useUsers';
import { UserRoleStats } from './UserRoleStats';

const noDevice = { lastDeviceType: null, lastOs: null, lastBrowser: null };

const makeUser = (overrides: Partial<AppUser> = {}): AppUser => ({
  id: '1',
  username: 'admin',
  role: 'admin',
  lastLoginAt: null,
  ...noDevice,
  ...overrides,
});

describe('UserRoleStats', () => {
  it('renders a card for every role, including roles with zero users', () => {
    render(<UserRoleStats users={[]} />);
    expect(screen.getByText('Super admin')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Cocina')).toBeInTheDocument();
    expect(screen.getByText('Delivery')).toBeInTheDocument();
  });

  it('shows the count of users per role', () => {
    render(
      <UserRoleStats
        users={[
          makeUser({ id: '1', role: 'kitchen' }),
          makeUser({ id: '2', role: 'kitchen' }),
          makeUser({ id: '3', role: 'admin' }),
        ]}
      />,
    );
    const kitchenCard = screen.getByText('Cocina').closest('div');
    expect(kitchenCard).toHaveTextContent('2');
    const adminCard = screen.getByText('Admin').closest('div');
    expect(adminCard).toHaveTextContent('1');
  });
});
