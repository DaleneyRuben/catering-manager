import { render, screen } from '@testing-library/react';
import { DeliveryPersonRow } from './DeliveryPersonRow';

const person = { id: '1', name: 'Carmen Tapia', phone: '7259 1232', deliveryZone: 'Centro' };

describe('DeliveryPersonRow', () => {
  it('renders the name', () => {
    render(<DeliveryPersonRow person={person} avatarClass="" rowBorderClass="" />);
    expect(screen.getByText('Carmen Tapia')).toBeInTheDocument();
  });

  it('renders the initials in the avatar', () => {
    render(<DeliveryPersonRow person={person} avatarClass="" rowBorderClass="" />);
    expect(screen.getByText('CT')).toBeInTheDocument();
  });

  it('renders a tel: link with spaces stripped from the phone number', () => {
    render(<DeliveryPersonRow person={person} avatarClass="" rowBorderClass="" />);
    const link = screen.getByRole('link', { name: /7259 1232/ });
    expect(link).toHaveAttribute('href', 'tel:72591232');
  });
});
