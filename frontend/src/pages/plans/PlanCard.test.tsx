import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanCard } from './PlanCard';
import type { Plan } from '../../types/client';

const plan: Plan = {
  id: '1',
  name: 'Reductor',
  meals: ['breakfast', 'lunch'],
  price: 1450,
};

describe('PlanCard', () => {
  it('renders the plan name and price', () => {
    render(
      <PlanCard
        plan={plan}
        clientCount={3}
        allPrices={[1450]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByText('Reductor')).toBeInTheDocument();
    expect(screen.getByText('1.450')).toBeInTheDocument();
  });

  it('shows the included meal count label', () => {
    render(
      <PlanCard
        plan={plan}
        clientCount={3}
        allPrices={[1450]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByText('Tiempos incluidos · 2 de 8')).toBeInTheDocument();
  });

  it('renders a chip only for included meals', () => {
    render(
      <PlanCard
        plan={plan}
        clientCount={3}
        allPrices={[1450]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByText('Desayuno')).toBeInTheDocument();
    expect(screen.getByText('Almuerzo')).toBeInTheDocument();
    expect(screen.queryByText('Cena')).not.toBeInTheDocument();
  });

  it('shows singular client count label', () => {
    render(
      <PlanCard
        plan={plan}
        clientCount={1}
        allPrices={[1450]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByText('1 cliente activo')).toBeInTheDocument();
  });

  it('shows plural client count label', () => {
    render(
      <PlanCard
        plan={plan}
        clientCount={3}
        allPrices={[1450]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByText('3 clientes activos')).toBeInTheDocument();
  });

  it('calls onEdit when the edit button is clicked', async () => {
    const onEdit = jest.fn();
    render(
      <PlanCard
        plan={plan}
        clientCount={3}
        allPrices={[1450]}
        onEdit={onEdit}
        onDelete={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /editar plan/i }));
    expect(onEdit).toHaveBeenCalled();
  });

  it('calls onDelete when the delete button is clicked', async () => {
    const onDelete = jest.fn();
    render(
      <PlanCard
        plan={plan}
        clientCount={3}
        allPrices={[1450]}
        onEdit={jest.fn()}
        onDelete={onDelete}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /eliminar plan/i }));
    expect(onDelete).toHaveBeenCalled();
  });
});
