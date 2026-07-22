import { useCallback, useEffect, useRef, useState } from "react";
import {
  LuRefreshCw,
  LuCircleCheck,
  LuCircleX,
  LuLoader,
} from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import {
  getAccidentStats,
  getAccidentSyncRuns,
  getAccidentSyncSettings,
  triggerAccidentSync,
  updateAccidentSyncSettings,
} from "../../services/apiBack";
import "./UsersManager.css";
import "./PoisManager.css";

const SOURCE_LABELS = {
  baac: "France (BAAC / ONISR)",
  statbel: "Belgique (Statbel)",
};

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

export default function AccidentsManager() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [runs, setRuns] = useState([]);
  const [intervalDays, setIntervalDays] = useState("");
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
      getAccidentStats(token),
      getAccidentSyncRuns(token),
      getAccidentSyncSettings(token),
    ]);
    setStats(statsData);
    setRuns(Array.isArray(runsData) ? runsData : []);
    if (!intervalTouched.current) {
      setIntervalDays(settingsData.interval_days ? String(settingsData.interval_days) : "0");
    }
  }, [token]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await load();
    } catch (err) {
      setError(errorMessage(err, "Impossible de charger les accidents."));
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
      const run = await triggerAccidentSync(token);
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
      const parsed = Number(intervalDays);
      if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error("L'intervalle doit être un nombre entier de jours (0 = désactivé).");
      }
      await updateAccidentSyncSettings(token, { interval_days: parsed });
      intervalTouched.current = false;
      setSettingsSaved(true);
    } catch (err) {
      setActionError(errorMessage(err, "Impossible d'enregistrer l'intervalle."));
    } finally {
      setSavingSettings(false);
    }
  };

  const autoDisabled = Number(intervalDays) === 0;

  const coverage = stats?.first_year && stats?.last_year
    ? `${stats.first_year} – ${stats.last_year}`
    : null;

  return (
    <div className="users-manager">
      <header className="users-manager-head">
        <div>
          <h1>Accidents de la route</h1>
          <p className="users-manager-sub">
            {stats ? `${stats.total} accident(s) à vélo en base` : "—"}
            {coverage ? ` · Millésimes ${coverage}` : ""} · Dernière mise à jour :{" "}
            {formatDateTime(stats?.last_sync)}
          </p>
        </div>
        <button
          className="users-refresh"
          onClick={handleSync}
          disabled={loading || syncing || isRunning}
          title="Récupérer les accidents auprès des sources officielles"
        >
          <LuRefreshCw size={16} className={syncing || isRunning ? "spin" : ""} />
          <span>{isRunning ? "Récupération…" : "Synchroniser maintenant"}</span>
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
            {Object.entries(SOURCE_LABELS).map(([key, label]) => (
              <li key={key} className="pois-stat">
                <span className="pois-stat-value">{stats?.by_source?.[key] ?? 0}</span>
                <span className="pois-stat-label">{label}</span>
              </li>
            ))}
            {Object.entries(stats?.by_severity || {}).map(([label, count]) => (
              <li key={label} className="pois-stat">
                <span className="pois-stat-value">{count}</span>
                <span className="pois-stat-label">{label}</span>
              </li>
            ))}
          </ul>

          <p className="pois-settings-hint">
            Les accidents alimentent la couche « Accidentologie » de la carte et abaissent
            la note de sécurité des segments concernés. Seuls les accidents corporels
            déclarés aux forces de l'ordre y figurent : les chutes sans tiers sont très
            largement sous-déclarées.
          </p>

          <form className="pois-settings" onSubmit={handleSaveSettings}>
            <div className="pois-settings-field">
              <label htmlFor="accident-interval">Synchronisation automatique</label>
              <div className="pois-settings-input">
                <span>Tous les</span>
                <input
                  id="accident-interval"
                  type="number"
                  min="0"
                  step="1"
                  value={intervalDays}
                  onChange={(e) => {
                    intervalTouched.current = true;
                    setSettingsSaved(false);
                    setIntervalDays(e.target.value);
                  }}
                />
                <span>jours</span>
              </div>
              <p className="pois-settings-hint">
                {autoDisabled
                  ? "0 : synchronisation automatique désactivée."
                  : "Ces bases ne sont republiées qu'une fois par an : un intervalle long suffit."}
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
                      <th>Accidents</th>
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
                          <td>{formatCount(run.total_accidents)}</td>
                          <td>{formatCount(run.created_accidents)}</td>
                          <td>{formatCount(run.deleted_accidents)}</td>
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
                            {formatCount(run.total_accidents)} accidents ·{" "}
                            {formatCount(run.created_accidents)} nouveaux ·{" "}
                            {formatCount(run.deleted_accidents)} supprimés
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
