import { useEffect, useState } from "react";
import { LuShieldCheck, LuShieldOff, LuTrash2 } from "react-icons/lu";
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

const emptyToNull = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v]));

export default function UserDetailModal({ user, currentUserId, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(() => ({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    sport_level: user.sport_level || "",
    home_address: user.home_address || "",
    work_address: user.work_address || "",
    is_admin: !!user.is_admin,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isSelf = user.id === currentUserId;

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

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave(user.id, emptyToNull(form));
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
              <label key={key} className="user-detail-field">
                <span>{label}</span>
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                />
              </label>
            ))}
          </div>

          <label className={`user-detail-toggle ${form.is_admin ? "on" : ""}`}>
            <input
              type="checkbox"
              checked={form.is_admin}
              disabled={isSelf}
              onChange={(e) => setField("is_admin", e.target.checked)}
            />
            {form.is_admin ? <LuShieldCheck size={18} /> : <LuShieldOff size={18} />}
            <span>
              {form.is_admin ? "Administrateur" : "Membre standard"}
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
