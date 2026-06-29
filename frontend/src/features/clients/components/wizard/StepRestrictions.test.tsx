import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepRestrictions } from './StepRestrictions';
import type { RestrictionsState } from '@/features/clients/types';

const baseValue: RestrictionsState = { restrictions: [], underlyingDiseases: [] };

it('renders disease pills', () => {
  render(<StepRestrictions value={baseValue} onChange={jest.fn()} />);
  expect(screen.getByRole('button', { name: 'Diabetes' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Hipertensión' })).toBeInTheDocument();
});

it('disease pills start unpressed', () => {
  render(<StepRestrictions value={baseValue} onChange={jest.fn()} />);
  expect(screen.getByRole('button', { name: 'Diabetes' })).toHaveAttribute('aria-pressed', 'false');
});

it('calls onChange with toggled disease when pill is clicked', async () => {
  const onChange = jest.fn();
  render(<StepRestrictions value={baseValue} onChange={onChange} />);
  await userEvent.click(screen.getByRole('button', { name: 'Diabetes' }));
  expect(onChange).toHaveBeenCalledWith({ underlyingDiseases: ['Diabetes'] });
});

it('calls onChange to deselect a disease that is already selected', async () => {
  const onChange = jest.fn();
  const value: RestrictionsState = { restrictions: [], underlyingDiseases: ['Diabetes'] };
  render(<StepRestrictions value={value} onChange={onChange} />);
  expect(screen.getByRole('button', { name: 'Diabetes' })).toHaveAttribute('aria-pressed', 'true');
  await userEvent.click(screen.getByRole('button', { name: 'Diabetes' }));
  expect(onChange).toHaveBeenCalledWith({ underlyingDiseases: [] });
});

it('calls onChange with new restriction when tag is added', async () => {
  const onChange = jest.fn();
  render(<StepRestrictions value={baseValue} onChange={onChange} />);
  const input = screen.getByPlaceholderText(/lácteos/i);
  await userEvent.type(input, 'Maní');
  await userEvent.keyboard('{Enter}');
  expect(onChange).toHaveBeenCalledWith({ restrictions: ['Maní'] });
});
