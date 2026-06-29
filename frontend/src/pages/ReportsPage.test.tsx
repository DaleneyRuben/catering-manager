import { render, screen } from '@testing-library/react';
import { ReportsPage } from '@/pages/ReportsPage';
import { useAuth } from '@/contexts/AuthContext';

jest.mock('@/features/reports/components/DeliveryListCard', () => ({
  DeliveryListCard: () => <div>delivery-card</div>,
}));
jest.mock('@/features/reports/components/KitchenReportCard', () => ({
  KitchenReportCard: () => <div>kitchen-card</div>,
}));
jest.mock('@/features/reports/components/MenuCard', () => ({
  MenuCard: () => <div>menu-card</div>,
}));
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;

function mockUserRole(role: string) {
  mockUseAuth.mockReturnValue({ user: { id: 1, username: 'daleney', role } });
}

describe('ReportsPage', () => {
  beforeEach(() => {
    mockUserRole('admin');
  });

  it('renders the Informes heading', () => {
    render(<ReportsPage />);
    expect(screen.getByRole('heading', { name: 'Informes' })).toBeInTheDocument();
  });

  it('renders all three report cards for admin', () => {
    render(<ReportsPage />);
    expect(screen.getByText('delivery-card')).toBeInTheDocument();
    expect(screen.getByText('kitchen-card')).toBeInTheDocument();
    expect(screen.getByText('menu-card')).toBeInTheDocument();
  });

  it('renders all three report cards for super_admin', () => {
    mockUserRole('super_admin');
    render(<ReportsPage />);
    expect(screen.getByText('delivery-card')).toBeInTheDocument();
    expect(screen.getByText('kitchen-card')).toBeInTheDocument();
    expect(screen.getByText('menu-card')).toBeInTheDocument();
  });

  it('hides the kitchen report card for the kitchen role', () => {
    mockUserRole('kitchen');
    render(<ReportsPage />);
    expect(screen.getByText('delivery-card')).toBeInTheDocument();
    expect(screen.getByText('menu-card')).toBeInTheDocument();
    expect(screen.queryByText('kitchen-card')).not.toBeInTheDocument();
  });
});
