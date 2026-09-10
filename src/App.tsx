import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { cn } from '@heroui/react';
import { AuthProvider } from './contexts/AuthContext';
import { CookieConsentProvider } from './contexts/CookieConsentContext';
import { CookieConsentBanner } from './components/layout/CookieConsentBanner';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import ScrollToTop from './components/common/ScrollToTop';
import PageSEO from './components/common/PageSEO';
import { BreadcrumbJsonLd } from './components/seo/BreadcrumbJsonLd';
import LazyWidget from './components/common/LazyWidget';
import { AnnouncementPopup } from './components/common/AnnouncementPopup';
import ProtectedRoute from './components/ProtectedRoute';
import DemoAuthWrapper from './components/DemoAuthWrapper';
import MemberLayout from './components/member/MemberLayout';
import PageLoadingFallback from './components/common/PageLoadingFallback';

const IS_DEV = import.meta.env.DEV;

// Filet de sécurité si /admin/* est atteint sur le mauvais domaine (avant propagation
// DNS, en dev, ou si la redirection Vercel — voir vercel.json — n'a pas matché).
// En prod, l'admin vit sur admin.pessora.fr (voir AdminApp.tsx).
const RedirectToAdminApp = () => {
  useEffect(() => {
    const target = `https://admin.pessora.fr${window.location.pathname}${window.location.search}`;
    window.location.replace(target);
  }, []);
  return null;
};

