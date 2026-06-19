import { render, screen, fireEvent } from '@testing-library/react';
import { ClientGroupTab } from './ClientGroupTab';
import * as useClientGroupModule from '../../hooks/useClientGroup';
import * as useClientListModule from '../../hooks/useClientList';

jest.mock('../../hooks/useClientGroup');
jest.mock('../../hooks/useClientList');
jest.mock('../../hooks/useDebounce', () => ({ useDebounce: (v: unknown) => v }));

const mockUseClientGroup = useClientGroupModule.useClientGroup as jest.Mock;
const mockUseClientList = useClientListModule.useClientList as jest.Mock;

const mockHook = (overrides = {}) => ({
  members: [],
  isDirty: false,
  add: jest.fn(),
  remove: jest.fn(),
  save: jest.fn(),
  isSaving: false,
  ...overrides,
});

beforeEach(() => {
  mockUseClientList.mockReturnValue({ clients: [], isLoading: false });
  jest.clearAllMocks();
});

describe('ClientGroupTab', () => {
  it('shows empty state in left column when no members', () => {
    mockUseClientGroup.mockReturnValue(mockHook());
    render(<ClientGroupTab clientId="1" initialMembers={[]} />);
    expect(screen.getByText(/sin miembros en el grupo/i)).toBeInTheDocument();
  });

  it('renders a row for each member in the left column', () => {
    mockUseClientGroup.mockReturnValue(
      mockHook({
        members: [
          { id: '2', name: 'Ana' },
          { id: '3', name: 'Bob' },
        ],
      }),
    );
    render(<ClientGroupTab clientId="1" initialMembers={[]} />);
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('calls remove when × button is clicked', () => {
    const remove = jest.fn();
    mockUseClientGroup.mockReturnValue(mockHook({ members: [{ id: '2', name: 'Ana' }], remove }));
    render(<ClientGroupTab clientId="1" initialMembers={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /eliminar ana/i }));
    expect(remove).toHaveBeenCalledWith('2');
  });

  it('guardar button is disabled when not dirty', () => {
    mockUseClientGroup.mockReturnValue(mockHook({ isDirty: false }));
    render(<ClientGroupTab clientId="1" initialMembers={[]} />);
    expect(screen.getByRole('button', { name: /guardar grupo/i })).toBeDisabled();
  });

  it('guardar button is enabled when dirty', () => {
    mockUseClientGroup.mockReturnValue(mockHook({ isDirty: true }));
    render(<ClientGroupTab clientId="1" initialMembers={[]} />);
    expect(screen.getByRole('button', { name: /guardar grupo/i })).not.toBeDisabled();
  });

  it('calls save when guardar button is clicked', () => {
    const save = jest.fn();
    mockUseClientGroup.mockReturnValue(mockHook({ isDirty: true, save }));
    render(<ClientGroupTab clientId="1" initialMembers={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /guardar grupo/i }));
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('shows search results in right column excluding self', () => {
    mockUseClientGroup.mockReturnValue(mockHook());
    mockUseClientList.mockReturnValue({
      clients: [
        { id: '1', name: 'Self' },
        { id: '4', name: 'Carlos' },
      ],
      isLoading: false,
    });
    render(<ClientGroupTab clientId="1" initialMembers={[]} />);
    fireEvent.change(screen.getByPlaceholderText(/buscar cliente/i), { target: { value: 'c' } });
    expect(screen.queryByText('Self')).not.toBeInTheDocument();
    expect(screen.getByText('Carlos')).toBeInTheDocument();
  });

  it('calls add when a search result row is clicked', () => {
    const add = jest.fn();
    mockUseClientGroup.mockReturnValue(mockHook({ add }));
    mockUseClientList.mockReturnValue({
      clients: [{ id: '4', name: 'Carlos' }],
      isLoading: false,
    });
    render(<ClientGroupTab clientId="1" initialMembers={[]} />);
    fireEvent.change(screen.getByPlaceholderText(/buscar cliente/i), { target: { value: 'Car' } });
    fireEvent.click(screen.getByRole('button', { name: /agregar carlos/i }));
    expect(add).toHaveBeenCalledWith({ id: '4', name: 'Carlos' });
  });

  it('excludes already-added members from search results', () => {
    mockUseClientGroup.mockReturnValue(mockHook({ members: [{ id: '4', name: 'Carlos' }] }));
    mockUseClientList.mockReturnValue({
      clients: [{ id: '4', name: 'Carlos' }],
      isLoading: false,
    });
    render(<ClientGroupTab clientId="1" initialMembers={[]} />);
    fireEvent.change(screen.getByPlaceholderText(/buscar cliente/i), { target: { value: 'Car' } });
    expect(screen.queryByRole('button', { name: /agregar carlos/i })).not.toBeInTheDocument();
  });
});
