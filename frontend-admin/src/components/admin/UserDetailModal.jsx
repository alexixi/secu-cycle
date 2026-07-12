import { useEffect, useState } from "react";
import { LuAward, LuShieldCheck, LuShieldOff, LuTrash2 } from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import { getUserBadges } from "../../services/apiBack";
import Button from "../ui/Button";
import "../ui/PopUp.css";
import "./UserDetailModal.css";

const FIELDS = [
  { key: "first_name", label: "Prénom" },
  { key: "last_name", label: "Nom" },
  { key: "sport_level", label: "Niveau sportif" },
  { key: "home_address", label: "Adresse domicile" },
  { key: "work_address", label: "Adresse travail" },
];

export default function UserDetailModal({ user, currentUserId, onClose, onSave, onDelete }) {
  const { token } = useAuth();
  const [isAdmin, setIsAdmin] = useState(() => !!user.is_admin);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [badges, setBadges] = useState(null); // null = chargement en cours

  const isSelf = user.id === currentUserId;

  useEffect(() => {
    let cancelled = false;
    getUserBadges(token, user.id)
      .then((data) => !cancelled && setBadges(data))
      // Les badges sont une information secondaire : leur échec ne doit pas bloquer
      // l'édition de la fiche, on retombe simplement sur une liste vide.
      .catch(() => !cancelled && setBadges([]));
    return () => {
      cancelled = true;
    };
  }, [token, user.id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave(user.id, { is_admin: isAdmin });
      onClose();
    } catch (err) {
      setError(err.message || "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target.classList.contains("modal-overlay") && onClose()}
    >
      <div className="modal-content user-detail-modal">
        <div className="user-detail-header">
          <h2>{[user.first_name, user.last_name].filter(Boolean).join(" ") || "Utilisateur"}</h2>
          <span className="user-detail-email">{user.email}</span>
          <div className="user-detail-meta">
            <span>ID #{user.id}</span>
            <span>
              Inscrit le{" "}
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString("fr-FR")
                : "—"}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="user-detail-form">
          <div className="user-detail-grid">
            {FIELDS.map(({ key, label }) => (
              <div key={key} className="user-detail-field">
                <span>{label}</span>
                <p className="user-detail-value">{user[key] || "—"}</p>
              </div>
            ))}
          </div>

          <div className="user-detail-badges">
            <span className="user-detail-badges-title">
              Badges obtenus
              {badges && badges.length > 0 && <em> ({badges.length})</em>}
            </span>

            {badges === null ? (
              <p className="user-detail-badges-empty">Chargement…</p>
            ) : badges.length === 0 ? (
              <p className="user-detail-badges-empty">Aucun badge obtenu.</p>
            ) : (
              <ul className="user-detail-badges-list">
                {badges.map((badge) => (
                  <li key={badge.id} className="user-detail-badge" title={badge.description || ""}>
                    <LuAward size={15} />
                    <span className="user-detail-badge-name">{badge.name}</span>
                    <span className="user-detail-badge-date">
                      {new Date(badge.obtained_at).toLocaleDateString("fr-FR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label className={`user-detail-toggle ${isAdmin ? "on" : ""}`}>
            <input
              type="checkbox"
              checked={isAdmin}
              disabled={isSelf}
              onChange={(e) => setIsAdmin(e.target.checked)}
            />
            {isAdmin ? <LuShieldCheck size={18} /> : <LuShieldOff size={18} />}
            <span>
              {isAdmin ? "Administrateur" : "Membre standard"}
              {isSelf && <em> (votre compte)</em>}
            </span>
          </label>

          {error && <div className="users-alert">{error}</div>}

          <div className="modal-actions user-detail-actions">
            <Button
              type="button"
              className="danger-button"
              disabled={isSelf}
              onClick={() => onDelete(user)}
            >
              <LuTrash2 size={16} /> Supprimer
            </Button>
            <div className="user-detail-actions-right">
              <Button type="button" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" className="active" disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
