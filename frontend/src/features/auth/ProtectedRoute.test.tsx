import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';

import { useAuth } from '@/features/auth/AuthContext';

jest.mock('@/features/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));
const mockUseAuth = useAuth as jest.Mock;

function renderRoute(user: { id: number; username: string; role: string } | null) {
  mockUseAuth.mockReturnValue({ user });
  return render(
    <MemoryRouter initialEntries={['/protegido']}>
      <Routes>
        <Route
          path="/protegido"
          element={
            <ProtectedRoute allowedRoles={['admin', 'kitchen']}>
              <div>contenido protegido</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>pagina de login</div>} />
        <Route path="/sin-acceso" element={<div>sin acceso</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('renders children when user has an allowed role', () => {
    renderRoute({ id: 1, username: 'daleney', role: 'admin' });
    expect(screen.getByText('contenido protegido')).toBeInTheDocument();
  });

  it('renders children when user has kitchen role', () => {
    renderRoute({ id: 2, username: 'staff', role: 'kitchen' });
    expect(screen.getByText('contenido protegido')).toBeInTheDocument();
  });

  it('redirects to /login when no user is authenticated', () => {
    renderRoute(null);
    expect(screen.getByText('pagina de login')).toBeInTheDocument();
    expect(screen.queryByText('contenido protegido')).not.toBeInTheDocument();
  });

  it('redirects to /sin-acceso when user role is not in allowedRoles', () => {
    renderRoute({ id: 3, username: 'rider', role: 'delivery' });
    expect(screen.getByText('sin acceso')).toBeInTheDocument();
    expect(screen.queryByText('contenido protegido')).not.toBeInTheDocument();
  });
});
