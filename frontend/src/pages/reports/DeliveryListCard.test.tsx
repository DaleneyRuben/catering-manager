import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { checkIsWeekend } from '../../utils/devFlags';
import { downloadReport } from '../../utils/downloadReport';
import { DeliveryListCard } from './DeliveryListCard';

jest.mock('../../utils/devFlags', () => ({
  checkIsWeekend: jest.fn(),
}));

jest.mock('../../utils/downloadReport', () => ({
  downloadReport: jest.fn(),
}));

describe('DeliveryListCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkIsWeekend as jest.Mock).mockReturnValue(false);
    (downloadReport as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders the heading', () => {
    render(<DeliveryListCard />);
    expect(screen.getByRole('heading', { name: 'Lista de entrega' })).toBeInTheDocument();
  });

  it('renders Hoy and Mañana buttons', () => {
    render(<DeliveryListCard />);
    expect(screen.getByRole('button', { name: /hoy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mañana/i })).toBeInTheDocument();
  });

  it('shows weekend warning when the selected date is a weekend', () => {
    (checkIsWeekend as jest.Mock).mockReturnValue(true);
    render(<DeliveryListCard />);
    expect(screen.getByText('No hay entregas los fines de semana.')).toBeInTheDocument();
  });

  it('disables the download button on a weekend', () => {
    (checkIsWeekend as jest.Mock).mockReturnValue(true);
    render(<DeliveryListCard />);
    expect(screen.getByRole('button', { name: /descargar/i })).toBeDisabled();
  });

  it('calls downloadReport when the download button is clicked', async () => {
    render(<DeliveryListCard />);
    await userEvent.click(screen.getByRole('button', { name: /descargar/i }));
    expect(downloadReport).toHaveBeenCalled();
  });

  it('switches selection to Mañana when that button is clicked', async () => {
    render(<DeliveryListCard />);
    const manana = screen.getByRole('button', { name: /mañana/i });
    await userEvent.click(manana);
    expect(manana.className).toContain('bg-white');
  });

  it('shows error when download fails', async () => {
    (downloadReport as jest.Mock).mockRejectedValue(new Error('network'));
    render(<DeliveryListCard />);
    await userEvent.click(screen.getByRole('button', { name: /descargar/i }));
    expect(
      await screen.findByText('No se pudo generar el archivo. Intenta de nuevo.'),
    ).toBeInTheDocument();
  });
});
