import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router';
import { ENABLED_LANGS, ROUTE_PATHS, patternFor, routeKeys } from './i18n/routes';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import './App.css';

const HomePage = lazy(() => import('./pages/HomePage'));
const ItinerairePage = lazy(() => import('./pages/ItinerairePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ChangeEmailPage = lazy(() => import('./pages/ChangeEmailPage'));
const ProfileCreationPage = lazy(() => import('./pages/ProfileCreationPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));
const MentionsLegalesPage = lazy(() => import('./pages/MentionsLegalesPage'));
const ConfidentialitePage = lazy(() => import('./pages/ConfidentialitePage'));
const ConditionsUtilisationPage = lazy(() => import('./pages/ConditionsUtilisationPage'));
const SuppressionComptePage = lazy(() => import('./pages/SuppressionComptePage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const DonneesPage = lazy(() => import('./pages/DonneesPage'));
const CarteHubPage = lazy(() => import('./pages/CarteHubPage'));
const CarteVillePage = lazy(() => import('./pages/CarteVillePage'));
const CarteThematiquePage = lazy(() => import('./pages/CarteThematiquePage'));

const PAGE_ELEMENTS = {
  home: <HomePage />,
  itineraire: <ItinerairePage />,
  profil: (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  ),
  profilEmail: (
    <ProtectedRoute>
      <ChangeEmailPage />
    </ProtectedRoute>
  ),
  login: <LoginPage />,
  forgotPassword: <ForgotPasswordPage />,
  signin: <ProfileCreationPage />,
  admin: (
    <ProtectedRoute requireAdmin>
      <AdminPage />
    </ProtectedRoute>
  ),
  mentionsLegales: <MentionsLegalesPage />,
  confidentialite: <ConfidentialitePage />,
  conditions: <ConditionsUtilisationPage />,
  suppressionCompte: <SuppressionComptePage />,
  contact: <ContactPage />,
  faq: <FaqPage />,
  donnees: <DonneesPage />,
  carteHub: <CarteHubPage />,
  carteVille: <CarteVillePage />,
  carteTheme: <CarteThematiquePage />,
};

const LoadingFallback = () => (
  <div className="loader-container">
    <div className="spinner"></div>
    <p style={{ color: '#6b7280', fontWeight: '500' }}>Chargement de la page...</p>
  </div>
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
      <div className="app-shell">
        <Header />
        <ScrollToTop />
        <main>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>

            {ENABLED_LANGS.flatMap((lang) =>
              routeKeys()
                .filter((cle) => ROUTE_PATHS[cle][lang])
                .map((cle) => (
                  <Route key={`${lang}:${cle}`} path={patternFor(cle, lang)} element={PAGE_ELEMENTS[cle]} />
                ))
            )}

            <Route path="*" element={<ErrorPage />} />

          </Routes>
        </Suspense>
        </main>
        <Footer />
      </div>
  );
}

export default App;
