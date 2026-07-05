import { render, screen } from '@testing-library/react';
import { MenuStatusCard } from '@/features/dashboard/components/MenuStatusCard';
import type { MenuStatus } from '@/features/dashboard/types';

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

  it('shows the Hoy prefix with the short date by default', () => {
    render(<MenuStatusCard today={todayStatus} tomorrow={tomorrowStatus} />);
    expect(screen.getByText(/Hoy · 23\/06/)).toBeInTheDocument();
  });

  it('shows the Mañana prefix with the short date by default', () => {
    render(<MenuStatusCard today={todayStatus} tomorrow={tomorrowStatus} />);
    expect(screen.getByText(/Mañana · 24\/06/)).toBeInTheDocument();
  });

  it('shows custom labels when todayLabel and tomorrowLabel are provided', () => {
    render(
      <MenuStatusCard
        today={todayStatus}
        tomorrow={tomorrowStatus}
        todayLabel="Lunes"
        tomorrowLabel="Martes"
      />,
    );
    expect(screen.getByText(/Lunes · 23\/06/)).toBeInTheDocument();
    expect(screen.getByText(/Martes · 24\/06/)).toBeInTheDocument();
  });

  it('shows two "Cargado" tags when both days are loaded', () => {
    const bothLoaded: MenuStatus = { date: '2026-06-24', loaded: true };
    render(<MenuStatusCard today={todayStatus} tomorrow={bothLoaded} />);
    expect(screen.getAllByText('Cargado')).toHaveLength(2);
  });

  it('applies the loaded background token to a loaded row', () => {
    render(<MenuStatusCard today={todayStatus} tomorrow={tomorrowStatus} />);
    expect(screen.getByText('Menú cargado').closest('div.border')).toHaveClass('bg-menu-loaded-bg');
  });

  it('applies the empty background token to an unloaded row', () => {
    render(<MenuStatusCard today={todayStatus} tomorrow={tomorrowStatus} />);
    expect(screen.getByText('Pendiente de cargar').closest('div.border')).toHaveClass(
      'bg-menu-empty-bg',
    );
  });
});
