import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addDays, format } from 'date-fns';
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
const TODAY = format(new Date(), 'yyyy-MM-dd');
const TOMORROW = format(addDays(new Date(), 1), 'yyyy-MM-dd');

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

  it('shows Hoy and Mañana section labels', () => {
    render(<MenuImportPage />);
    expect(screen.getByText('Hoy')).toBeInTheDocument();
    expect(screen.getByText('Mañana')).toBeInTheDocument();
  });

  it('shows empty state with Cargar menú buttons for both days when no menus exist', () => {
    render(<MenuImportPage />);
    expect(screen.getAllByRole('button', { name: /cargar menú/i })).toHaveLength(2);
  });

  it('shows weekend warning for today when today is a weekend', () => {
    (checkIsWeekend as jest.Mock).mockReturnValueOnce(true).mockReturnValueOnce(false);
    render(<MenuImportPage />);
    expect(screen.getByText('No hay entregas los fines de semana.')).toBeInTheDocument();
  });

  it('opens the form modal when Cargar menú is clicked', async () => {
    render(<MenuImportPage />);
    await userEvent.click(screen.getAllByRole('button', { name: /cargar menú/i })[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/desayuno/i)).toBeInTheDocument();
  });

  it('calls save when save button is clicked inside modal', async () => {
    render(<MenuImportPage />);
    await userEvent.click(screen.getAllByRole('button', { name: /cargar menú/i })[0]);
    await userEvent.click(screen.getByRole('button', { name: /guardar menú/i }));
    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ date: expect.any(String) }));
  });

  it('shows MenuCard with edit button when today menu exists', () => {
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
    expect(screen.getByText('Avena')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /editar menú/i })).toBeInTheDocument();
  });

  it('shows MenuCard for tomorrow when tomorrow menu exists', () => {
    setupMenu({
      menus: [
        {
          id: '2',
          date: TOMORROW,
          breakfast: 'Tostadas',
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
    expect(screen.getByText('Tostadas')).toBeInTheDocument();
  });
});
