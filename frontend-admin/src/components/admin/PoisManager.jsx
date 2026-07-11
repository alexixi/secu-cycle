import { useCallback, useEffect, useRef, useState } from "react";
import {
  LuRefreshCw,
  LuDroplet,
  LuToilet,
  LuSquareParking,
  LuWrench,
  LuCircleCheck,
  LuCircleX,
  LuLoader,
} from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import {
  getPoiStats,
  getPoiSyncRuns,
  getPoiSyncSettings,
  triggerPoiSync,
  updatePoiSyncSettings,
} from "../../services/apiBack";
import "./UsersManager.css";
import "./PoisManager.css";

const CATEGORIES = [
  { key: "water", label: "Points d'eau", icon: LuDroplet },
  { key: "toilets", label: "Toilettes", icon: LuToilet },
  { key: "parking", label: "Stationnements", icon: LuSquareParking },
  { key: "repair", label: "Réparation", icon: LuWrench },
];

const TRIGGER_LABELS = { manual: "Manuel", auto: "Automatique" };

const STATUS_LABELS = {
  running: "En cours",
  success: "Réussie",
  failed: "Échouée",
};

const STATUS_ICONS = {
  running: LuLoader,
  success: LuCircleCheck,
  failed: LuCircleX,
};

const POLL_INTERVAL_MS = 5000;

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

const formatCount = (value) => (value === null || value === undefined ? "—" : value);

const errorMessage = (err, fallback) => {
  try {
    const detail = JSON.parse(err.message)?.detail;
    if (typeof detail === "string") return detail;
  } catch {
  }
  return err.message || fallback;
};

