import { useEffect, useMemo, useState } from "react";
import {
  LuSearch,
  LuRefreshCw,
  LuTrash2,
  LuEye,
  LuMapPin,
  LuBan,
  LuOctagonX,
} from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import { getReportsAdmin, deleteReport, adminUpdateUser } from "../../services/apiBack";
import ReportDetailModal from "./ReportDetailModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import "./ReportsManager.css";

export const REPORT_TYPES = {
  accident: { label: "Accident", className: "type-accident", icon: "🚨" },
  travaux: { label: "Travaux", className: "type-travaux", icon: "🚧" },
  danger: { label: "Danger", className: "type-danger", icon: "⚠️" },
  obstacle: { label: "Obstacle", className: "type-obstacle", icon: "🪨" },
};

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

const authorLabel = (r) => {
  if (!r.user_id) return "Compte supprimé";
  return r.author_name || r.author_email || `Utilisateur #${r.user_id}`;
};

export default function ReportsManager() {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [actionError, setActionError] = useState(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReportsAdmin(token);
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Impossible de charger les signalements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      if (typeFilter !== "all" && r.report_type !== typeFilter) return false;
      if (statusFilter === "active" && r.is_expired) return false;
      if (statusFilter === "expired" && !r.is_expired) return false;
      if (!q) return true;
      return [r.report_description, r.author_email, r.author_name, r.report_type]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q));
    });
  }, [reports, search, typeFilter, statusFilter]);

  const activeCount = reports.filter((r) => !r.is_expired).length;

  // Applique une sanction (is_banned / reports_blocked) à l'auteur d'un signalement
  // et répercute le nouvel état sur tous ses signalements listés.
  const handleSanction = async (userId, updates) => {
    setActionError(null);
    const updatedUser = await adminUpdateUser(token, userId, updates);
    setReports((prev) =>
      prev.map((r) =>
        r.user_id === userId
          ? {
              ...r,
              author_is_banned: updatedUser.is_banned,
              author_reports_blocked: updatedUser.reports_blocked,
            }
          : r
      )
    );
    if (selected && selected.user_id === userId) {
      setSelected((s) => ({
        ...s,
        author_is_banned: updatedUser.is_banned,
        author_reports_blocked: updatedUser.reports_blocked,
      }));
    }
    return updatedUser;
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setActionError(null);
    try {
      await deleteReport(token, toDelete.id);
      setReports((prev) => prev.filter((r) => r.id !== toDelete.id));
      setToDelete(null);
      if (selected && selected.id === toDelete.id) setSelected(null);
    } catch (err) {
      setActionError(err.message || "Suppression impossible.");
    }
  };

  const renderType = (type) => {
    const meta = REPORT_TYPES[type] || { label: type || "—", className: "" };
    return <span className={`type-badge ${meta.className}`}>{meta.label}</span>;
  };

  return (
    <div className="reports-manager">
      <header className="reports-manager-head">
        <div>
          <h1>Signalements</h1>
          <p className="reports-manager-sub">
            {reports.length} signalement{reports.length > 1 ? "s" : ""} · {activeCount} actif
            {activeCount > 1 ? "s" : ""}
          </p>
        </div>
        <button className="reports-refresh" onClick={loadReports} disabled={loading} title="Actualiser">
          <LuRefreshCw size={16} className={loading ? "spin" : ""} />
          <span>Actualiser</span>
        </button>
      </header>

      <div className="reports-toolbar">
        <div className="reports-search">
          <LuSearch size={18} />
          <input
            type="text"
            placeholder="Rechercher par description ou auteur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">Tous les types</option>
          {Object.entries(REPORT_TYPES).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="expired">Expirés</option>
        </select>
      </div>

      {actionError && <div className="reports-alert">{actionError}</div>}

      {loading ? (
        <div className="reports-state">Chargement…</div>
      ) : error ? (
        <div className="reports-state reports-state-error">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="reports-state">Aucun signalement trouvé.</div>
      ) : (
        <>
          {/* Table (desktop) */}
          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Auteur</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} onClick={() => setSelected(r)}>
                    <td>{renderType(r.report_type)}</td>
                    <td className="cell-desc">{r.report_description || "—"}</td>
                    <td className="cell-author">
                      <span>{authorLabel(r)}</span>
                      {(r.author_is_banned || r.author_reports_blocked) && (
                        <span className="author-flags">
                          {r.author_is_banned && (
                            <span className="flag flag-ban" title="Banni">
                              <LuBan size={12} /> Banni
                            </span>
                          )}
                          {r.author_reports_blocked && (
                            <span className="flag flag-block" title="Signalements bloqués">
                              <LuOctagonX size={12} /> Bloqué
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td>{formatDateTime(r.created_at)}</td>
                    <td>
                      <span className={`status-badge ${r.is_expired ? "expired" : "active"}`}>
                        {r.is_expired ? "Expiré" : "Actif"}
                      </span>
                    </td>
                    <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                      <a
                        className="row-action"
                        title="Voir sur la carte"
                        href={`https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}#map=17/${r.latitude}/${r.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <LuMapPin size={16} />
                      </a>
                      <button className="row-action" title="Détails" onClick={() => setSelected(r)}>
                        <LuEye size={16} />
                      </button>
                      <button
                        className="row-action danger"
                        title="Supprimer le signalement"
                        onClick={() => setToDelete(r)}
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
          <ul className="reports-cards">
            {filtered.map((r) => (
              <li key={r.id} className="report-card" onClick={() => setSelected(r)}>
                <div className="report-card-top">
                  {renderType(r.report_type)}
                  <span className={`status-badge ${r.is_expired ? "expired" : "active"}`}>
                    {r.is_expired ? "Expiré" : "Actif"}
                  </span>
                </div>
                <p className="report-card-desc">{r.report_description || "—"}</p>
                <div className="report-card-meta">
                  <span>{authorLabel(r)}</span>
                  <span>{formatDateTime(r.created_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {selected && (
        <ReportDetailModal
          report={selected}
          typeMeta={REPORT_TYPES[selected.report_type]}
          onClose={() => setSelected(null)}
          onDeleteReport={(r) => setToDelete(r)}
          onSanction={handleSanction}
        />
      )}

      {toDelete && (
        <ConfirmDeleteModal
          title="Supprimer ce signalement ?"
          message="Ce signalement sera définitivement retiré de la carte. Cette action est irréversible."
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
