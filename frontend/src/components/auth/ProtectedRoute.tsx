import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../../contexts/AuthContext';

type Props = {
  allowedRoles: UserRole[];
  children: React.ReactNode;
};

export function ProtectedRoute({ allowedRoles, children }: Props) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/sin-acceso" replace />;
  }

  return children as React.ReactElement;
}
