import { useEffect, useState } from "react";
import { LuTrash2 } from "react-icons/lu";
import Button from "../ui/Button";
import "../ui/PopUp.css";
import "./FaqDetailModal.css";

export default function FaqDetailModal({ item, onClose, onSave, onDelete }) {
  const isNew = !item?.id;
  const [form, setForm] = useState(() => ({
    question: item?.question || "",
    answer: item?.answer || "",
    is_published: item?.is_published ?? true,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.question.trim()) {
      setError("La question est obligatoire.");
      return;
    }
    setSaving(true);
    try {
      await onSave(item, {
        question: form.question.trim(),
        answer: form.answer,
        is_published: form.is_published,
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
          <h2>{isNew ? "Nouvelle question" : "Modifier la question"}</h2>
          {!isNew && <span className="case-detail-meta">ID #{item.id}</span>}
        </div>

        <form onSubmit={handleSubmit} className="case-detail-form">
          <label className="case-detail-field">
            <span>Question</span>
            <input
              type="text"
              value={form.question}
              onChange={(e) => setField("question", e.target.value)}
              placeholder="Intitulé de la question"
              autoFocus
            />
          </label>

          <label className="case-detail-field">
            <span>Réponse</span>
            <textarea
              rows={8}
              value={form.answer}
              onChange={(e) => setField("answer", e.target.value)}
              placeholder="Réponse affichée sur la page FAQ"
            />
          </label>

          <label className="faq-detail-publish">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setField("is_published", e.target.checked)}
            />
            <span>
              Publiée
              <span className="faq-detail-publish-hint">
                Décochez pour préparer la question sans l'afficher sur le site public.
              </span>
            </span>
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
