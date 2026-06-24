import { render, screen } from '@testing-library/react';
import { DashboardPage } from './DashboardPage';

describe('DashboardPage', () => {
  it('renders the Panel heading', () => {
    render(<DashboardPage />);
    expect(screen.getByRole('heading', { name: 'Panel' })).toBeInTheDocument();
  });

  it('shows a working-on-it message', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Trabajando en esto')).toBeInTheDocument();
  });
});
