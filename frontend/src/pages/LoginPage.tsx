import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../utils/env';
import { useAuth, type UserRole } from '../contexts/AuthContext';
import { Field, inputCls } from '../components/ui/Field';

type LoginResponse = {
  token: string;
  user: { id: number; name: string; role: UserRole };
};

const redirectForRole = (role: UserRole): string => {
  if (role === 'delivery') return '/entregas';
  return '/';
};

export function LoginPage() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? 'Error al iniciar sesión');
        return;
      }

      const { token, user } = (await res.json()) as LoginResponse;
      setAuth(user, token);
      navigate(redirectForRole(user.role), { replace: true });
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-4xl text-ink font-semibold mb-1">La Oliva</h1>
          <p className="text-[13px] text-muted">Gestión de catering</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-paper border border-rule rounded-xl px-8 py-8 flex flex-col gap-5 shadow-sm"
        >
          <Field label="Usuario" htmlFor="username" required>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputCls()}
              disabled={loading}
            />
          </Field>

          <Field label="Contraseña" htmlFor="password" required>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls()}
              disabled={loading}
            />
          </Field>

          {error && (
            <p className="text-[12px] text-alert bg-alert-bg rounded-md px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="mt-1 w-full bg-olive-600 hover:bg-olive-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-medium rounded-md px-4 py-2.5 transition-colors"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
