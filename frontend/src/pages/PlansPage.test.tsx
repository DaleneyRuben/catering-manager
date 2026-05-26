import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import api from '../services/api';
import { PlansPage } from './PlansPage';

jest.mock('../services/api', () => ({
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));
const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPatch = api.patch as jest.Mock;
const mockDelete = api.delete as jest.Mock;

const mockPlan1 = {
  id: 1,
  name: 'Completo',
  meals: ['breakfast', 'lunch', 'dinner'],
  price: 1200,
  discount: 0,
};
const mockPlan2 = {
  id: 2,
  name: 'Mediodía',
  meals: ['lunch'],
  price: 800,
  discount: 0,
};

function setupMocks(plans = [mockPlan1, mockPlan2]) {
  mockGet.mockImplementation((url: string) => {
    if (url === '/plans') return Promise.resolve({ data: { data: plans } });
    if (url === '/clients') return Promise.resolve({ data: { data: [] } });
    return Promise.reject(new Error(`Unknown URL: ${url}`));
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <PlansPage />
    </MemoryRouter>,
  );
}

describe('PlansPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  it('renders Planes heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /planes/i })).toBeInTheDocument();
  });

  it('loads and shows plan names and prices', async () => {
    renderPage();
    expect(await screen.findByText('Completo')).toBeInTheDocument();
    expect(screen.getByText('Mediodía')).toBeInTheDocument();
    expect(screen.getAllByText('$1200')[0]).toBeInTheDocument();
    expect(screen.getAllByText('$800')[0]).toBeInTheDocument();
  });

  it('shows meal labels on plan cards', async () => {
    renderPage();
    await screen.findByText('Completo');
    expect(screen.getAllByText('Desayuno')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Almuerzo')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Cena')[0]).toBeInTheDocument();
  });

  it('auto-selects first plan and shows its name in the editor', async () => {
    renderPage();
    await screen.findByText('Completo');
    expect(screen.getByDisplayValue('Completo')).toBeInTheDocument();
  });

  it('clicking a plan card updates the editor', async () => {
    renderPage();
    await screen.findByText('Mediodía');
    fireEvent.click(screen.getByText('Mediodía'));
    expect(await screen.findByDisplayValue('Mediodía')).toBeInTheDocument();
  });

  it('Eliminar button is visible in the editor panel', async () => {
    renderPage();
    await screen.findByText('Completo');
    expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
  });

  it('Guardar cambios calls PATCH /plans/:id', async () => {
    mockPatch.mockResolvedValue({ data: { data: { ...mockPlan1, name: 'Completo Plus' } } });

    renderPage();
    await screen.findByText('Completo');
    fireEvent.change(screen.getByDisplayValue('Completo'), { target: { value: 'Completo Plus' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith(
        '/plans/1',
        expect.objectContaining({ name: 'Completo Plus' }),
      ),
    );
  });

  it('"Crear plan" opens a modal with subtitle', async () => {
    renderPage();
    await screen.findByText('Completo');
    fireEvent.click(screen.getByRole('button', { name: /crear plan/i }));
    expect(screen.getByText('Define nombre, comidas y precio')).toBeInTheDocument();
  });

  it('modal Cancelar closes the modal', async () => {
    renderPage();
    await screen.findByText('Completo');
    fireEvent.click(screen.getByRole('button', { name: /crear plan/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByText('Definí nombre, comidas y precio')).not.toBeInTheDocument();
  });

  it('submit button is disabled while POST is in flight', async () => {
    mockPost.mockReturnValue(new Promise(() => {}));

    renderPage();
    await screen.findByText('Completo');
    fireEvent.click(screen.getByRole('button', { name: /crear plan/i }));

    const submitBtn = screen.getByRole('button', { name: /^crear plan$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => expect(submitBtn).toBeDisabled());
  });

  it('save button is disabled while PATCH is in flight', async () => {
    mockPatch.mockReturnValue(new Promise(() => {}));

    renderPage();
    await screen.findByText('Completo');
    fireEvent.change(screen.getByDisplayValue('Completo'), { target: { value: 'Editado' } });
    const saveBtn = screen.getByRole('button', { name: /guardar cambios/i });
    fireEvent.click(saveBtn);

    await waitFor(() => expect(saveBtn).toBeDisabled());
  });

  it('clicking Eliminar opens a confirmation modal', async () => {
    renderPage();
    await screen.findByText('Completo');
    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('cancelling the confirmation does not delete', async () => {
    renderPage();
    await screen.findByText('Completo');
    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('confirming deletion calls DELETE /plans/:id and removes the plan', async () => {
    mockDelete.mockResolvedValue({});

    renderPage();
    await screen.findByText('Completo');

    mockGet.mockImplementation((url: string) => {
      if (url === '/plans') return Promise.resolve({ data: { data: [mockPlan2] } });
      if (url === '/clients') return Promise.resolve({ data: { data: [] } });
      return Promise.reject(new Error(`Unknown URL: ${url}`));
    });

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /eliminar/i }));

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('/plans/1'));
    await waitFor(() => expect(screen.queryByText('Completo')).not.toBeInTheDocument());
  });

  it('confirm button is disabled while DELETE is in flight', async () => {
    mockDelete.mockReturnValue(new Promise(() => {}));

    renderPage();
    await screen.findByText('Completo');
    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));

    const dialog = screen.getByRole('dialog');
    const confirmBtn = within(dialog).getByRole('button', { name: /eliminar/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(confirmBtn).toBeDisabled());
  });

  it('modal submit calls POST /plans', async () => {
    const newPlan = { id: 3, name: 'Ligero', meals: ['breakfast'], price: 500, discount: 0 };
    mockPost.mockResolvedValue({ data: { data: newPlan } });

    renderPage();
    await screen.findByText('Completo');
    fireEvent.click(screen.getByRole('button', { name: /crear plan/i }));

    const dialog = screen.getByRole('dialog');
    const nameInput = within(dialog).getByRole('textbox');
    await userEvent.type(nameInput, 'Ligero');

    const priceInputs = screen.getAllByRole('spinbutton');
    const modalPriceInput = priceInputs[priceInputs.length - 1];
    fireEvent.change(modalPriceInput, { target: { value: '500' } });

    const submitBtn = screen.getByRole('button', { name: /^crear plan$/i });
    fireEvent.click(submitBtn);

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith(
        '/plans',
        expect.objectContaining({ name: 'Ligero', price: 500 }),
      ),
    );
  });
});
