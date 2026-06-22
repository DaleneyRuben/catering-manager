import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { checkIsWeekend } from '../../utils/devFlags';
import { downloadReport } from '../../utils/downloadReport';
import { useMenu } from '../../hooks/useMenu';
import { KitchenReportCard } from './KitchenReportCard';

jest.mock('../../utils/devFlags', () => ({
  checkIsWeekend: jest.fn(),
}));

jest.mock('../../utils/downloadReport', () => ({
  downloadReport: jest.fn(),
}));

jest.mock('../../hooks/useMenu', () => ({
  useMenu: jest.fn(),
}));

const todayIso = format(new Date(), 'yyyy-MM-dd');

describe('KitchenReportCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkIsWeekend as jest.Mock).mockReturnValue(false);
    (downloadReport as jest.Mock).mockResolvedValue(undefined);
    (useMenu as jest.Mock).mockReturnValue({ menus: [{ date: todayIso }] });
  });

  it('renders the heading', () => {
    render(<KitchenReportCard />);
    expect(screen.getByRole('heading', { name: 'Informe de cocina' })).toBeInTheDocument();
  });

  it('renders Hoy and Mañana buttons', () => {
    render(<KitchenReportCard />);
    expect(screen.getByRole('button', { name: /hoy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mañana/i })).toBeInTheDocument();
  });

  it('shows weekend warning when selected date is a weekend', () => {
    (checkIsWeekend as jest.Mock).mockReturnValue(true);
    render(<KitchenReportCard />);
    expect(screen.getByText('No hay entregas los fines de semana.')).toBeInTheDocument();
  });

  it('shows no-menu warning when there is no menu for the selected date', () => {
    (useMenu as jest.Mock).mockReturnValue({ menus: [] });
    render(<KitchenReportCard />);
    expect(screen.getByText('No hay menú registrado para esta fecha.')).toBeInTheDocument();
  });

  it('calls downloadReport when the download button is clicked', async () => {
    render(<KitchenReportCard />);
    await userEvent.click(screen.getByRole('button', { name: /descargar/i }));
    expect(downloadReport).toHaveBeenCalled();
  });

  it('switches selection to Mañana when that button is clicked', async () => {
    render(<KitchenReportCard />);
    const manana = screen.getByRole('button', { name: /mañana/i });
    await userEvent.click(manana);
    expect(manana.className).toContain('bg-olive-100');
  });

  it('shows error when download fails', async () => {
    (downloadReport as jest.Mock).mockRejectedValue(new Error('network'));
    render(<KitchenReportCard />);
    await userEvent.click(screen.getByRole('button', { name: /descargar/i }));
    expect(
      await screen.findByText('No se pudo generar el archivo. Intenta de nuevo.'),
    ).toBeInTheDocument();
  });
});
