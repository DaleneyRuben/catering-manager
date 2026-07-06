import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { PlansPage } from '@/pages/PlansPage';

jest.mock('@/services/api', () => ({
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
    if (url === '/plans') return Promise.resolve(plans);
    if (url === '/plans/client-counts') return Promise.resolve([]);
    return Promise.reject(new Error(`Unknown URL: ${url}`));
  });
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PlansPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function getCard(planId: number) {
  return screen.getByTestId(`plan-card-${planId}`);
}

async function openEditModal(planId = 1) {
  renderPage();
  await screen.findByTestId(`plan-card-${planId}`);
  fireEvent.click(within(getCard(planId)).getByRole('button', { name: /editar plan/i }));
  return screen.findByRole('dialog');
}

describe('PlansPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  it('renders Planes heading', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: /planes/i })).toBeInTheDocument();
  });

  it('loads and shows plan names and prices', async () => {
    renderPage();
    expect(await screen.findByText('Completo')).toBeInTheDocument();
    expect(screen.getByText('Mediodía')).toBeInTheDocument();
    expect(screen.getAllByText('1.200')[0]).toBeInTheDocument();
    expect(screen.getAllByText('800')[0]).toBeInTheDocument();
  });

  it('shows meal labels on plan cards', async () => {
    renderPage();
    await screen.findByText('Completo');
    expect(screen.getAllByText('Desayuno')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Almuerzo')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Cena')[0]).toBeInTheDocument();
  });

  it('shows the active plan count', async () => {
    renderPage();
    await screen.findByText('Completo');
    expect(screen.getByText('2 planes activos')).toBeInTheDocument();
  });

  it('shows an empty state with a create button when there are no plans', async () => {
    setupMocks([]);
    renderPage();
    expect(await screen.findByText('Sin planes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear primer plan/i })).toBeInTheDocument();
  });

  it('clicking a plan card opens edit modal with plan name in input', async () => {
    const modal = await openEditModal();
    expect(within(modal).getByDisplayValue('Completo')).toBeInTheDocument();
  });

  it('clicking a different plan card opens its edit modal', async () => {
    const modal = await openEditModal(2);
    expect(within(modal).getByDisplayValue('Mediodía')).toBeInTheDocument();
  });

  it('Guardar cambios calls PATCH /plans/:id', async () => {
    mockPatch.mockResolvedValue({ ...mockPlan1, name: 'Completo Plus' });

    const modal = await openEditModal();
    fireEvent.change(within(modal).getByDisplayValue('Completo'), {
      target: { value: 'Completo Plus' },
    });
    fireEvent.click(within(modal).getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith(
        '/plans/1',
        expect.objectContaining({ name: 'Completo Plus' }),
      ),
    );
  });

  it('"Crear plan" opens a modal titled Nuevo plan', async () => {
    renderPage();
    await screen.findByText('Completo');
    fireEvent.click(screen.getByRole('button', { name: /crear plan/i }));
    expect(within(screen.getByRole('dialog')).getByText('Nuevo plan')).toBeInTheDocument();
  });

  it('modal Cancelar closes the modal', async () => {
    renderPage();
    await screen.findByText('Completo');
    fireEvent.click(screen.getByRole('button', { name: /crear plan/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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

    const modal = await openEditModal();
    fireEvent.change(within(modal).getByDisplayValue('Completo'), {
      target: { value: 'Editado' },
    });
    const saveBtn = within(modal).getByRole('button', { name: /guardar cambios/i });
    fireEvent.click(saveBtn);

    await waitFor(() => expect(saveBtn).toBeDisabled());
  });

  it('clicking the delete icon on a plan card opens confirmation dialog', async () => {
    renderPage();
    await screen.findByTestId('plan-card-1');
    fireEvent.click(within(getCard(1)).getByRole('button', { name: /eliminar plan/i }));

    expect(await screen.findByText('Eliminar plan')).toBeInTheDocument();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('cancelling the confirmation does not delete', async () => {
    renderPage();
    await screen.findByTestId('plan-card-1');
    fireEvent.click(within(getCard(1)).getByRole('button', { name: /eliminar plan/i }));
    await screen.findByText('Eliminar plan');
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    await waitFor(() => expect(screen.queryByText('Eliminar plan')).not.toBeInTheDocument());
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('confirming deletion calls DELETE /plans/:id and removes the plan', async () => {
    mockDelete.mockResolvedValue({});

    renderPage();
    await screen.findByTestId('plan-card-1');

    mockGet.mockImplementation((url: string) => {
      if (url === '/plans') return Promise.resolve([mockPlan2]);
      if (url === '/plans/client-counts') return Promise.resolve([]);
      return Promise.reject(new Error(`Unknown URL: ${url}`));
    });

    fireEvent.click(within(getCard(1)).getByRole('button', { name: /eliminar plan/i }));
    await screen.findByText('Eliminar plan');

    const confirmDialog = screen.getByRole('dialog');
    fireEvent.click(within(confirmDialog).getByRole('button', { name: /^eliminar$/i }));

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('/plans/1'));
    await waitFor(() => expect(screen.queryByText('Completo')).not.toBeInTheDocument());
  });

  it('confirm button is disabled while DELETE is in flight', async () => {
    mockDelete.mockReturnValue(new Promise(() => {}));

    renderPage();
    await screen.findByTestId('plan-card-1');
    fireEvent.click(within(getCard(1)).getByRole('button', { name: /eliminar plan/i }));
    await screen.findByText('Eliminar plan');

    const confirmDialog = screen.getByRole('dialog');
    const confirmBtn = within(confirmDialog).getByRole('button', { name: /^eliminar$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(confirmBtn).toBeDisabled());
  });

  it('modal submit calls POST /plans', async () => {
    const newPlan = { id: 3, name: 'Ligero', meals: ['breakfast'], price: 500, discount: 0 };
    mockPost.mockResolvedValue(newPlan);

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
