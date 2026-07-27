import { Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children, requireAdmin = false }) {
    const { token, user } = useAuth();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && user && !user.is_admin) {
        return <Navigate to="/" replace />;
    }

    return children;
}
