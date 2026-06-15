import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleGroup } from './ToggleGroup';

const options = ['Centro', 'Sur'] as const;

describe('ToggleGroup', () => {
  it('renders a button for each option', () => {
    render(<ToggleGroup options={options} value="Centro" onChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Centro' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sur' })).toBeInTheDocument();
  });

  it('applies selected class to the active option', () => {
    render(<ToggleGroup options={options} value="Centro" onChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Centro' }).className).toContain('bg-olive-700');
    expect(screen.getByRole('button', { name: 'Sur' }).className).not.toContain('bg-olive-700');
  });

  it('calls onChange with the clicked option', async () => {
    const onChange = jest.fn();
    render(<ToggleGroup options={options} value="Centro" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sur' }));
    expect(onChange).toHaveBeenCalledWith('Sur');
  });

  it('uses a custom selectedClassName when provided', () => {
    render(
      <ToggleGroup
        options={options}
        value="Sur"
        onChange={jest.fn()}
        selectedClassName="bg-red-500"
      />,
    );
    expect(screen.getByRole('button', { name: 'Sur' }).className).toContain('bg-red-500');
  });
});
