import { Suspense, lazy, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, useLocation } from 'react-router';
import { ENABLED_LANGS, ROUTE_PATHS, patternFor, routeKeys } from './i18n/routes';
import i18n from './i18n';
import { ensureNamespaces } from './i18n/catalogues';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import './App.css';

// Une page n'est montée qu'une fois ses catalogues dans le magasin. C'est ce qui
// rend le prérendu sûr : si t() renvoyait la clé au premier rendu, react-snap
// figerait un HTML de clés et verify-prerender ferait échouer le build.
//
// La langue est celle fixée à l'initialisation depuis l'URL. Il n'y a pas de
// bascule à chaud — changer de langue recharge la page — donc elle est constante
// pendant toute la vie du document.
const lazyPage = (charger, namespace) => lazy(() =>
  Promise.all([charger(), ensureNamespaces(i18n.language, [namespace])]).then(([module]) => module));

const HomePage = lazyPage(() => import('./pages/HomePage'), 'home');
const ItinerairePage = lazyPage(() => import('./pages/ItinerairePage'), 'itineraire');
const ProfilePage = lazyPage(() => import('./pages/ProfilePage'), 'auth');
const LoginPage = lazyPage(() => import('./pages/LoginPage'), 'auth');
const ForgotPasswordPage = lazyPage(() => import('./pages/ForgotPasswordPage'), 'auth');
const ChangeEmailPage = lazyPage(() => import('./pages/ChangeEmailPage'), 'auth');
const ProfileCreationPage = lazyPage(() => import('./pages/ProfileCreationPage'), 'auth');
const AdminPage = lazyPage(() => import('./pages/AdminPage'), 'auth');
const ErrorPage = lazyPage(() => import('./pages/ErrorPage'), 'common');
const MentionsLegalesPage = lazyPage(() => import('./pages/MentionsLegalesPage'), 'legal');
const ConfidentialitePage = lazyPage(() => import('./pages/ConfidentialitePage'), 'legal');
const ConditionsUtilisationPage = lazyPage(() => import('./pages/ConditionsUtilisationPage'), 'legal');
const SuppressionComptePage = lazyPage(() => import('./pages/SuppressionComptePage'), 'legal');
const ContactPage = lazyPage(() => import('./pages/ContactPage'), 'legal');
const FaqPage = lazyPage(() => import('./pages/FaqPage'), 'faq');
const DonneesPage = lazyPage(() => import('./pages/DonneesPage'), 'donnees');
const CarteHubPage = lazyPage(() => import('./pages/CarteHubPage'), 'carte');
const CarteVillePage = lazyPage(() => import('./pages/CarteVillePage'), 'carte');
const CarteThematiquePage = lazyPage(() => import('./pages/CarteThematiquePage'), 'carte');

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

const LoadingFallback = () => {
  const { t } = useTranslation();
  return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p style={{ color: '#6b7280', fontWeight: '500' }}>{t('chargement')}</p>
    </div>
  );
};

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
