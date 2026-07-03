import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminLayout.css";

export default function ProtectedRoute({ children }) {
    const { token, booting } = useAuth();

    if (booting) {
        return (
            <div className="app-loading">
                <div className="spinner" />
            </div>
        );
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
