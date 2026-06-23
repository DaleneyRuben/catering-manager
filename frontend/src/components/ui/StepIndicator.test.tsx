import { render, screen } from '@testing-library/react';
import { StepIndicator } from './StepIndicator';

const STEPS = ['Identidad', 'Restricciones', 'Plan', 'Confirmar'];

describe('StepIndicator', () => {
  it('renders a circle with the step number for upcoming steps', () => {
    render(<StepIndicator steps={STEPS} current={1} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders a checkmark instead of a number for done steps', () => {
    render(<StepIndicator steps={STEPS} current={3} />);
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders all step labels', () => {
    render(<StepIndicator steps={STEPS} current={1} />);
    STEPS.forEach((label) => expect(screen.getByText(label)).toBeInTheDocument());
  });

  it('makes the active step label bold and dark', () => {
    render(<StepIndicator steps={STEPS} current={2} />);
    expect(screen.getByText('Restricciones')).toHaveClass('font-bold', 'text-ink');
  });

  it('makes done step labels semibold', () => {
    render(<StepIndicator steps={STEPS} current={2} />);
    expect(screen.getByText('Identidad')).toHaveClass('font-semibold', 'text-ink-2');
  });

  it('makes future step labels muted', () => {
    render(<StepIndicator steps={STEPS} current={2} />);
    expect(screen.getByText('Plan')).toHaveClass('font-medium', 'text-empty-text');
  });
});
