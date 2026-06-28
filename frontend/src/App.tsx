import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientDetailPage } from './pages/ClientDetailPage';
import { NewClientPage } from './pages/NewClientPage';
import { PlansPage } from './pages/PlansPage';
import { MenuImportPage } from './pages/MenuImportPage';
import { ReportsPage } from './pages/ReportsPage';
import { HealthPage } from './pages/HealthPage';
import { UsersPage } from './pages/UsersPage';
import { DeliveryPage } from './pages/DeliveryPage';
import { ROLES } from './constants/roles';

const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN] as const;
const STAFF_ROLES = [...ADMIN_ROLES, ROLES.KITCHEN] as const;
const DELIVERY_ROLES = [...ADMIN_ROLES, ROLES.DELIVERY] as const;
const SHELL_ROLES = [...STAFF_ROLES, ROLES.DELIVERY] as const;

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute allowedRoles={[...SHELL_ROLES]}>
            <Layout>
              <Routes>
                <Route
                  path="/"
                  element={
                    <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clientes"
                  element={
                    <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
                      <ClientsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clientes/nuevo"
                  element={
                    <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
                      <NewClientPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clientes/:id"
                  element={
                    <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
                      <ClientDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/planes"
                  element={
                    <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
                      <PlansPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/menu"
                  element={
                    <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
                      <MenuImportPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/informes"
                  element={
                    <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
                      <ReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/entregas"
                  element={
                    <ProtectedRoute allowedRoles={[...DELIVERY_ROLES]}>
                      <DeliveryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/health"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                      <HealthPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/usuarios"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sin-acceso"
                  element={
                    <div className="flex items-center justify-center h-64 text-muted text-sm">
                      No tenés acceso a esta sección.
                    </div>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
