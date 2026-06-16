import { render, screen } from '@testing-library/react';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders label and title', () => {
    render(<PageHeader label="Directorio" title="Clientes" />);
    expect(screen.getByText('Directorio')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<PageHeader label="L" title="T" subtitle="13 activos" />);
    expect(screen.getByText('13 activos')).toBeInTheDocument();
  });

  it('does not render subtitle element when omitted', () => {
    render(<PageHeader label="L" title="T" />);
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('renders action slot when provided', () => {
    render(<PageHeader label="L" title="T" action={<button type="button">Agregar</button>} />);
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeInTheDocument();
  });

  it('does not render action wrapper when omitted', () => {
    render(<PageHeader label="L" title="T" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
