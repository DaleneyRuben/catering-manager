import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { checkIsWeekend } from '@/utils/devFlags';
import { downloadReport } from '@/utils/downloadReport';
import { KitchenReportCard } from '@/features/reports/components/KitchenReportCard';
import type { Menu } from '@/features/menu/types';

jest.mock('@/utils/devFlags', () => ({
  checkIsWeekend: jest.fn(),
}));

jest.mock('@/utils/downloadReport', () => ({
  downloadReport: jest.fn(),
}));

const todayIso = format(new Date(), 'yyyy-MM-dd');
const menusWithToday = [{ date: todayIso }] as Menu[];

describe('KitchenReportCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkIsWeekend as jest.Mock).mockReturnValue(false);
    (downloadReport as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders the heading', () => {
    render(<KitchenReportCard menus={menusWithToday} />);
    expect(screen.getByRole('heading', { name: 'Informe de cocina' })).toBeInTheDocument();
  });

  it('renders Hoy and Mañana buttons', () => {
    render(<KitchenReportCard menus={menusWithToday} />);
    expect(screen.getByRole('button', { name: /hoy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mañana/i })).toBeInTheDocument();
  });

  it('shows weekend warning when selected date is a weekend', () => {
    (checkIsWeekend as jest.Mock).mockReturnValue(true);
    render(<KitchenReportCard menus={menusWithToday} />);
    expect(screen.getByText('No hay entregas los fines de semana.')).toBeInTheDocument();
  });

  it('shows no-menu warning when there is no menu for the selected date', () => {
    render(<KitchenReportCard menus={[]} />);
    expect(screen.getByText('No hay menú registrado para esta fecha.')).toBeInTheDocument();
  });

  it('calls downloadReport when the download button is clicked', async () => {
    render(<KitchenReportCard menus={menusWithToday} />);
    await userEvent.click(screen.getByRole('button', { name: /descargar/i }));
    expect(downloadReport).toHaveBeenCalled();
  });

  it('switches selection to Mañana when that button is clicked', async () => {
    render(<KitchenReportCard menus={menusWithToday} />);
    const manana = screen.getByRole('button', { name: /mañana/i });
    await userEvent.click(manana);
    expect(manana.className).toContain('bg-olive-100');
  });

  it('shows error when download fails', async () => {
    (downloadReport as jest.Mock).mockRejectedValue(new Error('network'));
    render(<KitchenReportCard menus={menusWithToday} />);
    await userEvent.click(screen.getByRole('button', { name: /descargar/i }));
    expect(
      await screen.findByText('No se pudo generar el archivo. Intenta de nuevo.'),
    ).toBeInTheDocument();
  });
});
