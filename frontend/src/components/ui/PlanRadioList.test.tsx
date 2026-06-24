import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanRadioList } from './PlanRadioList';
import type { Plan } from '../../types/client';

const plans: Plan[] = [
  { id: '1', name: 'Almuerzo', price: 640, meals: ['lunch'] },
  { id: '2', name: 'Reductor', price: 1450, meals: ['breakfast', 'lunch', 'dinner'] },
];

describe('PlanRadioList', () => {
  it('renders a row per plan with name and price', () => {
    render(<PlanRadioList plans={plans} selectedId={undefined} onSelect={jest.fn()} />);
    expect(screen.getByText('Almuerzo')).toBeInTheDocument();
    expect(screen.getByText('Reductor')).toBeInTheDocument();
    expect(screen.getByText('640')).toBeInTheDocument();
    expect(screen.getByText('1.450')).toBeInTheDocument();
  });

  it('marks the selected plan row', () => {
    render(<PlanRadioList plans={plans} selectedId="2" onSelect={jest.fn()} />);
    const rows = screen.getAllByRole('button');
    expect(rows[1].className).toContain('border-olive-700');
    expect(rows[0].className).not.toContain('border-olive-700');
  });

  it('calls onSelect with the plan id when clicked', async () => {
    const onSelect = jest.fn();
    render(<PlanRadioList plans={plans} selectedId={undefined} onSelect={onSelect} />);
    await userEvent.click(screen.getByText('Almuerzo'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });

  it('shows meal count and tier label', () => {
    render(<PlanRadioList plans={plans} selectedId={undefined} onSelect={jest.fn()} />);
    expect(screen.getByText(/1 tiempos/)).toBeInTheDocument();
    expect(screen.getByText(/3 tiempos/)).toBeInTheDocument();
  });
});
