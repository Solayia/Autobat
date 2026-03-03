import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients/Clients';
import ClientForm from './pages/Clients/ClientForm';
import ClientDetail from './pages/Clients/ClientDetail';
import Devis from './pages/Devis/Devis';
import DevisForm from './pages/Devis/DevisForm';
import DevisDetail from './pages/Devis/DevisDetail';
import Catalogue from './pages/Catalogue/Catalogue';
import CatalogueForm from './pages/Catalogue/CatalogueForm';
import Chantiers from './pages/Chantiers/Chantiers';
import ChantierForm from './pages/Chantiers/ChantierForm';
import ChantierDetail from './pages/Chantiers/ChantierDetail';
import Factures from './pages/Factures/Factures';
import FactureForm from './pages/Factures/FactureForm';
import FactureDetail from './pages/Factures/FactureDetail';
import Employes from './pages/Employes';
import Settings from './pages/Settings/Settings';
import Pilotage from './pages/Pilotage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SuperAdmin from './pages/SuperAdmin/SuperAdmin';
import CGU from './pages/CGU';
import MentionsLegales from './pages/MentionsLegales';
import Confidentialite from './pages/Confidentialite';

function App() {
  return (
    <BrowserRouter>
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/cgu" element={<CGU />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/confidentialite" element={<Confidentialite />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Clients routes */}
        <Route
          path="/clients"
          element={
            <ProtectedRoute roles={['MANAGER', 'COMPANY_ADMIN']}>
              <Layout>
                <Clients />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/new"
          element={
            <ProtectedRoute roles={['MANAGER', 'COMPANY_ADMIN']}>
              <Layout>
                <ClientForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:id"
          element={
            <ProtectedRoute roles={['MANAGER', 'COMPANY_ADMIN']}>
              <Layout>
                <ClientDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:id/edit"
          element={
            <ProtectedRoute roles={['MANAGER', 'COMPANY_ADMIN']}>
              <Layout>
                <ClientForm />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Devis routes */}
        <Route
          path="/devis"
          element={
            <ProtectedRoute roles={['MANAGER', 'COMPANY_ADMIN']}>
              <Layout>
                <Devis />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/devis/new"
          element={
            <ProtectedRoute roles={['MANAGER', 'COMPANY_ADMIN']}>
              <Layout>
                <DevisForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/devis/:id"
          element={
            <ProtectedRoute roles={['MANAGER', 'COMPANY_ADMIN']}>
              <Layout>
                <DevisDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/devis/:id/edit"
          element={
            <ProtectedRoute roles={['MANAGER', 'COMPANY_ADMIN']}>
              <Layout>
                <DevisForm />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catalogue routes */}
        <Route
          path="/catalogue"
          element={
            <ProtectedRoute roles={['MANAGER', 'COMPANY_ADMIN']}>
              <Layout>
                <Catalogue />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/catalogue/new"
          element={
            <ProtectedRoute roles={['MANAGER', 'COMPANY_ADMIN']}>
              <Layout>
                <CatalogueForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/catalogue/:id/edit"
          element={
            <ProtectedRoute roles={['MANAGER', 'COMPANY_ADMIN']}>
              <Layout>
                <CatalogueForm />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Chantiers routes */}
        <Route
          path="/chantiers"
          element={
            <ProtectedRoute>
              <Layout>
                <Chantiers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chantiers/new"
          element={
            <ProtectedRoute roles={['MANAGER', 'COMPANY_ADMIN']}>
              <Layout>
                <ChantierForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chantiers/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ChantierDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chantiers/:id/edit"
          element={
            <ProtectedRoute roles={['MANAGER', 'COMPANY_ADMIN']}>
              <Layout>
                <ChantierForm />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Factures routes */}
        <Route
          path="/factures"
          element={
            <ProtectedRoute roles={['MANAGER', 'COMPANY_ADMIN']}>
              <Layout>
                <Factures />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/factures/new"
          element={
            <ProtectedRoute roles={['MANAGER', 'COMPANY_ADMIN']}>
              <Layout>
                <FactureForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/factures/:id"
          element={
            <ProtectedRoute roles={['MANAGER', 'COMPANY_ADMIN']}>
              <Layout>
                <FactureDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Employés route */}
        <Route
          path="/employes"
          element={
            <ProtectedRoute roles={['MANAGER', 'COMPANY_ADMIN']}>
              <Layout>
                <Employes />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Pilotage route */}
        <Route
          path="/pilotage"
          element={
            <ProtectedRoute roles={['MANAGER', 'COMPANY_ADMIN']}>
              <Layout>
                <Pilotage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Settings route */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute roles={['COMPANY_ADMIN']}>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Mon profil — redirigé vers Paramètres onglet Profil */}
        <Route path="/mon-profil" element={<Navigate to="/settings?tab=profil" replace />} />

        {/* Badgeage GPS — intégré dans ChantierDetail (onglet Badgeages) */}
        <Route
          path="/badgeage"
          element={
            <ProtectedRoute>
              <Layout>
                <Navigate to="/chantiers" replace />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Super Admin route (sans Layout — interface dédiée) */}
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <SuperAdmin />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900">404</h1>
                <p className="text-gray-600 mt-4">Page non trouvée</p>
                <a href="/dashboard" className="btn btn-primary mt-6">
                  Retour au dashboard
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
