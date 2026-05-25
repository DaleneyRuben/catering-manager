import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { NewClientPage } from './pages/NewClientPage';
import { PlansPage } from './pages/PlansPage';
import { MenuImportPage } from './pages/MenuImportPage';
import { ReportsPage } from './pages/ReportsPage';
import { RenewalsPage } from './pages/RenewalsPage';
import { HealthPage } from './pages/HealthPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/clientes" element={<ClientsPage />} />
        <Route path="/clientes/nuevo" element={<NewClientPage />} />
        <Route path="/planes" element={<PlansPage />} />
        <Route path="/menu" element={<MenuImportPage />} />
        <Route path="/informes" element={<ReportsPage />} />
        <Route path="/renovaciones" element={<RenewalsPage />} />
        <Route path="/health" element={<HealthPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
