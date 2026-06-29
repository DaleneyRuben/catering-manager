import { render, screen } from '@testing-library/react';
import { ClientHistorySummary } from '@/features/clients/components/detail/ClientHistorySummary';

describe('ClientHistorySummary', () => {
  it('shows the heading and description', () => {
    render(
      <ClientHistorySummary eventCount={5} planName="Hiperproteico" clientSince="2026-04-09" />,
    );
    expect(screen.getByText('Historial de actividad')).toBeInTheDocument();
    expect(screen.getByText(/cada cambio de plan, renovación y suspensión/i)).toBeInTheDocument();
  });

  it('shows the event count, plan name, and client since month/year', () => {
    render(
      <ClientHistorySummary eventCount={5} planName="Hiperproteico" clientSince="2026-04-09" />,
    );
    expect(screen.getByText('Eventos registrados')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Plan actual')).toBeInTheDocument();
    expect(screen.getByText('Hiperproteico')).toBeInTheDocument();
    expect(screen.getByText('Cliente desde')).toBeInTheDocument();
    expect(screen.getByText('Abr 2026')).toBeInTheDocument();
  });

  it('shows placeholders when there is no plan or history yet', () => {
    render(<ClientHistorySummary eventCount={0} planName={null} clientSince={null} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });
});
