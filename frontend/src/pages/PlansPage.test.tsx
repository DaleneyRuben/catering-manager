import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import api from '../services/api';
import { PlansPage } from './PlansPage';

jest.mock('../services/api', () => ({
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));
const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPatch = api.patch as jest.Mock;

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

  it('Descartar resets the editor to saved values', async () => {
    renderPage();
    await screen.findByText('Completo');
    fireEvent.change(screen.getByDisplayValue('Completo'), { target: { value: 'Editado' } });
    fireEvent.click(screen.getByRole('button', { name: /descartar/i }));
    expect(screen.getByDisplayValue('Completo')).toBeInTheDocument();
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

  it('modal submit calls POST /plans', async () => {
    const newPlan = { id: 3, name: 'Ligero', meals: ['breakfast'], price: 500, discount: 0 };
    mockPost.mockResolvedValue({ data: { data: newPlan } });

    renderPage();
    await screen.findByText('Completo');
    fireEvent.click(screen.getByRole('button', { name: /crear plan/i }));

    const nameInput = screen.getByPlaceholderText(/ej\. completo/i);
    await userEvent.type(nameInput, 'Ligero');

    const priceInputs = screen.getAllByRole('spinbutton');
    const modalPriceInput = priceInputs[priceInputs.length - 2];
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
