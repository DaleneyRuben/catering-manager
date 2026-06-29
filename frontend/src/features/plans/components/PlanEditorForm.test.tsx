import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanEditorForm } from './PlanEditorForm';
import type { PlanDraft } from '@/features/plans/types';

const baseDraft: PlanDraft = { name: 'Completo', meals: ['breakfast', 'lunch'], price: '1200' };

it('renders the name and price inputs', () => {
  render(<PlanEditorForm draft={baseDraft} setDraft={jest.fn()} />);
  expect(screen.getByLabelText(/nombre del plan/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/precio/i)).toBeInTheDocument();
});

it('displays the current draft name value', () => {
  render(<PlanEditorForm draft={baseDraft} setDraft={jest.fn()} />);
  expect(screen.getByLabelText(/nombre del plan/i)).toHaveValue('Completo');
});

it('calls setDraft with updated name when name input changes', async () => {
  const setDraft = jest.fn();
  const emptyNameDraft: PlanDraft = { name: '', meals: ['breakfast', 'lunch'], price: '1200' };
  render(<PlanEditorForm draft={emptyNameDraft} setDraft={setDraft} />);
  await userEvent.type(screen.getByLabelText(/nombre del plan/i), 'L');
  expect(setDraft).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'L' }));
});

it('calls setDraft toggling meal when MealRow is clicked', async () => {
  const setDraft = jest.fn();
  render(<PlanEditorForm draft={baseDraft} setDraft={setDraft} />);
  await userEvent.click(screen.getByRole('checkbox', { name: /desayuno/i }));
  expect(setDraft).toHaveBeenCalledWith(expect.objectContaining({ meals: ['lunch'] }));
});

it('renders meal rows for all meal types', () => {
  render(<PlanEditorForm draft={baseDraft} setDraft={jest.fn()} />);
  expect(screen.getByRole('checkbox', { name: /almuerzo/i })).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: /cena/i })).toBeInTheDocument();
});
