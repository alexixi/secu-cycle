import { useState } from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { LuLogIn, LuShieldCheck } from "react-icons/lu";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ui/ThemeToggle";
import "./LoginPage.css";

export default function LoginPage() {
  const { token, login } = useAuth();
  const { mode, setMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (token) {
    return <Navigate to={location.state?.from || "/"} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      if (err.code === "NOT_ADMIN") {
        setError("Ce compte n'a pas les droits d'administration.");
      } else if (err.status === 401 || err.message === "Non autorisé") {
        setError("Adresse e-mail ou mot de passe incorrect.");
      } else {
        setError("Connexion impossible. Réessayez plus tard.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-theme">
        <ThemeToggle compact value={mode} onChange={setMode} />
      </div>
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <LuShieldCheck size={28} />
          <span>Sécu'Cycle <strong>Admin</strong></span>
        </div>
        <p className="login-subtitle">Espace d'administration réservé.</p>

        <label className="login-field">
          <span>Adresse e-mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="admin@secu-cycle.fr"
            autoComplete="username"
            required
          />
        </label>

        <label className="login-field">
          <span>Mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <div className="login-error">{error}</div>}

        <Button type="submit" className="active" disabled={!email || !password || submitting}>
          {submitting ? "Connexion…" : <>Se connecter <LuLogIn size={16} /></>}
        </Button>
      </form>
    </div>
  );
}
