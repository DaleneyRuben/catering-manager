import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

export type UserRole = 'admin' | 'manager' | 'delivery';

type AuthUser = {
  id: string;
  username: string;
  role: UserRole;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
};

type AuthContextValue = AuthState & {
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
};

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const loadFromStorage = (): AuthState => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    if (token && raw) return { token, user: JSON.parse(raw) as AuthUser };
  } catch {
    // corrupted storage — start fresh
  }
  return { token: null, user: null };
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadFromStorage);

  const setAuth = useCallback((user: AuthUser, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ user, token });
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, token: null });
  }, []);

  const value = useMemo(() => ({ ...state, setAuth, clearAuth }), [state, setAuth, clearAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');

  return ctx;
};
