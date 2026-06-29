import { render, screen } from '@testing-library/react';
import type { Menu } from '../types';
import { WeekGrid } from './WeekGrid';

const weekDays = ['2026-06-29', '2026-06-30', '2026-07-01', '2026-07-02', '2026-07-03'];

const menus: Menu[] = [
  {
    id: '1',
    date: '2026-06-29',
    breakfast: 'Avena con frutas',
    morningSnack: null,
    salad: null,
    lunch: 'Pollo a la plancha',
    afternoonSnack: null,
    dinner: null,
    juice: null,
  },
];

it('renders the week grid container', () => {
  render(<WeekGrid weekDays={weekDays} menus={[]} today="2026-06-29" />);
  expect(screen.getByTestId('week-grid')).toBeInTheDocument();
});

it('renders weekday column headers', () => {
  render(<WeekGrid weekDays={weekDays} menus={[]} today="2026-06-29" />);
  expect(screen.getByText('Lunes')).toBeInTheDocument();
  expect(screen.getByText('Viernes')).toBeInTheDocument();
});

it('renders meal row labels', () => {
  render(<WeekGrid weekDays={weekDays} menus={[]} today="2026-06-29" />);
  expect(screen.getByText('Desayuno')).toBeInTheDocument();
  expect(screen.getByText('Almuerzo')).toBeInTheDocument();
});

it('shows menu content for a populated day', () => {
  render(<WeekGrid weekDays={weekDays} menus={menus} today="2026-06-29" />);
  expect(screen.getByText('Avena con frutas')).toBeInTheDocument();
  expect(screen.getByText('Pollo a la plancha')).toBeInTheDocument();
});

it('shows em dash for empty meal slots', () => {
  render(<WeekGrid weekDays={weekDays} menus={[]} today="2026-06-29" />);
  // 7 meal fields × 5 days = 35 empty slots
  expect(screen.getAllByText('—').length).toBe(35);
});
