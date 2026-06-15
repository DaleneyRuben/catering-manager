import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { checkIsWeekend } from '../utils/devFlags';
import { useMenu } from '../hooks/useMenu';
import { MenuImportPage } from './MenuImportPage';

jest.mock('../hooks/useMenu', () => ({
  useMenu: jest.fn(),
}));

jest.mock('../utils/devFlags', () => ({
  checkIsWeekend: jest.fn(),
}));

const mockSave = jest.fn();

function setupMenu(overrides: object = {}) {
  (useMenu as jest.Mock).mockReturnValue({
    menus: [],
    isLoading: false,
    isSaving: false,
    save: mockSave,
    ...overrides,
  });
}

describe('MenuImportPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue(undefined);
    (checkIsWeekend as jest.Mock).mockReturnValue(false);
    setupMenu();
  });

  it('renders the heading', () => {
    render(<MenuImportPage />);
    expect(screen.getByRole('heading', { name: 'Menú del día' })).toBeInTheDocument();
  });

  it('renders Hoy and Mañana tab buttons', () => {
    render(<MenuImportPage />);
    expect(screen.getByRole('button', { name: /hoy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mañana/i })).toBeInTheDocument();
  });

  it('shows meal fields on a weekday', () => {
    render(<MenuImportPage />);
    expect(screen.getByLabelText(/desayuno/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/almuerzo/i)).toBeInTheDocument();
  });

  it('shows weekend warning when selected date is a weekend', () => {
    (checkIsWeekend as jest.Mock).mockReturnValue(true);
    render(<MenuImportPage />);
    expect(screen.getByText('No hay entregas los fines de semana.')).toBeInTheDocument();
  });

  it('hides meal fields on a weekend', () => {
    (checkIsWeekend as jest.Mock).mockReturnValue(true);
    render(<MenuImportPage />);
    expect(screen.queryByLabelText(/desayuno/i)).not.toBeInTheDocument();
  });

  it('calls save when save button is clicked', async () => {
    render(<MenuImportPage />);
    await userEvent.click(screen.getByRole('button', { name: /guardar menú/i }));
    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ date: expect.any(String) }));
  });

  it('shows confirmation message after saving', async () => {
    render(<MenuImportPage />);
    await userEvent.click(screen.getByRole('button', { name: /guardar menú/i }));
    expect(await screen.findByText('Menú guardado correctamente')).toBeInTheDocument();
  });
});
