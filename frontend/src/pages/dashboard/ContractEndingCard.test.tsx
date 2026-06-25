import { render, screen } from '@testing-library/react';
import { ContractEndingCard } from './ContractEndingCard';
import type { ContractEndingPerson } from '../../types/dashboard';

const person = (overrides: Partial<ContractEndingPerson> = {}): ContractEndingPerson => ({
  id: '1',
  name: 'Alejandra Cabrera',
  plan: 'Reductor',
  date: '2026-06-25',
  ...overrides,
});

describe('ContractEndingCard', () => {
  it('shows the title', () => {
    render(<ContractEndingCard today={[]} tomorrow={[]} />);
    expect(screen.getByText('Terminan contrato')).toBeInTheDocument();
  });

  it('renders a person ending today with name, plan, and short date', () => {
    render(<ContractEndingCard today={[person()]} tomorrow={[]} />);
    expect(screen.getByText('Alejandra Cabrera')).toBeInTheDocument();
    expect(screen.getByText('Reductor')).toBeInTheDocument();
    expect(screen.getByText('25/06')).toBeInTheDocument();
  });

  it('renders a person ending tomorrow', () => {
    render(
      <ContractEndingCard
        today={[]}
        tomorrow={[person({ id: '2', name: 'Richard Rios', date: '2026-06-26' })]}
      />,
    );
    expect(screen.getByText('Richard Rios')).toBeInTheDocument();
    expect(screen.getByText('26/06')).toBeInTheDocument();
  });

  it('shows an empty message when no contracts end today', () => {
    render(<ContractEndingCard today={[]} tomorrow={[person()]} />);
    expect(screen.getAllByText('Sin contratos por terminar')).toHaveLength(1);
  });
});
