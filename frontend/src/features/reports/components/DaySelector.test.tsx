import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DaySelector } from '@/features/reports/components/DaySelector';

describe('DaySelector', () => {
  it('renders Hoy and Mañana with their date labels', () => {
    render(
      <DaySelector
        selected="today"
        onSelect={jest.fn()}
        dateLabel={(opt) => (opt === 'today' ? '19/06' : '20/06')}
      />,
    );
    expect(screen.getByRole('button', { name: /hoy.*19\/06/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mañana.*20\/06/i })).toBeInTheDocument();
  });

  it('styles the selected option with the olive selected state', () => {
    render(<DaySelector selected="today" onSelect={jest.fn()} dateLabel={() => '19/06'} />);
    const hoy = screen.getByRole('button', { name: /hoy/i });
    expect(hoy.className).toContain('bg-olive-100');
    expect(hoy.className).toContain('text-olive-700');
  });

  it('styles the unselected option as a plain white border button', () => {
    render(<DaySelector selected="today" onSelect={jest.fn()} dateLabel={() => '19/06'} />);
    const manana = screen.getByRole('button', { name: /mañana/i });
    expect(manana.className).toContain('bg-white');
    expect(manana.className).toContain('text-muted');
  });

  it('calls onSelect with the clicked option', async () => {
    const onSelect = jest.fn();
    render(<DaySelector selected="today" onSelect={onSelect} dateLabel={() => '19/06'} />);
    await userEvent.click(screen.getByRole('button', { name: /mañana/i }));
    expect(onSelect).toHaveBeenCalledWith('tomorrow');
  });
});
