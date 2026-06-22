import { render, screen } from '@testing-library/react';
import { ReportNotice } from './ReportNotice';

describe('ReportNotice', () => {
  it('renders the message', () => {
    render(<ReportNotice>No hay entregas los fines de semana.</ReportNotice>);
    expect(screen.getByText('No hay entregas los fines de semana.')).toBeInTheDocument();
  });

  it('uses the design amber notice styling', () => {
    render(<ReportNotice>Mensaje</ReportNotice>);
    const el = screen.getByText('Mensaje');
    expect(el.className).toContain('bg-warn-bg');
    expect(el.className).toContain('rounded-[9px]');
  });
});
