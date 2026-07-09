import { useEffect, useMemo, useState } from "react";
import { LuSearch, LuRefreshCw, LuTrash2, LuEye, LuShieldCheck, LuUser } from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import { getAllUsers, adminUpdateUser, adminDeleteUser } from "../../services/apiBack";
import UserDetailModal from "./UserDetailModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import "./UsersManager.css";

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

const fullName = (u) => {
  const name = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return name || "—";
};

export default function UsersManager() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [actionError, setActionError] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUsers(token);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.email, u.first_name, u.last_name]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [users, search]);

  const handleSave = async (userId, updates) => {
    setActionError(null);
    const updated = await adminUpdateUser(token, userId, updates);
    setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    setSelected(updated);
    return updated;
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setActionError(null);
    try {
      await adminDeleteUser(token, toDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== toDelete.id));
      setToDelete(null);
      if (selected && selected.id === toDelete.id) setSelected(null);
    } catch (err) {
      setActionError(err.message || "Suppression impossible.");
    }
  };

  const adminCount = users.filter((u) => u.is_admin).length;

  return (
    <div className="users-manager">
      <header className="users-manager-head">
        <div>
          <h1>Utilisateurs</h1>
          <p className="users-manager-sub">
            {users.length} compte{users.length > 1 ? "s" : ""} · {adminCount} administrateur
            {adminCount > 1 ? "s" : ""}
          </p>
        </div>
        <button className="users-refresh" onClick={loadUsers} disabled={loading} title="Actualiser">
          <LuRefreshCw size={16} className={loading ? "spin" : ""} />
          <span>Actualiser</span>
        </button>
      </header>

      <div className="users-search">
        <LuSearch size={18} />
        <input
          type="text"
          placeholder="Rechercher par nom ou e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {actionError && <div className="users-alert">{actionError}</div>}

      {loading ? (
        <div className="users-state">Chargement…</div>
      ) : error ? (
        <div className="users-state users-state-error">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="users-state">Aucun utilisateur trouvé.</div>
      ) : (
        <>
          {/* Table (desktop) */}
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>E-mail</th>
                  <th>Niveau</th>
                  <th>Rôle</th>
                  <th>Inscrit le</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} onClick={() => setSelected(u)}>
                    <td className="cell-name">{fullName(u)}</td>
                    <td className="cell-email">{u.email}</td>
                    <td>{u.sport_level || "—"}</td>
                    <td>
                      {u.is_admin ? (
                        <span className="role-badge role-admin">
                          <LuShieldCheck size={13} /> Admin
                        </span>
                      ) : (
                        <span className="role-badge">
                          <LuUser size={13} /> Membre
                        </span>
                      )}
                    </td>
                    <td>{formatDate(u.created_at)}</td>
                    <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="row-action" title="Voir" onClick={() => setSelected(u)}>
                        <LuEye size={16} />
                      </button>
                      <button
                        className="row-action danger"
                        title="Supprimer"
                        disabled={u.id === currentUser?.id}
                        onClick={() => setToDelete(u)}
                      >
                        <LuTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartes (mobile) */}
          <ul className="users-cards">
            {filtered.map((u) => (
              <li key={u.id} className="user-card" onClick={() => setSelected(u)}>
                <div className="user-card-main">
                  <span className="user-card-name">{fullName(u)}</span>
                  <span className="user-card-email">{u.email}</span>
                </div>
                {u.is_admin ? (
                  <span className="role-badge role-admin">
                    <LuShieldCheck size={13} /> Admin
                  </span>
                ) : (
                  <span className="role-badge">
                    <LuUser size={13} /> Membre
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {selected && (
        <UserDetailModal
          user={selected}
          currentUserId={currentUser?.id}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          onDelete={(u) => setToDelete(u)}
        />
      )}

      {toDelete && (
        <ConfirmDeleteModal
          user={toDelete}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
