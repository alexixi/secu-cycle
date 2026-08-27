import { Suspense, lazy, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, useLocation } from 'react-router';
import { ENABLED_LANGS, ROUTE_PATHS, patternFor, routeKeys } from './i18n/routes';
import i18n from './i18n';
import { ensureNamespaces } from './i18n/catalogues';
import { REGISTRY_LOADERS } from './data/registryLoaders';
import { buildRegistry } from './data/buildRegistry';
import * as core from './data/thematicMapsCore';
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
const lazyPage = (charger, ...namespaces) => lazy(() =>
  Promise.all([charger(), ensureNamespaces(i18n.language, namespaces)]).then(([module]) => module));

const HomePage = lazyPage(() => import('./pages/HomePage'), 'home');
const ItinerairePage = lazyPage(() => import('./pages/ItinerairePage'), 'itineraire', 'carte');
// « carte » : l'historique ouvre une modale qui rend MapComponent.
const ProfilePage = lazyPage(() => import('./pages/ProfilePage'), 'auth', 'carte');
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
// Les trois pages carte reçoivent leur registre éditorial en PROP, résolu dans la
// même promesse que le composant. C'est ce qui permet à `findPage` de rester
// synchrone au rendu — un await à l'intérieur du composant casserait le prérendu —
// tout en donnant à chaque langue son propre chunk éditorial.
const carteLazy = (charger) => lazy(async () => {
  const [module, registre] = await Promise.all([
    charger(),
    REGISTRY_LOADERS[i18n.language](),
    ensureNamespaces(i18n.language, ['carte']),
  ]);
  const Page = module.default;
  return { default: (props) => <Page registre={buildRegistry(core, registre)} {...props} /> };
});

const CarteHubPage = carteLazy(() => import('./pages/CarteHubPage'));
const CarteVillePage = carteLazy(() => import('./pages/CarteVillePage'));
const CarteThematiquePage = carteLazy(() => import('./pages/CarteThematiquePage'));

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
