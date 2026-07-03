import { render, screen } from '@testing-library/react';
import { ProductionCard } from '@/features/production/components/ProductionCard';
import type { ProductionSummary } from '@/features/production/types';

const weekdaySummary: ProductionSummary = {
  date: '2026-07-02',
  isDeliveryDay: true,
  total: 3,
  groups: {
    juice: ['Ana Flores'],
    lunchOnly: ['Lucía Navarro'],
    lunchAndDinner: ['Carlos Ríos'],
    full: [],
  },
};

const weekendSummary: ProductionSummary = {
  date: '2026-07-04',
  isDeliveryDay: false,
  total: 0,
  groups: { juice: [], lunchOnly: [], lunchAndDinner: [], full: [] },
};

describe('ProductionCard', () => {
  it('renders the title and the plural subtitle', () => {
    render(<ProductionCard summary={weekdaySummary} />);

    expect(screen.getByText('Clientes de mañana')).toBeInTheDocument();
    expect(screen.getByText('3 clientes a preparar')).toBeInTheDocument();
  });

  it('renders a singular subtitle for one client', () => {
    render(<ProductionCard summary={{ ...weekdaySummary, total: 1 }} />);

    expect(screen.getByText('1 cliente a preparar')).toBeInTheDocument();
  });

  it('renders the tomorrow badge with the long spanish date', () => {
    render(<ProductionCard summary={weekdaySummary} />);

    expect(screen.getByText('Mañana')).toBeInTheDocument();
    expect(screen.getByText('Jueves 2 de julio')).toBeInTheDocument();
  });

  it('renders the four group columns in design order', () => {
    render(<ProductionCard summary={weekdaySummary} />);

    const labels = ['Jugo', 'Almuerzo', 'Almuerzo y cena', 'Completo'].map(
      (label) => screen.getByText(label).textContent,
    );
    expect(labels).toEqual(['Jugo', 'Almuerzo', 'Almuerzo y cena', 'Completo']);
    expect(screen.getByText('Ana Flores')).toBeInTheDocument();
    expect(screen.getByText('Lucía Navarro')).toBeInTheDocument();
    expect(screen.getByText('Carlos Ríos')).toBeInTheDocument();
  });

  it('renders the weekend empty state instead of columns', () => {
    render(<ProductionCard summary={weekendSummary} />);

    expect(screen.getByText('No hay entregas mañana')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Los sábados y domingos no hay entregas. La producción se planifica de domingo a jueves para las entregas de lunes a viernes — vuelve el domingo para preparar el lunes.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Jugo')).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