// Lazy load toutes les pages
const Home = lazy(() => import('./pages/Home'));
const Concept = lazy(() => import('./pages/Concept'));
const Menu = lazy(() => import('./pages/Menu'));
const NosProduits = lazy(() => import('./pages/NosProduits'));
const RangeDetail = lazy(() => import('./pages/RangeDetail'));
const GammeProductDetail = lazy(() => import('./pages/GammeProductDetail'));
const DrinkDetail = lazy(() => import('./pages/DrinkDetail'));
const Evenements = lazy(() => import('./pages/Evenements'));
const Contact = lazy(() => import('./pages/Contact'));
const ContactPartenariat = lazy(() => import('./pages/ContactPartenariat'));
const MentionsLegales = lazy(() => import('./pages/MentionsLegales'));
const CGV = lazy(() => import('./pages/CGV'));
const PolitiqueConfidentialite = lazy(() => import('./pages/PolitiqueConfidentialite'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ReinitialisationMotDePasse = lazy(() => import('./pages/auth/ReinitialisationMotDePasse'));
const Dashboard = lazy(() => import('./pages/member/Dashboard'));
const Subscription = lazy(() => import('./pages/member/Subscription'));
const Profile = lazy(() => import('./pages/member/Profile'));
const History = lazy(() => import('./pages/member/History'));
const OrderDetail = lazy(() => import('./pages/member/OrderDetail'));
const MesEvenements = lazy(() => import('./pages/member/MesEvenements'));
const PessobotPage = lazy(() => import('./pages/PessobotPage'));
const SuiviCommande = lazy(() => import('./pages/SuiviCommande'));
const EvenementDetail = lazy(() => import('./pages/EvenementDetail'));
const LuxeMockup = lazy(() => import('./pages/LuxeMockup'));
const ManagerSketchMockup = lazy(() => import('./pages/ManagerSketchMockup'));
const CommandeSucces = lazy(() => import('./pages/CommandeSucces'));
const CommandeAnnulee = lazy(() => import('./pages/CommandeAnnulee'));
const AbonnementSucces = lazy(() => import('./pages/AbonnementSucces'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Chatbot = lazy(() => import('./components/common/Chatbot'));

const MEMBER_EMBEDDED_CHATBOT = (
  <div className="h-full min-h-0 flex flex-col">
    <Chatbot embedded />
  </div>
);

const MEMBER_ROUTE_SEGMENTS: { segment: string; element: React.ReactNode }[] = [
  { segment: '', element: <Dashboard /> },
  { segment: 'evenements', element: <MesEvenements /> },
  { segment: 'abonnement', element: <Subscription /> },
  { segment: 'profil', element: <Profile /> },
  { segment: 'historique', element: <History /> },
  { segment: 'historique/:orderId', element: <OrderDetail /> },
  { segment: 'pessobot', element: MEMBER_EMBEDDED_CHATBOT },
];

// Layout wrapper pour gérer header/footer conditionnellement
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isMemberArea = location.pathname.startsWith('/mon-espace') || (IS_DEV && location.pathname.startsWith('/demo-espace'));
  const isAuthPage = location.pathname === '/connexion' || location.pathname === '/inscription';
  const isInternalMockup =
    location.pathname === '/mockup-luxe' || location.pathname === '/mockup-croquis-gerant';
  const isAdminArea = location.pathname.startsWith('/admin');
  const isHomePage = location.pathname === '/';

  // Lazy loading pour les <img> rendus après coup (React) — 2 passes légères
  // (ne pas toucher aux images LCP : loading="eager", fetchPriority="high", data-skip-lazy)
  useEffect(() => {
    const applyLazy = () => {
      document.querySelectorAll('img:not([loading])').forEach((img) => {
        const el = img as HTMLImageElement;
        if (el.getAttribute('fetchpriority') === 'high') return;
        if (el.dataset.skipLazy === 'true') return;
        el.setAttribute('loading', 'lazy');
        el.setAttribute('decoding', 'async');
      });
    };
    applyLazy();
    const id = requestAnimationFrame(() => applyLazy());
    return () => cancelAnimationFrame(id);
  }, [location.pathname]);

  const showPublicChrome = !isMemberArea && !isAuthPage && !isInternalMockup && !isAdminArea;

  return (
    <>
      <ScrollToTop />
      <PageSEO />
      <BreadcrumbJsonLd />
      <div className="flex min-h-screen flex-col">
        {showPublicChrome && (
          <a
            href="#main-content"
            className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-3 focus:text-[11px] focus:font-normal focus:uppercase focus:tracking-[0.14em] focus:text-black focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-noir/20"
          >
            Aller au contenu
          </a>
        )}
        {showPublicChrome && <Header />}
        {showPublicChrome && <CartDrawer />}
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'flex-grow outline-none',
            showPublicChrome && !isHomePage && 'pt-16 md:pt-20',
            (isMemberArea || isAuthPage || isAdminArea) && 'flex min-h-0 flex-col pt-0',
          )}
        >
          <Suspense fallback={<PageLoadingFallback />}>
            {children}
          </Suspense>
        </main>
        {showPublicChrome && <Footer />}
        {showPublicChrome && <AnnouncementPopup />}
        {showPublicChrome && (
          <LazyWidget delay={1500} onIdle>
            <Chatbot />
          </LazyWidget>
        )}
      </div>
    </>
  );
};

function App() {
  return (
    <CookieConsentProvider>
      <AuthProvider>
        <Router>
          <AppLayout>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/concept" element={<Concept />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/nos-produits" element={<NosProduits />} />
            <Route path="/nos-produits/:rangeId/:slug" element={<GammeProductDetail />} />
            <Route path="/nos-produits/:rangeId" element={<RangeDetail />} />
            <Route path="/pessobot" element={<PessobotPage />} />
            {/* Modules /admin/* extraits vers AdminApp.tsx (bundle admin.pessora.fr) —
                voir docs/admin-separe-conception.md. Toute URL /admin/* atteinte ici
                (mauvais domaine) redirige vers l'app admin. */}
            <Route path="/admin/*" element={<RedirectToAdminApp />} />
            <Route path="/menu/:drinkId" element={<DrinkDetail />} />
            <Route path="/evenements" element={<Evenements />} />
            <Route path="/evenements/:slug" element={<EvenementDetail />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/contact-partenariat" element={<ContactPartenariat />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
            <Route path="/cgv" element={<CGV />} />
            <Route path="/mockup-luxe" element={<LuxeMockup />} />
            <Route path="/mockup-croquis-gerant" element={<ManagerSketchMockup />} />
            <Route path="/commande/succes" element={<CommandeSucces />} />
            <Route path="/commande/annulee" element={<CommandeAnnulee />} />
          <Route path="/suivi-commande" element={<SuiviCommande />} />
            <Route path="/abonnement/succes" element={<AbonnementSucces />} />

            {/* Auth Routes */}
            <Route path="/connexion" element={<Login />} />
            <Route path="/inscription" element={<Register />} />
            <Route path="/reinitialisation-mot-de-passe" element={<ReinitialisationMotDePasse />} />

            {IS_DEV && (
            <>
              {MEMBER_ROUTE_SEGMENTS.map(({ segment, element }) => {
                const path = segment ? `/demo-espace/${segment}` : '/demo-espace';
                const layout = <MemberLayout>{element}</MemberLayout>;
                return (
                  <Route
                    key={`demo-espace:${segment || '/'}`}
                    path={path}
                    element={<DemoAuthWrapper>{layout}</DemoAuthWrapper>}
                  />
                );
              })}
            </>
            )}
            <>
              {MEMBER_ROUTE_SEGMENTS.map(({ segment, element }) => {
                const path = segment ? `/mon-espace/${segment}` : '/mon-espace';
                const layout = <MemberLayout>{element}</MemberLayout>;
                return (
                  <Route
                    key={`mon-espace:${segment || '/'}`}
                    path={path}
                    element={<ProtectedRoute>{layout}</ProtectedRoute>}
                  />
                );
              })}
            </>

            <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
          <CookieConsentBanner />
        </Router>
      </AuthProvider>
    </CookieConsentProvider>
  );
}

export default App;
