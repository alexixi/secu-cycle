import { useEffect, useMemo, useState } from "react";
import { LuRefreshCw, LuPlus, LuPencil, LuTrash2, LuUser, LuUserX } from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import {
  getTasks,
  getAdmins,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
} from "../../services/apiBack";
import TaskDetailModal from "./TaskDetailModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { STATUS_OPTIONS, adminLabel } from "./planningConstants";
import "../admin/UsersManager.css";
import "./PlanningManager.css";

const byPosition = (a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id - b.id;

export default function PlanningManager() {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [selected, setSelected] = useState(null); // tâche en édition (id) ou {} pour création
  const [toDelete, setToDelete] = useState(null);
  const [reordering, setReordering] = useState(false);

  // Filtre : { type: 'all' | 'mine' | 'unassigned' | 'other', adminId }
  const [filter, setFilter] = useState({ type: "all", adminId: null });

  // Drag & drop natif
  const [dragId, setDragId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [taskData, adminData] = await Promise.all([getTasks(token), getAdmins(token)]);
      setTasks(Array.isArray(taskData) ? taskData : []);
      setAdmins(Array.isArray(adminData) ? adminData : []);
    } catch (err) {
      setError(err.message || "Impossible de charger le planning.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const matchesFilter = (task) => {
    switch (filter.type) {
      case "mine":
        return task.assignee_id === user?.id;
      case "unassigned":
        return task.assignee_id == null;
      case "other":
        return task.assignee_id === filter.adminId;
      default:
        return true;
    }
  };

  const visibleTasks = useMemo(
    () => tasks.filter(matchesFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, filter, user],
  );

  // Tâches visibles regroupées par colonne, triées par position.
  const columns = useMemo(() => {
    const grouped = {};
    STATUS_OPTIONS.forEach((s) => (grouped[s.key] = []));
    visibleTasks.forEach((t) => {
      if (grouped[t.status]) grouped[t.status].push(t);
    });
    Object.values(grouped).forEach((list) => list.sort(byPosition));
    return grouped;
  }, [visibleTasks]);

  const otherAdmins = useMemo(
    () => admins.filter((a) => a.id !== user?.id),
    [admins, user],
  );

  // --- CRUD ---

  const handleSave = async (item, values) => {
    setActionError(null);
    if (item?.id) {
      const updated = await updateTask(token, item.id, values);
      setTasks((prev) => prev.map((t) => (t.id === item.id ? updated : t)));
    } else {
      const created = await createTask(token, values);
      setTasks((prev) => [...prev, created]);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setActionError(null);
    try {
      await deleteTask(token, toDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== toDelete.id));
      setToDelete(null);
      if (selected && selected.id === toDelete.id) setSelected(null);
    } catch (err) {
      setActionError(err.message || "Suppression impossible.");
    }
  };

  // --- Drag & drop : déplace une tâche vers une colonne, avant `beforeId`
  // (ou en fin de colonne si null). Recalcule les positions des colonnes
  // impactées et envoie le tout au backend (optimiste + resync sur erreur). ---

  const moveTask = async (taskId, targetStatus, beforeId) => {
    const dragged = tasks.find((t) => t.id === taskId);
    if (!dragged) return;

    const sourceStatus = dragged.status;

    // Colonne cible reconstruite à partir de TOUTES les tâches (hors filtre)
    // pour ne pas casser l'ordre des tâches masquées.
    const targetList = tasks
      .filter((t) => t.status === targetStatus && t.id !== taskId)
      .sort(byPosition);

    let insertAt = targetList.findIndex((t) => t.id === beforeId);
    if (insertAt === -1) insertAt = targetList.length; // fin de colonne
    targetList.splice(insertAt, 0, { ...dragged, status: targetStatus });

    const items = targetList.map((t, index) => ({
      id: t.id,
      status: targetStatus,
      position: index,
    }));

    // Si la tâche change de colonne, on renumérote aussi la colonne source.
    if (sourceStatus !== targetStatus) {
      const sourceList = tasks
        .filter((t) => t.status === sourceStatus && t.id !== taskId)
        .sort(byPosition);
      sourceList.forEach((t, index) =>
        items.push({ id: t.id, status: sourceStatus, position: index }),
      );
    }

    // Rien n'a changé (même colonne, même place) → on évite l'appel réseau.
    const changed = items.some((it) => {
      const t = tasks.find((x) => x.id === it.id);
      return !t || t.status !== it.status || t.position !== it.position;
    });
    if (!changed) return;

    // Mise à jour optimiste.
    const byId = new Map(items.map((it) => [it.id, it]));
    setTasks((prev) =>
      prev.map((t) =>
        byId.has(t.id) ? { ...t, status: byId.get(t.id).status, position: byId.get(t.id).position } : t,
      ),
    );

    setReordering(true);
    setActionError(null);
    try {
      const data = await reorderTasks(token, items);
      if (Array.isArray(data)) setTasks(data);
    } catch (err) {
      setActionError(err.message || "Déplacement impossible.");
      load(); // resynchronise en cas d'échec
    } finally {
      setReordering(false);
    }
  };

  const clearDrag = () => {
    setDragId(null);
    setDragOverCol(null);
  };

  const handleCardDragStart = (task) => (e) => {
    if (reordering) return;
    setDragId(task.id);
    setDragOverCol(task.status);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(task.id)); // requis par Firefox
  };

  const handleCardDragOver = (task) => (e) => {
    if (dragId === null) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== task.status) setDragOverCol(task.status);
  };

  const handleCardDrop = (task) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragId !== null && dragId !== task.id) {
      moveTask(dragId, task.status, task.id);
    }
    clearDrag();
  };

  const handleColumnDragOver = (status) => (e) => {
    if (dragId === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== status) setDragOverCol(status);
  };

  const handleColumnDrop = (status) => (e) => {
    e.preventDefault();
    if (dragId !== null) moveTask(dragId, status, null);
    clearDrag();
  };

  const FILTER_TABS = [
    { type: "all", label: "Toutes" },
    { type: "mine", label: "Mes tâches" },
    { type: "unassigned", label: "Non assignées" },
  ];

  return (
    <div className="planning-manager">
      <header className="users-manager-head">
        <div>
          <h1>Planning</h1>
          <p className="users-manager-sub">
            {visibleTasks.length} tâche{visibleTasks.length > 1 ? "s" : ""} affichée
            {visibleTasks.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="cases-head-actions">
          <button className="users-refresh" onClick={load} disabled={loading} title="Actualiser">
            <LuRefreshCw size={16} className={loading ? "spin" : ""} />
            <span>Actualiser</span>
          </button>
          <button className="cases-add" onClick={() => setSelected({})}>
            <LuPlus size={16} />
            <span>Ajouter une tâche</span>
          </button>
        </div>
      </header>

      <div className="planning-filters">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.type}
            className={`planning-filter-tab ${filter.type === tab.type ? "active" : ""}`}
            onClick={() => setFilter({ type: tab.type, adminId: null })}
          >
            {tab.label}
          </button>
        ))}
        <select
          className={`planning-filter-select ${filter.type === "other" ? "active" : ""}`}
          value={filter.type === "other" ? String(filter.adminId) : ""}
          onChange={(e) =>
            e.target.value
              ? setFilter({ type: "other", adminId: Number(e.target.value) })
              : setFilter({ type: "all", adminId: null })
          }
        >
          <option value="">Un autre admin…</option>
          {otherAdmins.map((a) => (
            <option key={a.id} value={a.id}>
              {adminLabel(a)}
            </option>
          ))}
        </select>
      </div>

      {actionError && <div className="users-alert">{actionError}</div>}

      {loading ? (
        <div className="users-state">Chargement…</div>
      ) : error ? (
        <div className="users-state users-state-error">{error}</div>
      ) : (
        <div className="planning-board">
          {STATUS_OPTIONS.map((col) => {
            const list = columns[col.key] || [];
            return (
              <section
                key={col.key}
                className={`planning-column ${dragOverCol === col.key && dragId !== null ? "drag-over" : ""}`}
                onDragOver={handleColumnDragOver(col.key)}
                onDrop={handleColumnDrop(col.key)}
              >
                <header className="planning-column-head">
                  <span className={`planning-column-dot dot-${col.key}`} />
                  <h2>{col.label}</h2>
                  <span className="planning-column-count">{list.length}</span>
                </header>

                <div className="planning-column-body">
                  {list.length === 0 ? (
                    <p className="planning-column-empty">Aucune tâche</p>
                  ) : (
                    list.map((task) => (
                      <article
                        key={task.id}
                        className={`planning-card ${dragId === task.id ? "dragging" : ""}`}
                        draggable={!reordering}
                        onDragStart={handleCardDragStart(task)}
                        onDragOver={handleCardDragOver(task)}
                        onDrop={handleCardDrop(task)}
                        onDragEnd={clearDrag}
                        onClick={() => setSelected(task)}
                      >
                        <div className="planning-card-top">
                          <span className="planning-card-title">{task.title}</span>
                          <div className="planning-card-actions" onClick={(e) => e.stopPropagation()}>
                            <button className="row-action" title="Éditer" onClick={() => setSelected(task)}>
                              <LuPencil size={15} />
                            </button>
                            <button
                              className="row-action danger"
                              title="Supprimer"
                              onClick={() => setToDelete(task)}
                            >
                              <LuTrash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {task.description && (
                          <p className="planning-card-desc">
                            {task.description.length > 140
                              ? `${task.description.slice(0, 140)}…`
                              : task.description}
                          </p>
                        )}

                        <div className="planning-card-footer">
                          {task.assignee ? (
                            <span className="planning-assignee">
                              <LuUser size={13} />
                              {adminLabel(task.assignee)}
                            </span>
                          ) : (
                            <span className="planning-assignee unassigned">
                              <LuUserX size={13} />
                              Non assignée
                            </span>
                          )}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {selected && (
        <TaskDetailModal
          item={selected}
          admins={admins}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          onDelete={(t) => setToDelete(t)}
        />
      )}

      {toDelete && (
        <ConfirmDeleteModal
          title="Supprimer cette tâche ?"
          message={`La tâche « ${toDelete.title} » sera définitivement supprimée. Cette action est irréversible.`}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
