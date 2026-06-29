import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanModal } from '@/features/plans/components/PlanModal';
import type { Plan } from '@/features/clients/types';

const existingPlan: Plan = {
  id: '1',
  name: 'Reductor',
  meals: ['breakfast', 'lunch'],
  price: 1450,
};

describe('PlanModal — create mode', () => {
  it('renders "Nuevo plan" heading', () => {
    render(<PlanModal mode="create" isSaving={false} onSave={jest.fn()} onClose={jest.fn()} />);
    expect(screen.getByText('Nuevo plan')).toBeInTheDocument();
  });

  it('starts with an empty name field', () => {
    render(<PlanModal mode="create" isSaving={false} onSave={jest.fn()} onClose={jest.fn()} />);
    expect(screen.getByLabelText(/nombre del plan/i)).toHaveValue('');
  });

  it('calls onSave with the draft and then onClose when Crear plan is clicked', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(<PlanModal mode="create" isSaving={false} onSave={onSave} onClose={onClose} />);

    await userEvent.type(screen.getByLabelText(/nombre del plan/i), 'Ligero');
    await userEvent.click(screen.getByRole('button', { name: /crear plan/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ligero' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe('PlanModal — edit mode', () => {
  it('renders "Editar plan" heading with plan name and client count', () => {
    render(
      <PlanModal
        mode="edit"
        plan={existingPlan}
        clientCount={3}
        isSaving={false}
        onSave={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByText('Editar plan')).toBeInTheDocument();
    expect(screen.getByText('Reductor · 3 clientes activos')).toBeInTheDocument();
  });

  it('shows singular client count label', () => {
    render(
      <PlanModal
        mode="edit"
        plan={existingPlan}
        clientCount={1}
        isSaving={false}
        onSave={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByText('Reductor · 1 cliente activo')).toBeInTheDocument();
  });

  it('prefills the name field from the plan prop', () => {
    render(
      <PlanModal
        mode="edit"
        plan={existingPlan}
        clientCount={3}
        isSaving={false}
        onSave={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByLabelText(/nombre del plan/i)).toHaveValue('Reductor');
  });

  it('calls onSave with the updated draft and then onClose when Guardar cambios is clicked', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(
      <PlanModal
        mode="edit"
        plan={existingPlan}
        clientCount={3}
        isSaving={false}
        onSave={onSave}
        onClose={onClose}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Reductor' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
