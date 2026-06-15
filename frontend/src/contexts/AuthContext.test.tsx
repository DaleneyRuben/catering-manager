import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const mockUser = { id: 1, username: 'daleney', role: 'admin' as const };

function TestConsumer() {
  const { user, token, setAuth, clearAuth } = useAuth();
  return (
    <div>
      <span data-testid="username">{user?.username ?? 'none'}</span>
      <span data-testid="token">{token ?? 'none'}</span>
      <button type="button" onClick={() => setAuth(mockUser, 'tok-123')}>
        login
      </button>
      <button type="button" onClick={clearAuth}>
        logout
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('AuthContext', () => {
  it('throws when used outside AuthProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used inside AuthProvider');
    spy.mockRestore();
  });

  it('starts with no user when localStorage is empty', () => {
    renderWithProvider();
    expect(screen.getByTestId('username').textContent).toBe('none');
    expect(screen.getByTestId('token').textContent).toBe('none');
  });

  it('loads user and token from localStorage on mount', () => {
    localStorage.setItem(TOKEN_KEY, 'existing-token');
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
    renderWithProvider();
    expect(screen.getByTestId('username').textContent).toBe('daleney');
    expect(screen.getByTestId('token').textContent).toBe('existing-token');
  });

  it('setAuth updates state and persists to localStorage', () => {
    renderWithProvider();
    act(() => {
      screen.getByRole('button', { name: 'login' }).click();
    });
    expect(screen.getByTestId('username').textContent).toBe('daleney');
    expect(screen.getByTestId('token').textContent).toBe('tok-123');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('tok-123');
    expect(JSON.parse(localStorage.getItem(USER_KEY)!)).toEqual(mockUser);
  });

  it('clearAuth removes user, token, and localStorage entries', () => {
    localStorage.setItem(TOKEN_KEY, 'existing-token');
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
    renderWithProvider();
    act(() => {
      screen.getByRole('button', { name: 'logout' }).click();
    });
    expect(screen.getByTestId('username').textContent).toBe('none');
    expect(screen.getByTestId('token').textContent).toBe('none');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it('starts with no user when localStorage contains corrupted data', () => {
    localStorage.setItem(TOKEN_KEY, 'tok');
    localStorage.setItem(USER_KEY, '{corrupted json');
    renderWithProvider();
    expect(screen.getByTestId('username').textContent).toBe('none');
  });
});
