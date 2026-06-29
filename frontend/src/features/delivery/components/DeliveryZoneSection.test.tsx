import { render, screen } from '@testing-library/react';
import { DeliveryZoneSection } from '@/features/delivery/components/DeliveryZoneSection';
import type { DeliveryZone } from '@/features/delivery/types';

const person = (id: string, name: string) => ({ id, name, phone: '70000000', deliveryZone: 'Sur' });

describe('DeliveryZoneSection', () => {
  it('shows the zone label', () => {
    const zone: DeliveryZone = { zone: 'Sur', entregas: 0, groups: [], singles: [] };
    render(<DeliveryZoneSection zone={zone} colorIndexOffset={0} />);
    expect(screen.getByText('Zona Sur')).toBeInTheDocument();
  });

  it('shows the entregas count, pluralized', () => {
    const zone: DeliveryZone = { zone: 'Sur', entregas: 3, groups: [], singles: [] };
    render(<DeliveryZoneSection zone={zone} colorIndexOffset={0} />);
    expect(screen.getByText('3 entregas')).toBeInTheDocument();
  });

  it('shows singular entrega count', () => {
    const zone: DeliveryZone = { zone: 'Sur', entregas: 1, groups: [], singles: [] };
    render(<DeliveryZoneSection zone={zone} colorIndexOffset={0} />);
    expect(screen.getByText('1 entrega')).toBeInTheDocument();
  });

  it('renders group cards when groups exist', () => {
    const zone: DeliveryZone = {
      zone: 'Sur',
      entregas: 1,
      groups: [{ groupToken: 'tok-1', members: [person('1', 'Carmen Tapia')] }],
      singles: [],
    };
    render(<DeliveryZoneSection zone={zone} colorIndexOffset={0} />);
    expect(screen.getByText('Entrega conjunta')).toBeInTheDocument();
    expect(screen.getByText('Carmen Tapia')).toBeInTheDocument();
  });

  it('renders an Individuales section when singles exist', () => {
    const zone: DeliveryZone = {
      zone: 'Sur',
      entregas: 1,
      groups: [],
      singles: [person('1', 'Ana López')],
    };
    render(<DeliveryZoneSection zone={zone} colorIndexOffset={0} />);
    expect(screen.getByText('Individuales')).toBeInTheDocument();
    expect(screen.getByText('Ana López')).toBeInTheDocument();
    expect(screen.getByText('1 cliente')).toBeInTheDocument();
  });

  it('does not render an Individuales section when there are no singles', () => {
    const zone: DeliveryZone = {
      zone: 'Sur',
      entregas: 1,
      groups: [{ groupToken: 'tok-1', members: [person('1', 'Carmen Tapia')] }],
      singles: [],
    };
    render(<DeliveryZoneSection zone={zone} colorIndexOffset={0} />);
    expect(screen.queryByText('Individuales')).not.toBeInTheDocument();
  });

  it('pluralizes singles count for more than one', () => {
    const zone: DeliveryZone = {
      zone: 'Sur',
      entregas: 2,
      groups: [],
      singles: [person('1', 'Ana López'), person('2', 'Zara Gomez')],
    };
    render(<DeliveryZoneSection zone={zone} colorIndexOffset={0} />);
    expect(screen.getByText('2 clientes')).toBeInTheDocument();
  });
});
