import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ClientTable } from './ClientTable';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const makeSub = (overrides = {}) => ({
  id: 1,
  clientId: 1,
  planId: 1,
  contractDate: '2026-05-01',
  startDate: '2026-05-01',
  contractEndDate: '2026-06-05',
  discount: 0,
  plan: { id: 1, name: 'Completo', meals: [], price: 480 },
  ...overrides,
});

const makeClient = (overrides = {}) => ({
  id: 1,
  name: 'María García',
  sex: 'female',
  dateOfBirth: '1970-04-12',
  deliveryZone: 'Centro',
  restrictions: [],
  status: 'active',
  subscriptions: [makeSub()],
  ...overrides,
});

const noop = () => {};

const baseProps = {
  clients: [] as ReturnType<typeof makeClient>[],
  total: 0,
  page: 1,
  limit: 25,
  onChangePage: noop,
  onChangeLimit: noop,
  isLoading: false,
  showRestrictionsColumn: false,
  restrictionQuery: '',
};

const renderTable = (props = {}) =>
  render(
    <MemoryRouter>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ClientTable {...baseProps} {...(props as any)} />
    </MemoryRouter>,
  );

describe('ClientTable', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the empty state when there are no clients', () => {
    renderTable();
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  it('renders a row per client with plan and price', () => {
    renderTable({ clients: [makeClient()], total: 1 });
    expect(screen.getByText('María García')).toBeInTheDocument();
    expect(screen.getByText('Completo')).toBeInTheDocument();
    expect(screen.getByText('480')).toBeInTheDocument();
  });

  it('shows an em-dash for price when the client has no subscription', () => {
    renderTable({ clients: [makeClient({ subscriptions: [] })], total: 1 });
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('navigates to the client detail page when a row is clicked', async () => {
    renderTable({ clients: [makeClient({ id: 7 })], total: 1 });
    await userEvent.click(screen.getByText('María García'));
    expect(mockNavigate).toHaveBeenCalledWith('/clientes/7');
  });

  it('shows a skeleton instead of rows while loading', () => {
    renderTable({ clients: [makeClient()], total: 1, isLoading: true });
    expect(screen.queryByText('María García')).not.toBeInTheDocument();
  });

  it('shows the restrictions column only when requested', () => {
    const { rerender } = renderTable({
      clients: [makeClient({ restrictions: ['Gluten'] })],
      total: 1,
      showRestrictionsColumn: false,
    });
    expect(screen.queryByText('Restricciones')).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ClientTable
          {...baseProps}
          clients={[makeClient({ restrictions: ['Gluten'] })]}
          total={1}
          showRestrictionsColumn
          restrictionQuery="gluten"
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Restricciones')).toBeInTheDocument();
    expect(screen.getByText('Gluten')).toBeInTheDocument();
  });
});
