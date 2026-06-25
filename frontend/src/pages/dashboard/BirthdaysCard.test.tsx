import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BirthdaysCard } from './BirthdaysCard';
import type { BirthdayPerson } from '../../types/dashboard';

const person = (overrides: Partial<BirthdayPerson> = {}): BirthdayPerson => ({
  id: '1',
  name: 'Jorge Rengel',
  dateOfBirth: '1990-06-06',
  isToday: false,
  ...overrides,
});

describe('BirthdaysCard', () => {
  it('shows the title and month/count subtitle', () => {
    render(<BirthdaysCard birthdays={[person()]} monthLabel="Junio" />);
    expect(screen.getByText('Cumpleaños')).toBeInTheDocument();
    expect(screen.getByText('Junio · 1 clientes')).toBeInTheDocument();
  });

  it('renders each birthday with a short date', () => {
    render(
      <BirthdaysCard birthdays={[person({ dateOfBirth: '1990-06-06' })]} monthLabel="Junio" />,
    );
    expect(screen.getByText('Jorge Rengel')).toBeInTheDocument();
    expect(screen.getByText('06/06')).toBeInTheDocument();
  });

  it('shows only the first 5 birthdays by default with a "ver más" toggle', async () => {
    const birthdays = Array.from({ length: 7 }, (_, i) =>
      person({ id: String(i), name: `Cliente ${i}`, dateOfBirth: `1990-06-0${i + 1}` }),
    );
    render(<BirthdaysCard birthdays={birthdays} monthLabel="Junio" />);

    expect(screen.getByText('Cliente 0')).toBeInTheDocument();
    expect(screen.getByText('Cliente 4')).toBeInTheDocument();
    expect(screen.queryByText('Cliente 5')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /ver 2 más/i }));

    expect(screen.getByText('Cliente 5')).toBeInTheDocument();
    expect(screen.getByText('Cliente 6')).toBeInTheDocument();
  });

  it('does not show a toggle when there are 5 or fewer birthdays', () => {
    render(<BirthdaysCard birthdays={[person()]} monthLabel="Junio" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
