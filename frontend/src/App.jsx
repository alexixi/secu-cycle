import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ItinerairePage from './pages/ItinerairePage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import ProfileCreationPage from './pages/ProfileCreationPage';
import AdminPage from './pages/AdminPage';
import ErrorPage from './pages/ErrorPage';
import './App.css'; // Vos styles globaux (reset CSS, polices)

function App() {
  return (
    <BrowserRouter>
      {/* Le Router englobe toute l'app.
         C'est lui qui permet de changer de page sans recharger le navigateur.
      */}
      <Routes>

        <Route path="/" element={<HomePage />} />

        <Route path="/itineraire" element={<ItinerairePage />} />

        <Route path="/profil" element={<ProfilePage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/signin" element={<ProfileCreationPage />} />

        <Route path="/admin" element={<AdminPage />} />

        <Route path="*" element={<ErrorPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;