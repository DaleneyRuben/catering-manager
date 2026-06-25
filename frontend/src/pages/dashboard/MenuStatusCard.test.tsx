import { render, screen } from '@testing-library/react';
import { MenuStatusCard } from './MenuStatusCard';
import type { MenuStatus } from '../../types/dashboard';

const todayStatus: MenuStatus = { date: '2026-06-23', loaded: true };
const tomorrowStatus: MenuStatus = { date: '2026-06-24', loaded: false };

describe('MenuStatusCard', () => {
  it('shows the title', () => {
    render(<MenuStatusCard today={todayStatus} tomorrow={tomorrowStatus} />);
    expect(screen.getByText('Menú del día')).toBeInTheDocument();
  });

  it('shows "Cargado" tag when today is loaded', () => {
    render(<MenuStatusCard today={todayStatus} tomorrow={tomorrowStatus} />);
    expect(screen.getByText('Cargado')).toBeInTheDocument();
  });

  it('shows "Vacío" tag when tomorrow is not loaded', () => {
    render(<MenuStatusCard today={todayStatus} tomorrow={tomorrowStatus} />);
    expect(screen.getByText('Vacío')).toBeInTheDocument();
  });

  it('shows "Menú cargado" detail for loaded day', () => {
    render(<MenuStatusCard today={todayStatus} tomorrow={tomorrowStatus} />);
    expect(screen.getByText('Menú cargado')).toBeInTheDocument();
  });

  it('shows "Pendiente de cargar" detail for empty day', () => {
    render(<MenuStatusCard today={todayStatus} tomorrow={tomorrowStatus} />);
    expect(screen.getByText('Pendiente de cargar')).toBeInTheDocument();
  });

  it('shows the Hoy prefix with the formatted today date', () => {
    render(<MenuStatusCard today={todayStatus} tomorrow={tomorrowStatus} />);
    expect(screen.getByText(/Hoy · Martes 23\/06/)).toBeInTheDocument();
  });

  it('shows the Mañana prefix with the formatted tomorrow date', () => {
    render(<MenuStatusCard today={todayStatus} tomorrow={tomorrowStatus} />);
    expect(screen.getByText(/Mañana · Miércoles 24\/06/)).toBeInTheDocument();
  });

  it('shows two "Cargado" tags when both days are loaded', () => {
    const bothLoaded: MenuStatus = { date: '2026-06-24', loaded: true };
    render(<MenuStatusCard today={todayStatus} tomorrow={bothLoaded} />);
    expect(screen.getAllByText('Cargado')).toHaveLength(2);
  });
});