export default function PoisManager() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [runs, setRuns] = useState([]);
  const [intervalHours, setIntervalHours] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const intervalTouched = useRef(false);

  const isRunning = runs.some((run) => run.status === "running");

  const load = useCallback(async () => {
    const [statsData, runsData, settingsData] = await Promise.all([
      getPoiStats(token),
      getPoiSyncRuns(token),
      getPoiSyncSettings(token),
    ]);
    setStats(statsData);
    setRuns(Array.isArray(runsData) ? runsData : []);
    if (!intervalTouched.current) {
      setIntervalHours(settingsData.interval_hours ? String(settingsData.interval_hours) : "0");
    }
  }, [token]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await load();
    } catch (err) {
      setError(errorMessage(err, "Impossible de charger les points d'intérêt."));
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      load().catch(() => {
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isRunning, load]);

  const handleSync = async () => {
    setActionError(null);
    setSyncing(true);
    try {
      const run = await triggerPoiSync(token);
      setRuns((prev) => [run, ...prev]);
    } catch (err) {
      setActionError(errorMessage(err, "Impossible de lancer la synchronisation."));
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setActionError(null);
    setSettingsSaved(false);
    setSavingSettings(true);
    try {
      const parsed = Number(intervalHours);
      if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error("L'intervalle doit être un nombre entier d'heures (0 = désactivé).");
      }
      await updatePoiSyncSettings(token, { interval_hours: parsed });
      intervalTouched.current = false;
      setSettingsSaved(true);
    } catch (err) {
      setActionError(errorMessage(err, "Impossible d'enregistrer l'intervalle."));
    } finally {
      setSavingSettings(false);
    }
  };

  const autoDisabled = Number(intervalHours) === 0;

  return (
    <div className="users-manager">
      <header className="users-manager-head">
        <div>
          <h1>Points d'intérêt</h1>
          <p className="users-manager-sub">
            {stats ? `${stats.total} POI en base` : "—"} · Dernière mise à jour :{" "}
            {formatDateTime(stats?.last_sync)}
          </p>
        </div>
        <button
          className="users-refresh"
          onClick={handleSync}
          disabled={loading || syncing || isRunning}
          title="Récupérer les points d'intérêt depuis OpenStreetMap"
        >
          <LuRefreshCw size={16} className={syncing || isRunning ? "spin" : ""} />
          <span>{isRunning ? "Synchronisation…" : "Synchroniser maintenant"}</span>
        </button>
      </header>

      {actionError && <div className="users-alert">{actionError}</div>}

      {loading ? (
        <div className="users-state">Chargement…</div>
      ) : error ? (
        <div className="users-state users-state-error">{error}</div>
      ) : (
        <>
          <ul className="pois-stats">
            {CATEGORIES.map(({ key, label, icon: Icon }) => (
              <li key={key} className="pois-stat">
                <span className="pois-stat-icon">
                  <Icon size={18} />
                </span>
                <span className="pois-stat-value">{stats?.by_category?.[key] ?? 0}</span>
                <span className="pois-stat-label">{label}</span>
              </li>
            ))}
          </ul>

          <form className="pois-settings" onSubmit={handleSaveSettings}>
            <div className="pois-settings-field">
              <label htmlFor="poi-interval">Synchronisation automatique</label>
              <div className="pois-settings-input">
                <span>Toutes les</span>
                <input
                  id="poi-interval"
                  type="number"
                  min="0"
                  step="1"
                  value={intervalHours}
                  onChange={(e) => {
                    intervalTouched.current = true;
                    setSettingsSaved(false);
                    setIntervalHours(e.target.value);
                  }}
                />
                <span>heures</span>
              </div>
              <p className="pois-settings-hint">
                {autoDisabled
                  ? "0 : synchronisation automatique désactivée."
                  : "Les données OpenStreetMap seront rafraîchies à cet intervalle."}
              </p>
            </div>
            <button type="submit" className="users-refresh" disabled={savingSettings}>
              {savingSettings ? "Enregistrement…" : settingsSaved ? "Enregistré ✓" : "Enregistrer"}
            </button>
          </form>

          <h2 className="pois-section-title">Historique des récupérations</h2>

          {runs.length === 0 ? (
            <div className="users-state">Aucune synchronisation pour le moment.</div>
          ) : (
            <>
              <div className="users-table-wrap">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Date et heure</th>
                      <th>POI</th>
                      <th>Nouveaux</th>
                      <th>Supprimés</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((run) => {
                      const StatusIcon = STATUS_ICONS[run.status];
                      return (
                        <tr key={run.id}>
                          <td className="cell-name">{TRIGGER_LABELS[run.trigger] || run.trigger}</td>
                          <td>{formatDateTime(run.started_at)}</td>
                          <td>{formatCount(run.total_pois)}</td>
                          <td>{formatCount(run.created_pois)}</td>
                          <td>{formatCount(run.deleted_pois)}</td>
                          <td>
                            <span className={`pois-status pois-status-${run.status}`} title={run.error || ""}>
                              {StatusIcon && (
                                <StatusIcon size={13} className={run.status === "running" ? "spin" : ""} />
                              )}
                              {STATUS_LABELS[run.status] || run.status}
                            </span>
                            {run.status === "failed" && run.error && (
                              <p className="pois-error">{run.error}</p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="users-cards">
                {runs.map((run) => {
                  const StatusIcon = STATUS_ICONS[run.status];
                  return (
                    <li key={run.id} className="user-card pois-card">
                      <div className="user-card-main">
                        <span className="user-card-name">
                          {TRIGGER_LABELS[run.trigger] || run.trigger}
                        </span>
                        <span className="user-card-email">{formatDateTime(run.started_at)}</span>
                        {run.status === "success" && (
                          <span className="user-card-email">
                            {formatCount(run.total_pois)} POI · {formatCount(run.created_pois)} nouveaux ·{" "}
                            {formatCount(run.deleted_pois)} supprimés
                          </span>
                        )}
                        {run.status === "failed" && run.error && (
                          <span className="pois-error">{run.error}</span>
                        )}
                      </div>
                      <span className={`pois-status pois-status-${run.status}`}>
                        {StatusIcon && (
                          <StatusIcon size={13} className={run.status === "running" ? "spin" : ""} />
                        )}
                        {STATUS_LABELS[run.status] || run.status}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
