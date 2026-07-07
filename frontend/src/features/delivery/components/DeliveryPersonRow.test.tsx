import { render, screen } from '@testing-library/react';
import { DeliveryPersonRow } from '@/features/delivery/components/DeliveryPersonRow';

const person = {
  id: '1',
  name: 'Carmen Tapia',
  phone: '7259 1232',
  deliveryZone: 'Centro',
  address: 'C. Sucre #88, Centro',
  isNew: false,
};

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

  it('stacks the phone directly under the name when there is no address (group member)', () => {
    const { container } = render(
      <DeliveryPersonRow person={person} avatarClass="" rowBorderClass="" />,
    );
    const row = container.firstChild as HTMLElement;
    const nameColumn = row.children[1];
    const link = screen.getByRole('link', { name: /7259 1232/ });
    expect(nameColumn).toContainElement(link);
  });

  it('positions the phone as a trailing element of the row, not under the address (single)', () => {
    const { container } = render(
      <DeliveryPersonRow person={person} avatarClass="" rowBorderClass="" showAddress />,
    );
    const row = container.firstChild as HTMLElement;
    const nameColumn = row.children[1];
    const link = screen.getByRole('link', { name: /7259 1232/ });
    expect(nameColumn).not.toContainElement(link);
    expect(row).toContainElement(link);
  });

  it('does not render the address by default', () => {
    render(<DeliveryPersonRow person={person} avatarClass="" rowBorderClass="" />);
    expect(screen.queryByText('C. Sucre #88, Centro')).not.toBeInTheDocument();
  });

  it('renders the address when showAddress is set', () => {
    render(<DeliveryPersonRow person={person} avatarClass="" rowBorderClass="" showAddress />);
    expect(screen.getByText('C. Sucre #88, Centro')).toBeInTheDocument();
  });

  it('does not show the "Nuevo" badge when isNew is false', () => {
    render(<DeliveryPersonRow person={person} avatarClass="" rowBorderClass="" />);
    expect(screen.queryByText('Nuevo')).not.toBeInTheDocument();
  });

  it('shows the "Nuevo" badge when isNew is true', () => {
    render(
      <DeliveryPersonRow person={{ ...person, isNew: true }} avatarClass="" rowBorderClass="" />,
    );
    expect(screen.getByText('Nuevo')).toBeInTheDocument();
  });
});
