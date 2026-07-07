import { render, screen } from '@testing-library/react';
import { ReportsPage } from '@/pages/ReportsPage';
import { useAuth } from '@/features/auth/AuthContext';
import { useMenu } from '@/features/menu/hooks/useMenu';
import type { Menu } from '@/features/menu/types';

jest.mock('@/features/reports/components/DeliveryListCard', () => ({
  DeliveryListCard: () => <div>delivery-card</div>,
}));
jest.mock('@/features/reports/components/KitchenReportCard', () => ({
  KitchenReportCard: ({ menus }: { menus: Menu[] }) => <div>kitchen-card-{menus.length}</div>,
}));
jest.mock('@/features/reports/components/MenuCard', () => ({
  MenuCard: ({ menus }: { menus: Menu[] }) => <div>menu-card-{menus.length}</div>,
}));
jest.mock('@/features/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/features/menu/hooks/useMenu', () => ({
  useMenu: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockUseMenu = useMenu as jest.Mock;

function mockUserRole(role: string) {
  mockUseAuth.mockReturnValue({ user: { id: 1, username: 'daleney', role } });
}

describe('ReportsPage', () => {
  beforeEach(() => {
    mockUserRole('admin');
    mockUseMenu.mockReturnValue({ menus: [{ date: '2026-07-07' }], isLoading: false });
  });

  it('renders the Informes heading', () => {
    render(<ReportsPage />);
    expect(screen.getByRole('heading', { name: 'Informes' })).toBeInTheDocument();
  });

  it('renders all three report cards for admin, passing menus down', () => {
    render(<ReportsPage />);
    expect(screen.getByText('delivery-card')).toBeInTheDocument();
    expect(screen.getByText('kitchen-card-1')).toBeInTheDocument();
    expect(screen.getByText('menu-card-1')).toBeInTheDocument();
  });

  it('renders all three report cards for super_admin', () => {
    mockUserRole('super_admin');
    render(<ReportsPage />);
    expect(screen.getByText('delivery-card')).toBeInTheDocument();
    expect(screen.getByText('kitchen-card-1')).toBeInTheDocument();
    expect(screen.getByText('menu-card-1')).toBeInTheDocument();
  });

  it('hides the kitchen report card for the kitchen role', () => {
    mockUserRole('kitchen');
    render(<ReportsPage />);
    expect(screen.getByText('delivery-card')).toBeInTheDocument();
    expect(screen.getByText('menu-card-1')).toBeInTheDocument();
    expect(screen.queryByText(/kitchen-card/)).not.toBeInTheDocument();
  });

  it('shows a whole-page skeleton (including the delivery list card) while menus are loading', () => {
    mockUseMenu.mockReturnValue({ menus: [], isLoading: true });
    render(<ReportsPage />);
    expect(screen.queryByText('delivery-card')).not.toBeInTheDocument();
    expect(screen.queryByText(/menu-card/)).not.toBeInTheDocument();
    expect(screen.queryByText(/kitchen-card/)).not.toBeInTheDocument();
    expect(screen.getAllByTestId('report-card-skeleton')).toHaveLength(3);
  });

  it('shows only two skeleton cards for the kitchen role while loading', () => {
    mockUserRole('kitchen');
    mockUseMenu.mockReturnValue({ menus: [], isLoading: true });
    render(<ReportsPage />);
    expect(screen.getAllByTestId('report-card-skeleton')).toHaveLength(2);
  });
});
