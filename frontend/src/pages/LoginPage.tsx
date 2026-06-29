import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '@/utils/env';
import { useAuth } from '@/contexts/AuthContext';
import { ROLES, type UserRole } from '@/constants/roles';
import { Field, inputCls } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import logo from '@/assets/logo.png';

type LoginResponse = {
  token: string;
  user: { id: string; username: string; role: UserRole };
};

type SubmitState = 'idle' | 'loading' | 'success';

const redirectForRole = (role: UserRole): string => {
  if (role === ROLES.DELIVERY) return '/entregas';
  if (role === ROLES.KITCHEN) return '/menu';
  return '/';
};

export function LoginPage() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitState('loading');

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? 'Error al iniciar sesión');
        setSubmitState('idle');
        return;
      }

      const { token, user } = (await res.json()) as LoginResponse;
      setAuth(user, token);
      setSubmitState('success');
      setTimeout(() => navigate(redirectForRole(user.role), { replace: true }), 650);
    } catch {
      setError('No se pudo conectar con el servidor');
      setSubmitState('idle');
    }
  };

  const busy = submitState !== 'idle';

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden md:flex md:w-[44%] flex-col items-center justify-center bg-olive-900 relative overflow-hidden login-panel-left">
        <div className="absolute inset-0 pointer-events-none login-panel-glow" />
        <div className="relative z-10 flex flex-col items-center gap-6 px-14 text-center">
          <div className="w-36 h-36 rounded-full bg-paper/90 flex items-center justify-center p-2 shadow-xl ring-1 ring-white/10">
            <img src={logo} alt="La Oliva" className="w-full h-auto" />
          </div>
          <div>
            <p className="font-serif text-[52px] leading-none text-white tracking-tight">
              La Oliva
            </p>
            <p className="font-mono text-[10px] tracking-[.22em] uppercase text-olive-300 mt-3">
              Catering · con altura
            </p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-cream px-6 login-panel-right">
        {/* Mobile logo */}
        <div className="md:hidden mb-8">
          <img src={logo} alt="La Oliva" className="h-20 w-auto mx-auto" />
        </div>

        <div className="w-full max-w-[340px]">
          <div className="mb-8 login-fade-1">
            <h1 className="font-serif text-[40px] leading-none text-ink">Ingresar</h1>
            <p className="text-[13px] text-muted mt-2">Ingresa tus credenciales para continuar.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="login-fade-2">
              <Field label="Usuario" htmlFor="username" required>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputCls()}
                  disabled={busy}
                />
              </Field>
            </div>

            <div className="login-fade-3">
              <Field label="Contraseña" htmlFor="password" required>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputCls()} pr-9`}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <Icon name={showPassword ? 'eye-off' : 'eye'} size={15} />
                  </button>
                </div>
              </Field>
            </div>

            {error && (
              <p className="text-[12px] text-alert bg-alert-bg rounded-md px-3 py-2">{error}</p>
            )}

            <div className="login-fade-4 mt-1">
              <button
                type="submit"
                disabled={busy || !username || !password}
                className={[
                  'w-full text-white text-[13px] font-medium rounded-md px-4 py-2.5 transition-all duration-300 flex items-center justify-center gap-2',
                  submitState === 'success'
                    ? 'bg-olive-700 cursor-default'
                    : 'bg-olive-600 hover:bg-olive-700 disabled:opacity-50 disabled:cursor-not-allowed',
                ].join(' ')}
              >
                {submitState === 'idle' && 'Ingresar'}
                {submitState === 'loading' && (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Ingresando...
                  </>
                )}
                {submitState === 'success' && (
                  <span className="flex items-center gap-2 login-success-pop">
                    <Icon name="check" size={15} />
                    Listo
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
