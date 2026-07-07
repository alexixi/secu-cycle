import { useEffect, useState } from "react";
import { LuTrash2 } from "react-icons/lu";
import Button from "../ui/Button";
import "../ui/PopUp.css";
import "./CaseDetailModal.css";

export default function CaseDetailModal({ item, onClose, onSave, onDelete }) {
  const isNew = !item?.id;
  const [form, setForm] = useState(() => ({
    title: item?.title || "",
    text: item?.text || "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // On verrouille le scroll de fond ; la fermeture ne se fait qu'avec les
    // boutons Annuler / Enregistrer (pas de clic à côté ni d'Échap) afin de ne
    // pas perdre une saisie en cours par mégarde.
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }
    setSaving(true);
    try {
      await onSave(item, {
        title: form.title.trim(),
        text: form.text,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content case-detail-modal">
        <div className="case-detail-header">
          <h2>{isNew ? "Nouvelle case" : "Modifier la case"}</h2>
          {!isNew && <span className="case-detail-meta">ID #{item.id}</span>}
        </div>

        <form onSubmit={handleSubmit} className="case-detail-form">
          <label className="case-detail-field">
            <span>Titre</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Titre de la case"
              autoFocus
            />
          </label>

          <label className="case-detail-field">
            <span>Texte</span>
            <textarea
              rows={8}
              value={form.text}
              onChange={(e) => setField("text", e.target.value)}
              placeholder="Contenu de la case"
            />
          </label>

          {error && <div className="users-alert">{error}</div>}

          <div className="modal-actions case-detail-actions">
            {!isNew ? (
              <Button
                type="button"
                className="danger-button"
                onClick={() => onDelete(item)}
              >
                <LuTrash2 size={16} /> Supprimer
              </Button>
            ) : (
              <span />
            )}
            <div className="case-detail-actions-right">
              <Button type="button" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" className="active" disabled={saving}>
                {saving ? "Enregistrement…" : isNew ? "Créer" : "Enregistrer"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
