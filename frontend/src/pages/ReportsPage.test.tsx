import { render, screen } from '@testing-library/react';
import { ReportsPage } from './ReportsPage';

jest.mock('./reports/DeliveryListCard', () => ({
  DeliveryListCard: () => <div>delivery-card</div>,
}));
jest.mock('./reports/KitchenReportCard', () => ({
  KitchenReportCard: () => <div>kitchen-card</div>,
}));
jest.mock('./reports/MenuCard', () => ({
  MenuCard: () => <div>menu-card</div>,
}));

describe('ReportsPage', () => {
  it('renders the Informes heading', () => {
    render(<ReportsPage />);
    expect(screen.getByRole('heading', { name: 'Informes' })).toBeInTheDocument();
  });

  it('renders all three report cards', () => {
    render(<ReportsPage />);
    expect(screen.getByText('delivery-card')).toBeInTheDocument();
    expect(screen.getByText('kitchen-card')).toBeInTheDocument();
    expect(screen.getByText('menu-card')).toBeInTheDocument();
  });
});
