import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import './App.css';

const HomePage = lazy(() => import('./pages/HomePage'));
const ItinerairePage = lazy(() => import('./pages/ItinerairePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProfileCreationPage = lazy(() => import('./pages/ProfileCreationPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));

const LoadingFallback = () => (
  <div className="loader-container">
    <div className="spinner"></div>
    <p style={{ color: '#6b7280', fontWeight: '500' }}>Chargement de la page...</p>
  </div>
);

function App() {
  return (
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

          <Route path="/signin" element={<ProfileCreationPage />} />

          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<ErrorPage />} />

        </Routes>
      </Suspense>
  );
}

export default App;
