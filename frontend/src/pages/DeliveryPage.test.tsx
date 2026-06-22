import { render, screen } from '@testing-library/react';
import { DeliveryPage } from './DeliveryPage';

describe('DeliveryPage', () => {
  it('renders the Entregas heading', () => {
    render(<DeliveryPage />);
    expect(screen.getByRole('heading', { name: 'Entregas' })).toBeInTheDocument();
  });

  it('shows a working-on-it message', () => {
    render(<DeliveryPage />);
    expect(screen.getByText('Trabajando en esto')).toBeInTheDocument();
  });
});
