import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealRow } from '@/features/plans/components/MealRow';

describe('MealRow', () => {
  it('renders the meal label', () => {
    render(<MealRow mealKey="breakfast" included={false} onToggle={jest.fn()} />);
    expect(screen.getByText('Desayuno')).toBeInTheDocument();
  });

  it('exposes checked state via aria-checked', () => {
    render(<MealRow mealKey="breakfast" included onToggle={jest.fn()} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });

  it('exposes unchecked state via aria-checked', () => {
    render(<MealRow mealKey="breakfast" included={false} onToggle={jest.fn()} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onToggle with the meal key when clicked', async () => {
    const onToggle = jest.fn();
    render(<MealRow mealKey="lunch" included={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('lunch');
  });
});
