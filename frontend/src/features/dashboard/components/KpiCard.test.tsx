import { render, screen } from '@testing-library/react';
import { KpiCard } from '@/features/dashboard/components/KpiCard';

describe('KpiCard', () => {
  it('shows the label', () => {
    render(
      <KpiCard
        icon="clipboard-check"
        iconBg="bg-olive-100"
        iconColor="text-olive-700"
        label="Activos"
        today={12}
      />,
    );
    expect(screen.getByText('Activos')).toBeInTheDocument();
  });

  it('shows a single value with its caption when tomorrow is not provided', () => {
    render(
      <KpiCard
        icon="motorcycle"
        iconBg="bg-olive-100"
        iconColor="text-olive-700"
        label="Delivery"
        today={9}
        singleCaption="Entregas hoy"
      />,
    );
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('Entregas hoy')).toBeInTheDocument();
    expect(screen.queryByText('Mañana')).not.toBeInTheDocument();
  });

  it('shows both today and tomorrow with Hoy/Mañana captions when tomorrow is provided', () => {
    render(
      <KpiCard
        icon="clipboard-check"
        iconBg="bg-olive-100"
        iconColor="text-olive-700"
        label="Activos"
        today={12}
        tomorrow={15}
      />,
    );
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Hoy')).toBeInTheDocument();
    expect(screen.getByText('Mañana')).toBeInTheDocument();
  });

  it('shows custom labels when todayLabel and tomorrowLabel are provided', () => {
    render(
      <KpiCard
        icon="clipboard-check"
        iconBg="bg-olive-100"
        iconColor="text-olive-700"
        label="Activos"
        today={12}
        tomorrow={15}
        todayLabel="lunes"
        tomorrowLabel="martes"
      />,
    );
    expect(screen.getByText('lunes')).toBeInTheDocument();
    expect(screen.getByText('martes')).toBeInTheDocument();
    expect(screen.queryByText('Hoy')).not.toBeInTheDocument();
  });
});
