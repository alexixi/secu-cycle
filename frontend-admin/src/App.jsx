import { Routes, Route } from "react-router";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AdminLayout from "./components/layout/AdminLayout";
import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/UsersPage";
import FaqPage from "./pages/FaqPage";
import PlanningPage from "./pages/PlanningPage";
import ReportsPage from "./pages/ReportsPage";
import PoisPage from "./pages/PoisPage";
import AccidentsPage from "./pages/AccidentsPage";
import LightingPage from "./pages/LightingPage";
import GraphPage from "./pages/GraphPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<UsersPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/planning" element={<PlanningPage />} />
        <Route path="/pois" element={<PoisPage />} />
        <Route path="/accidents" element={<AccidentsPage />} />
        <Route path="/lighting" element={<LightingPage />} />
        <Route path="/graph" element={<GraphPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
