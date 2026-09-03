import { Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useLocalizedPath } from '../../i18n/useLang';

export default function ProtectedRoute({ children, requireAdmin = false }) {
    const path = useLocalizedPath();
    const { token, user } = useAuth();

    if (!token) {
        return <Navigate to={path("login")} replace />;
    }

    if (requireAdmin && user && !user.is_admin) {
        return <Navigate to={path("home")} replace />;
    }

    return children;
}
