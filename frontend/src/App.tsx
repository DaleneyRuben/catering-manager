import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientDetailPage } from './pages/ClientDetail';
import { NewClientPage } from './pages/NewClientPage';
import { PlansPage } from './pages/PlansPage';
import { MenuImportPage } from './pages/MenuImportPage';
import { ReportsPage } from './pages/ReportsPage';
import { RenewalsPage } from './pages/RenewalsPage';
import { HealthPage } from './pages/HealthPage';

const MANAGER_ROLES = ['admin', 'manager'] as const;

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute allowedRoles={[...MANAGER_ROLES]}>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/clientes" element={<ClientsPage />} />
                <Route path="/clientes/nuevo" element={<NewClientPage />} />
                <Route path="/clientes/:id" element={<ClientDetailPage />} />
                <Route path="/planes" element={<PlansPage />} />
                <Route path="/menu" element={<MenuImportPage />} />
                <Route path="/informes" element={<ReportsPage />} />
                <Route path="/renovaciones" element={<RenewalsPage />} />
                <Route path="/health" element={<HealthPage />} />
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
