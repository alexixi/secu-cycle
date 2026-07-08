import { useEffect, useState } from "react";
import { LuTrash2, LuPlus, LuX } from "react-icons/lu";
import Button from "../ui/Button";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { TAG_COLORS } from "./planningConstants";
import "../ui/PopUp.css";
import "./TagsManagerModal.css";

// Ligne d'édition d'une étiquette existante. Le nom est enregistré à la perte
// de focus (ou Entrée), la couleur dès qu'elle change.
function TagRow({ tag, onUpdate, onDelete }) {
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);

  useEffect(() => {
    setName(tag.name);
    setColor(tag.color);
  }, [tag.name, tag.color]);

  const commitName = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === tag.name) {
      setName(tag.name);
      return;
    }
    onUpdate(tag.id, { name: trimmed });
  };

  const commitColor = (value) => {
    setColor(value);
    if (value !== tag.color) onUpdate(tag.id, { color: value });
  };

  return (
    <li className="tag-row">
      <input
        type="color"
        className="tag-color-input"
        value={color}
        onChange={(e) => commitColor(e.target.value)}
        title="Couleur"
      />
      <input
        type="text"
        className="tag-name-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        maxLength={50}
      />
      <button
        type="button"
        className="row-action danger"
        title="Supprimer l'étiquette"
        onClick={() => onDelete(tag)}
      >
        <LuTrash2 size={16} />
      </button>
    </li>
  );
}

export default function TagsManagerModal({ tags, onClose, onCreate, onUpdate, onDelete }) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const run = async (action) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err.message || "Opération impossible.");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      setError("Le nom de l'étiquette est obligatoire.");
      return;
    }
    setBusy(true);
    await run(async () => {
      await onCreate({ name, color: newColor });
      setNewName("");
      setNewColor(TAG_COLORS[Math.floor(tags.length + 1) % TAG_COLORS.length]);
    });
    setBusy(false);
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    await run(() => onDelete(toDelete.id));
    setToDelete(null);
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target.classList.contains("modal-overlay") && onClose()}
    >
      <div className="modal-content tags-manager-modal">
        <div className="tags-manager-header">
          <h2>Gérer les étiquettes</h2>
          <button type="button" className="row-action" title="Fermer" onClick={onClose}>
            <LuX size={18} />
          </button>
        </div>

        {tags.length === 0 ? (
          <p className="tags-manager-empty">Aucune étiquette pour le moment.</p>
        ) : (
          <ul className="tags-list">
            {tags.map((tag) => (
              <TagRow
                key={tag.id}
                tag={tag}
                onUpdate={(id, updates) => run(() => onUpdate(id, updates))}
                onDelete={setToDelete}
              />
            ))}
          </ul>
        )}

        <form className="tag-add-row" onSubmit={handleAdd}>
          <input
            type="color"
            className="tag-color-input"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            title="Couleur"
          />
          <input
            type="text"
            className="tag-name-input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nouvelle étiquette…"
            maxLength={50}
          />
          <Button type="submit" className="active" disabled={busy}>
            <LuPlus size={16} /> Ajouter
          </Button>
        </form>

        {error && <div className="users-alert">{error}</div>}

        <div className="modal-actions tags-manager-actions">
          <Button type="button" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>

      {toDelete && (
        <ConfirmDeleteModal
          title="Supprimer cette étiquette ?"
          message={`L'étiquette « ${toDelete.name} » sera retirée de toutes les tâches et définitivement supprimée.`}
          onCancel={() => setToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
