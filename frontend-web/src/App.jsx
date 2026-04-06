import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ItinerairePage from './pages/ItinerairePage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import ProfileCreationPage from './pages/ProfileCreationPage';
import AdminPage from './pages/AdminPage';
import ErrorPage from './pages/ErrorPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import './App.css';

function App() {
  return (
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
  );
}

export default App;
