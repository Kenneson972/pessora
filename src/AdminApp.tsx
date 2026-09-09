import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import PageLoadingFallback from './components/common/PageLoadingFallback';
import ScrollToTop from './components/common/ScrollToTop';

const Login = lazy(() => import('./pages/auth/Login'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminMembers = lazy(() => import('./pages/admin/AdminMembers'));
const AdminMemberDetail = lazy(() => import('./pages/admin/AdminMemberDetail'));
const AdminEvenements = lazy(() => import('./pages/admin/AdminEvenements'));
const AdminBilans = lazy(() => import('./pages/admin/AdminBilans'));
const AdminCommandes = lazy(() => import('./pages/admin/AdminCommandes'));
const ModeBar = lazy(() => import('./pages/admin/ModeBar'));
const RetraitsGamme = lazy(() => import('./pages/admin/RetraitsGamme'));
const AdminCommunications = lazy(() => import('./pages/admin/AdminCommunications'));
const AdminProduitsGammes = lazy(() => import('./pages/admin/AdminProduitsGammes'));
const AdminContenu = lazy(() => import('./pages/admin/AdminContenu'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Bundle admin.pessora.fr — n'importe QUE les modules /admin/*.
// Le reste du site public (Home, Menu, checkout, /mon-espace…) vit dans App.tsx
// et n'est jamais chargé ici : les deux bundles sont produits par des entrées
// Vite séparées (index.html / admin.html), voir vite.config.ts + docs/admin-separe-conception.md.
function AdminApp() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="flex min-h-screen flex-col">
          <main className="flex min-h-0 flex-1 flex-col pt-0">
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                <Route path="/connexion" element={<Login />} />

                <Route path="/" element={<Navigate to="/admin" replace />} />

                <Route path="/admin" element={
                  <ProtectedAdminRoute>
                    <AdminLayout><AdminOverview /></AdminLayout>
                  </ProtectedAdminRoute>
                } />
                <Route path="/admin/membres" element={
                  <ProtectedAdminRoute>
                    <AdminLayout><AdminMembers /></AdminLayout>
                  </ProtectedAdminRoute>
                } />
                <Route path="/admin/membres/:memberId" element={
                  <ProtectedAdminRoute>
                    <AdminLayout><AdminMemberDetail /></AdminLayout>
                  </ProtectedAdminRoute>
                } />
                <Route path="/admin/evenements" element={
                  <ProtectedAdminRoute>
                    <AdminLayout><AdminEvenements /></AdminLayout>
                  </ProtectedAdminRoute>
                } />
                <Route path="/admin/produits" element={<Navigate to="/admin/produits-gammes?tab=produits" replace />} />
                <Route path="/admin/gammes" element={<Navigate to="/admin/produits-gammes?tab=gammes" replace />} />
                <Route path="/admin/bilans" element={
                  <ProtectedAdminRoute>
                    <AdminLayout><AdminBilans /></AdminLayout>
                  </ProtectedAdminRoute>
                } />
                <Route path="/admin/commandes" element={
                  <ProtectedAdminRoute>
                    <AdminLayout><AdminCommandes /></AdminLayout>
                  </ProtectedAdminRoute>
                } />
                <Route path="/admin/mode-bar" element={
                  <ProtectedAdminRoute>
                    <ModeBar />
                  </ProtectedAdminRoute>
                } />
                <Route path="/admin/retraits" element={
                  <ProtectedAdminRoute>
                    <RetraitsGamme />
                  </ProtectedAdminRoute>
                } />
                <Route path="/admin/communication" element={
                  <ProtectedAdminRoute>
                    <AdminLayout><AdminCommunications /></AdminLayout>
                  </ProtectedAdminRoute>
                } />
                <Route path="/admin/infos" element={<Navigate to="/admin/contenu?tab=infos-bar" replace />} />
                <Route path="/admin/carousel" element={<Navigate to="/admin/contenu?tab=carrousel" replace />} />
                <Route path="/admin/moments" element={<Navigate to="/admin/contenu?tab=moments" replace />} />
                <Route path="/admin/produits-gammes" element={
                  <ProtectedAdminRoute>
                    <AdminLayout><AdminProduitsGammes /></AdminLayout>
                  </ProtectedAdminRoute>
                } />
                <Route path="/admin/contenu" element={
                  <ProtectedAdminRoute>
                    <AdminLayout><AdminContenu /></AdminLayout>
                  </ProtectedAdminRoute>
                } />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default AdminApp;
