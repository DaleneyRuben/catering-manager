import { render, screen } from '@testing-library/react';
import { WeeklyCountsCard } from '@/features/production/components/WeeklyCountsCard';
import type { WeeklyCounts } from '@/features/production/types';

const weeklyCounts: WeeklyCounts = {
  weekStart: '2026-06-29',
  weekEnd: '2026-07-03',
  days: [
    { date: '2026-06-29', count: 10 },
    { date: '2026-06-30', count: 11 },
    { date: '2026-07-01', count: 12 },
    { date: '2026-07-02', count: 9 },
    { date: '2026-07-03', count: 8 },
  ],
};

describe('WeeklyCountsCard', () => {
  it('renders the title, static subtitle, and week range badge', () => {
    render(<WeeklyCountsCard weeklyCounts={weeklyCounts} today="2026-07-01" />);

    expect(screen.getByText('Clientes activos por día')).toBeInTheDocument();
    expect(screen.getByText('Clientes activos de lunes a viernes')).toBeInTheDocument();
    expect(screen.getByText('Semana')).toBeInTheDocument();
    expect(screen.getByText('29 – 3 jul')).toBeInTheDocument();
  });

  it('renders one cell per weekday with its label and count', () => {
    render(<WeeklyCountsCard weeklyCounts={weeklyCounts} today="2026-07-01" />);

    expect(screen.getByText('Lun')).toBeInTheDocument();
    expect(screen.getByText('Mar')).toBeInTheDocument();
    expect(screen.getByText('Mié')).toBeInTheDocument();
    expect(screen.getByText('Jue')).toBeInTheDocument();
    expect(screen.getByText('Vie')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getAllByText('activos')).toHaveLength(5);
  });

  it('shows the Hoy badge only on the cell matching the today prop', () => {
    render(<WeeklyCountsCard weeklyCounts={weeklyCounts} today="2026-07-01" />);

    expect(screen.getAllByText('Hoy')).toHaveLength(1);
  });

  it('shows no Hoy badge when today falls outside the week (e.g. weekend)', () => {
    render(<WeeklyCountsCard weeklyCounts={weeklyCounts} today="2026-07-04" />);

    expect(screen.queryByText('Hoy')).not.toBeInTheDocument();
  });
});
