import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addDays, format, getDay, startOfISOWeek } from 'date-fns';
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

function getWeekMonday(): string {
  const today = new Date();
  const dow = getDay(today);
  const monday = dow === 0 ? addDays(today, 1) : startOfISOWeek(today);
  return format(monday, 'yyyy-MM-dd');
}
const MONDAY = getWeekMonday();

function makeMenu(date: string, breakfast = 'Avena'): object {
  return {
    id: date,
    date,
    breakfast,
    morningSnack: null,
    salad: null,
    lunch: null,
    afternoonSnack: null,
    dinner: null,
    juice: null,
  };
}

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

  it('shows Esta semana section label', () => {
    render(<MenuImportPage />);
    expect(screen.getByText('Esta semana')).toBeInTheDocument();
  });

  it('shows two Cargar menú buttons when no menus exist', () => {
    render(<MenuImportPage />);
    expect(screen.getAllByRole('button', { name: /cargar menú/i })).toHaveLength(2);
  });

  it('shows weekend warning for today when today is a weekend', () => {
    (checkIsWeekend as jest.Mock).mockReturnValueOnce(true).mockReturnValue(false);
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

  it('shows edit button when today menu exists', () => {
    setupMenu({ menus: [makeMenu(TODAY)] });
    render(<MenuImportPage />);
    expect(screen.getByRole('button', { name: /editar menú/i })).toBeInTheDocument();
  });

  it('shows edit button when tomorrow menu exists', () => {
    setupMenu({ menus: [makeMenu(TOMORROW)] });
    render(<MenuImportPage />);
    expect(screen.getByRole('button', { name: /editar menú/i })).toBeInTheDocument();
  });

  it('shows meal row labels in week grid', () => {
    render(<MenuImportPage />);
    const grid = screen.getByTestId('week-grid');
    expect(within(grid).getByText('Desayuno')).toBeInTheDocument();
    expect(within(grid).getByText('Almuerzo')).toBeInTheDocument();
  });

  it('shows dashes in week grid for empty cells', () => {
    render(<MenuImportPage />);
    const grid = screen.getByTestId('week-grid');
    expect(within(grid).getAllByText('—').length).toBeGreaterThan(0);
  });

  it('shows meal value in week grid for a day that has a menu', () => {
    setupMenu({ menus: [makeMenu(MONDAY, 'Pancakes')] });
    render(<MenuImportPage />);
    const grid = screen.getByTestId('week-grid');
    expect(within(grid).getByText('Pancakes')).toBeInTheDocument();
  });
});
