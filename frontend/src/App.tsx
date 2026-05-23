import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { PlansPage } from './pages/PlansPage';
import { MenuImportPage } from './pages/MenuImportPage';
import { ReportsPage } from './pages/ReportsPage';
import { RenewalsPage } from './pages/RenewalsPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/clientes/*" element={<ClientsPage />} />
        <Route path="/planes" element={<PlansPage />} />
        <Route path="/menu" element={<MenuImportPage />} />
        <Route path="/informes" element={<ReportsPage />} />
        <Route path="/renovaciones" element={<RenewalsPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
