import { useEffect, useState } from "react";
import { LuRefreshCw, LuPlus, LuPencil, LuTrash2, LuGripVertical } from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import {
  getHomeCases,
  createHomeCase,
  updateHomeCase,
  deleteHomeCase,
  reorderHomeCases,
} from "../../services/apiBack";
import CaseDetailModal from "./CaseDetailModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import "../admin/UsersManager.css";
import "./CasesManager.css";

const byPosition = (a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id - b.id;

export default function CasesManager() {
  const { token } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null); // objet en édition (id) ou {} pour création
  const [toDelete, setToDelete] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [dragIndex, setDragIndex] = useState(null); // ligne en cours de déplacement
  const [overIndex, setOverIndex] = useState(null); // ligne survolée pendant le drag

  const loadCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHomeCases(token);
      setCases(Array.isArray(data) ? [...data].sort(byPosition) : []);
    } catch (err) {
      setError(err.message || "Impossible de charger les cases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSave = async (item, values) => {
    setActionError(null);
    if (item?.id) {
      const updated = await updateHomeCase(token, item.id, values);
      setCases((prev) => prev.map((c) => (c.id === item.id ? updated : c)).sort(byPosition));
    } else {
      const created = await createHomeCase(token, values);
      setCases((prev) => [...prev, created].sort(byPosition));
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setActionError(null);
    try {
      await deleteHomeCase(token, toDelete.id);
      setCases((prev) => prev.filter((c) => c.id !== toDelete.id));
      setToDelete(null);
      if (selected && selected.id === toDelete.id) setSelected(null);
    } catch (err) {
      setActionError(err.message || "Suppression impossible.");
    }
  };

  // Envoie le nouvel ordre au backend (mise à jour optimiste + resync sur erreur).
  const commitOrder = async (next) => {
    setCases(next);
    setReordering(true);
    setActionError(null);
    try {
      const data = await reorderHomeCases(token, next.map((c) => c.id));
      setCases(Array.isArray(data) ? [...data].sort(byPosition) : next);
    } catch (err) {
      setActionError(err.message || "Réordonnancement impossible.");
      loadCases(); // resynchronise en cas d'échec
    } finally {
      setReordering(false);
    }
  };

  const handleDragStart = (index) => (e) => {
    if (reordering) return;
    setDragIndex(index);
    setOverIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Firefox exige un setData pour démarrer le drag.
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (index) => (e) => {
    if (dragIndex === null) return;
    e.preventDefault(); // autorise le drop
    e.dataTransfer.dropEffect = "move";
    if (index !== overIndex) setOverIndex(index);
  };

  const handleDrop = (index) => (e) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...cases];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setDragIndex(null);
    setOverIndex(null);
    commitOrder(next);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const preview = (text) => {
    if (!text) return "—";
    return text.length > 120 ? `${text.slice(0, 120)}…` : text;
  };

  return (
    <div className="users-manager">
      <header className="users-manager-head">
        <div>
          <h1>Page d'accueil</h1>
          <p className="users-manager-sub">
            {cases.length} case{cases.length > 1 ? "s" : ""} affichée
            {cases.length > 1 ? "s" : ""} sur le site public
          </p>
        </div>
        <div className="cases-head-actions">
          <button className="users-refresh" onClick={loadCases} disabled={loading} title="Actualiser">
            <LuRefreshCw size={16} className={loading ? "spin" : ""} />
            <span>Actualiser</span>
          </button>
          <button className="cases-add" onClick={() => setSelected({})}>
            <LuPlus size={16} />
            <span>Ajouter une case</span>
          </button>
        </div>
      </header>

      {actionError && <div className="users-alert">{actionError}</div>}

      {loading ? (
        <div className="users-state">Chargement…</div>
      ) : error ? (
        <div className="users-state users-state-error">{error}</div>
      ) : cases.length === 0 ? (
        <div className="users-state">Aucune case pour le moment.</div>
      ) : (
        <ul className="cases-list">
          {cases.map((c, index) => (
            <li
              key={c.id}
              className={
                "case-row" +
                (dragIndex === index ? " dragging" : "") +
                (overIndex === index && dragIndex !== null && dragIndex !== index
                  ? " drag-over"
                  : "")
              }
              draggable={!reordering}
              onDragStart={handleDragStart(index)}
              onDragOver={handleDragOver(index)}
              onDrop={handleDrop(index)}
              onDragEnd={handleDragEnd}
              onClick={() => setSelected(c)}
            >
              <div className="case-order" onClick={(e) => e.stopPropagation()}>
                <span className="case-drag-handle" title="Glisser pour réordonner" aria-hidden="true">
                  <LuGripVertical size={16} />
                </span>
                <span className="case-order-num">{index + 1}</span>
              </div>
              <div className="case-body">
                <span className="case-title">{c.title}</span>
                <span className="case-preview">{preview(c.text)}</span>
              </div>
              <div className="case-actions" onClick={(e) => e.stopPropagation()}>
                <button className="row-action" title="Éditer" onClick={() => setSelected(c)}>
                  <LuPencil size={16} />
                </button>
                <button
                  className="row-action danger"
                  title="Supprimer"
                  onClick={() => setToDelete(c)}
                >
                  <LuTrash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <CaseDetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          onDelete={(c) => setToDelete(c)}
        />
      )}

      {toDelete && (
        <ConfirmDeleteModal
          title="Supprimer cette case ?"
          message={`La case « ${toDelete.title} » sera définitivement supprimée de la page d'accueil. Cette action est irréversible.`}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
