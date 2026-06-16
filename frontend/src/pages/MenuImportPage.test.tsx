import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addDays, format } from 'date-fns';
import { checkIsWeekend } from '../utils/devFlags';
import { useMenu } from '../hooks/useMenu';
import { MenuImportPage } from './MenuImportPage';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const TOMORROW = format(addDays(new Date(), 1), 'yyyy-MM-dd');

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

  it('shows empty state with Cargar menú button when no menu exists', () => {
    render(<MenuImportPage />);
    expect(screen.getByText(/no hay menú cargado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cargar menú/i })).toBeInTheDocument();
  });

  it('shows weekend warning when selected date is a weekend', () => {
    (checkIsWeekend as jest.Mock).mockReturnValue(true);
    render(<MenuImportPage />);
    expect(screen.getByText('No hay entregas los fines de semana.')).toBeInTheDocument();
  });

  it('hides empty state on a weekend', () => {
    (checkIsWeekend as jest.Mock).mockReturnValue(true);
    render(<MenuImportPage />);
    expect(screen.queryByRole('button', { name: /cargar menú/i })).not.toBeInTheDocument();
  });

  it('opens the form modal when Cargar menú is clicked', async () => {
    render(<MenuImportPage />);
    await userEvent.click(screen.getByRole('button', { name: /cargar menú/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/desayuno/i)).toBeInTheDocument();
  });

  it('calls save when save button is clicked inside modal', async () => {
    render(<MenuImportPage />);
    await userEvent.click(screen.getByRole('button', { name: /cargar menú/i }));
    await userEvent.click(screen.getByRole('button', { name: /guardar menú/i }));
    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ date: expect.any(String) }));
  });

  it('updates the draft when a meal field is typed in', async () => {
    render(<MenuImportPage />);
    await userEvent.click(screen.getByRole('button', { name: /cargar menú/i }));
    const input = screen.getByLabelText(/desayuno/i);
    await userEvent.type(input, 'Avena');
    expect(input).toHaveValue('Avena');
  });

  it('switches to Mañana when that button is clicked', async () => {
    render(<MenuImportPage />);
    const manana = screen.getByRole('button', { name: /mañana/i });
    await userEvent.click(manana);
    expect(manana.className).toContain('bg-olive-800');
  });

  it('shows menu content for the other day (tomorrow) when it exists', () => {
    setupMenu({
      menus: [
        {
          id: '1',
          date: TOMORROW,
          breakfast: 'Avena',
          lunch: 'Arroz',
          morningSnack: null,
          salad: null,
          afternoonSnack: null,
          dinner: null,
          juice: null,
        },
      ],
    });
    render(<MenuImportPage />);
    expect(screen.getByText('Avena')).toBeInTheDocument();
  });

  it('shows pencil edit button when menu exists for selected date', () => {
    setupMenu({
      menus: [
        {
          id: '1',
          date: TODAY,
          breakfast: 'Avena',
          morningSnack: null,
          salad: null,
          lunch: null,
          afternoonSnack: null,
          dinner: null,
          juice: null,
        },
      ],
    });
    render(<MenuImportPage />);
    expect(screen.getByRole('button', { name: /editar menú/i })).toBeInTheDocument();
  });
});
