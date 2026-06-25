import { render, screen } from '@testing-library/react';
import { DeliveryGroupCard, GROUP_PALETTE_SIZE } from './DeliveryGroupCard';
import type { DeliveryGroup } from '../../types/delivery';

const group: DeliveryGroup = {
  groupToken: 'tok-1',
  members: [
    { id: '1', name: 'Carmen Tapia', phone: '72591232', deliveryZone: 'Centro' },
    { id: '2', name: 'Jorge Rengel', phone: '76651200', deliveryZone: 'Centro' },
  ],
};

describe('DeliveryGroupCard', () => {
  it('shows the "Entrega conjunta" label', () => {
    render(<DeliveryGroupCard group={group} colorIndex={0} />);
    expect(screen.getByText('Entrega conjunta')).toBeInTheDocument();
  });

  it('shows the member count chip', () => {
    render(<DeliveryGroupCard group={group} colorIndex={0} />);
    expect(screen.getByText('2 clientes')).toBeInTheDocument();
  });

  it('renders every member', () => {
    render(<DeliveryGroupCard group={group} colorIndex={0} />);
    expect(screen.getByText('Carmen Tapia')).toBeInTheDocument();
    expect(screen.getByText('Jorge Rengel')).toBeInTheDocument();
  });

  it('wraps the colorIndex around the palette size', () => {
    const { container: c1 } = render(<DeliveryGroupCard group={group} colorIndex={0} />);
    const { container: c2 } = render(
      <DeliveryGroupCard group={group} colorIndex={GROUP_PALETTE_SIZE} />,
    );
    expect(c1.firstChild?.className).toBe(c2.firstChild?.className);
  });

  it('uses a different palette color for a different colorIndex', () => {
    const { container: c1 } = render(<DeliveryGroupCard group={group} colorIndex={0} />);
    const { container: c2 } = render(<DeliveryGroupCard group={group} colorIndex={1} />);
    expect(c1.firstChild?.className).not.toBe(c2.firstChild?.className);
  });
});
