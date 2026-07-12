import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AdminLayout from "./components/layout/AdminLayout";
import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/UsersPage";
import CasesPage from "./pages/CasesPage";
import PlanningPage from "./pages/PlanningPage";
import ReportsPage from "./pages/ReportsPage";
import PoisPage from "./pages/PoisPage";
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
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/planning" element={<PlanningPage />} />
        <Route path="/pois" element={<PoisPage />} />
        <Route path="/graph" element={<GraphPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
