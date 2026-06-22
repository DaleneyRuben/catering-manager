import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DayCard } from './DayCard';
import type { Menu } from '../../types/menu';

const emptyMenu: Menu = {
  id: '1',
  date: '2026-06-19',
  breakfast: null,
  morningSnack: null,
  salad: null,
  lunch: null,
  afternoonSnack: null,
  dinner: null,
  juice: null,
};

describe('DayCard', () => {
  it('shows Hoy label and the formatted date for today', () => {
    render(<DayCard isToday date="2026-06-19" menu={null} isWeekend={false} onOpen={jest.fn()} />);
    expect(screen.getByText('Hoy')).toBeInTheDocument();
    expect(screen.getByText('Viernes 19 de junio')).toBeInTheDocument();
  });

  it('shows Mañana label for the other day', () => {
    render(<DayCard isToday={false} date="2026-06-20" menu={null} isWeekend onOpen={jest.fn()} />);
    expect(screen.getByText('Mañana')).toBeInTheDocument();
  });

  it('shows the unloaded status with the count of filled meal times', () => {
    render(<DayCard isToday date="2026-06-19" menu={null} isWeekend={false} onOpen={jest.fn()} />);
    expect(screen.getByText('Aún sin menú cargado · 0 de 7 tiempos')).toBeInTheDocument();
  });

  it('shows the loaded status with the count of filled meal times', () => {
    render(
      <DayCard
        isToday
        date="2026-06-19"
        menu={{ ...emptyMenu, breakfast: 'Pan', lunch: 'Sopa' }}
        isWeekend={false}
        onOpen={jest.fn()}
      />,
    );
    expect(screen.getByText('Menú cargado · 2 de 7 tiempos')).toBeInTheDocument();
  });

  it('shows the weekend status and a non-interactive No disponible state', () => {
    render(<DayCard isToday date="2026-06-20" menu={null} isWeekend onOpen={jest.fn()} />);
    expect(screen.getByText('Fin de semana · sin entregas')).toBeInTheDocument();
    expect(screen.getByText('No disponible')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cargar menú/i })).not.toBeInTheDocument();
  });

  it('shows a Cargar menú button when there is no menu and it is not weekend', () => {
    render(<DayCard isToday date="2026-06-19" menu={null} isWeekend={false} onOpen={jest.fn()} />);
    expect(screen.getByRole('button', { name: /cargar menú/i })).toBeInTheDocument();
  });

  it('shows an Editar menú button when a menu already exists', () => {
    render(
      <DayCard
        isToday
        date="2026-06-19"
        menu={{ ...emptyMenu, breakfast: 'Pan' }}
        isWeekend={false}
        onOpen={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /editar menú/i })).toBeInTheDocument();
  });

  it('calls onOpen when the action button is clicked', async () => {
    const onOpen = jest.fn();
    render(<DayCard isToday date="2026-06-19" menu={null} isWeekend={false} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button', { name: /cargar menú/i }));
    expect(onOpen).toHaveBeenCalled();
  });
});
