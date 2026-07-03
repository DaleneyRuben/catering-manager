import { render, screen } from '@testing-library/react';
import { ProductionColumn } from '@/features/production/components/ProductionColumn';

describe('ProductionColumn', () => {
  it('renders the label and the client count chip', () => {
    render(<ProductionColumn label="Almuerzo" names={['Ana Flores', 'Carlos Ríos']} />);

    expect(screen.getByText('Almuerzo')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders one row per client name', () => {
    render(<ProductionColumn label="Jugo" names={['Ana Flores', 'Carlos Ríos', 'Zoe Vargas']} />);

    expect(screen.getByText('Ana Flores')).toBeInTheDocument();
    expect(screen.getByText('Carlos Ríos')).toBeInTheDocument();
    expect(screen.getByText('Zoe Vargas')).toBeInTheDocument();
  });

  it('renders the empty state when there are no clients', () => {
    render(<ProductionColumn label="Completo" names={[]} />);

    expect(screen.getByText('Sin clientes')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
