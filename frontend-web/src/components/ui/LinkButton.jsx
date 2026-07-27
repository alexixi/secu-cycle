import "./Button.css";
import { useNavigate } from "react-router";

export default function LinkButton({ to, className, children }) {
    const navigate = useNavigate();
    return (
        <button
            className={`button ${className}`}
            onClick={() => navigate(to)}
        >
            {children}
        </button>
    );
}
