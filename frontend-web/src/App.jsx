import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Footer from './components/layout/Footer';
import './App.css';

const HomePage = lazy(() => import('./pages/HomePage'));
const ItinerairePage = lazy(() => import('./pages/ItinerairePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ProfileCreationPage = lazy(() => import('./pages/ProfileCreationPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));
const MentionsLegalesPage = lazy(() => import('./pages/MentionsLegalesPage'));
const ConfidentialitePage = lazy(() => import('./pages/ConfidentialitePage'));
const ConditionsUtilisationPage = lazy(() => import('./pages/ConditionsUtilisationPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));

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
        <ScrollToTop />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>

            <Route path="/" element={<HomePage />} />

            <Route path="/itineraire" element={<ItinerairePage />} />

            <Route path="/profil" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />

            <Route path="/login" element={<LoginPage />} />

            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route path="/signin" element={<ProfileCreationPage />} />

            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminPage />
              </ProtectedRoute>
            } />

            <Route path="/mentions-legales" element={<MentionsLegalesPage />} />

            <Route path="/confidentialite" element={<ConfidentialitePage />} />

            <Route path="/conditions-utilisation" element={<ConditionsUtilisationPage />} />

            <Route path="/contact" element={<ContactPage />} />

            <Route path="*" element={<ErrorPage />} />

          </Routes>
        </Suspense>
        <Footer />
      </div>
  );
}

export default App;
