import { useEffect, useState } from "react";
import { LuTrash2 } from "react-icons/lu";
import Button from "../ui/Button";
import { STATUS_OPTIONS, adminLabel, readableTextColor } from "./planningConstants";
import "../ui/PopUp.css";
import "./CaseDetailModal.css";
import "./TaskDetailModal.css";

export default function TaskDetailModal({ item, admins, tags = [], onClose, onSave, onDelete }) {
  const isNew = !item?.id;
  const [form, setForm] = useState(() => ({
    title: item?.title || "",
    description: item?.description || "",
    status: item?.status || "a_faire",
    assignee_id: item?.assignee_id ?? "",
    tag_ids: item?.tags?.map((t) => t.id) || [],
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // On verrouille le scroll de fond ; fermeture uniquement via les boutons.
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleTag = (tagId) =>
    setForm((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter((id) => id !== tagId)
        : [...prev.tag_ids, tagId],
    }));

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
        description: form.description,
        status: form.status,
        assignee_id: form.assignee_id === "" ? null : Number(form.assignee_id),
        tag_ids: form.tag_ids,
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
          <h2>{isNew ? "Nouvelle tâche" : "Modifier la tâche"}</h2>
          {!isNew && <span className="case-detail-meta">ID #{item.id}</span>}
        </div>

        <form onSubmit={handleSubmit} className="case-detail-form">
          <label className="case-detail-field">
            <span>Titre</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Titre de la tâche"
              autoFocus
            />
          </label>

          <label className="case-detail-field">
            <span>Description</span>
            <textarea
              rows={6}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Détails de la tâche"
            />
          </label>

          <div className="task-detail-row">
            <label className="case-detail-field">
              <span>Statut</span>
              <select value={form.status} onChange={(e) => setField("status", e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="case-detail-field">
              <span>Assigné à</span>
              <select
                value={form.assignee_id}
                onChange={(e) => setField("assignee_id", e.target.value)}
              >
                <option value="">Non assignée</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.id}>
                    {adminLabel(a)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="case-detail-field">
            <span>Étiquettes</span>
            {tags.length === 0 ? (
              <p className="task-tags-empty">
                Aucune étiquette. Créez-en depuis « Gérer les étiquettes ».
              </p>
            ) : (
              <div className="task-tags-picker">
                {tags.map((tag) => {
                  const selected = form.tag_ids.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={`task-tag-chip ${selected ? "selected" : ""}`}
                      style={
                        selected
                          ? { backgroundColor: tag.color, color: readableTextColor(tag.color), borderColor: tag.color }
                          : { borderColor: tag.color, color: "var(--text-main)" }
                      }
                      onClick={() => toggleTag(tag.id)}
                    >
                      {!selected && (
                        <span className="task-tag-dot" style={{ backgroundColor: tag.color }} />
                      )}
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && <div className="users-alert">{error}</div>}

          <div className="modal-actions case-detail-actions">
            {!isNew ? (
              <Button type="button" className="danger-button" onClick={() => onDelete(item)}>
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
