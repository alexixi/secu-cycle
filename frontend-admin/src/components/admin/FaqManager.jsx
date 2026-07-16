import { useEffect, useState } from "react";
import { LuRefreshCw, LuPlus, LuPencil, LuTrash2, LuGripVertical } from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import {
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs,
} from "../../services/apiBack";
import FaqDetailModal from "./FaqDetailModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import "../admin/UsersManager.css";
import "./FaqManager.css";

const byPosition = (a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id - b.id;

export default function FaqManager() {
  const { token } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const loadFaqs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFaqs(token);
      setFaqs(Array.isArray(data) ? [...data].sort(byPosition) : []);
    } catch (err) {
      setError(err.message || "Impossible de charger la FAQ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSave = async (item, values) => {
    setActionError(null);
    if (item?.id) {
      const updated = await updateFaq(token, item.id, values);
      setFaqs((prev) => prev.map((f) => (f.id === item.id ? updated : f)).sort(byPosition));
    } else {
      const created = await createFaq(token, values);
      setFaqs((prev) => [...prev, created].sort(byPosition));
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setActionError(null);
    try {
      await deleteFaq(token, toDelete.id);
      setFaqs((prev) => prev.filter((f) => f.id !== toDelete.id));
      setToDelete(null);
      if (selected && selected.id === toDelete.id) setSelected(null);
    } catch (err) {
      setActionError(err.message || "Suppression impossible.");
    }
  };

  const commitOrder = async (next) => {
    setFaqs(next);
    setReordering(true);
    setActionError(null);
    try {
      const data = await reorderFaqs(token, next.map((f) => f.id));
      setFaqs(Array.isArray(data) ? [...data].sort(byPosition) : next);
    } catch (err) {
      setActionError(err.message || "Réordonnancement impossible.");
      loadFaqs();
    } finally {
      setReordering(false);
    }
  };

  const handleDragStart = (index) => (e) => {
    if (reordering) return;
    setDragIndex(index);
    setOverIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (index) => (e) => {
    if (dragIndex === null) return;
    e.preventDefault();
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
    const next = [...faqs];
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

  const publishedCount = faqs.filter((f) => f.is_published).length;

  return (
    <div className="users-manager">
      <header className="users-manager-head">
        <div>
          <h1>FAQ</h1>
          <p className="users-manager-sub">
            {faqs.length} question{faqs.length > 1 ? "s" : ""} · {publishedCount} publiée
            {publishedCount > 1 ? "s" : ""} sur le site public
          </p>
        </div>
        <div className="cases-head-actions">
          <button className="users-refresh" onClick={loadFaqs} disabled={loading} title="Actualiser">
            <LuRefreshCw size={16} className={loading ? "spin" : ""} />
            <span>Actualiser</span>
          </button>
          <button className="cases-add" onClick={() => setSelected({})}>
            <LuPlus size={16} />
            <span>Ajouter une question</span>
          </button>
        </div>
      </header>

      {actionError && <div className="users-alert">{actionError}</div>}

      {loading ? (
        <div className="users-state">Chargement…</div>
      ) : error ? (
        <div className="users-state users-state-error">{error}</div>
      ) : faqs.length === 0 ? (
        <div className="users-state">Aucune question pour le moment.</div>
      ) : (
        <ul className="cases-list">
          {faqs.map((f, index) => (
            <li
              key={f.id}
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
              onClick={() => setSelected(f)}
            >
              <div className="case-order" onClick={(e) => e.stopPropagation()}>
                <span className="case-drag-handle" title="Glisser pour réordonner" aria-hidden="true">
                  <LuGripVertical size={16} />
                </span>
                <span className="case-order-num">{index + 1}</span>
              </div>
              <div className="case-body">
                <span className="case-title">
                  {f.question}
                  {!f.is_published && <span className="faq-draft-badge">Brouillon</span>}
                </span>
                <span className="case-preview">{preview(f.answer)}</span>
              </div>
              <div className="case-actions" onClick={(e) => e.stopPropagation()}>
                <button className="row-action" title="Éditer" onClick={() => setSelected(f)}>
                  <LuPencil size={16} />
                </button>
                <button
                  className="row-action danger"
                  title="Supprimer"
                  onClick={() => setToDelete(f)}
                >
                  <LuTrash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <FaqDetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          onDelete={(f) => setToDelete(f)}
        />
      )}

      {toDelete && (
        <ConfirmDeleteModal
          title="Supprimer cette question ?"
          message={`La question « ${toDelete.question} » sera définitivement supprimée de la FAQ. Cette action est irréversible.`}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
