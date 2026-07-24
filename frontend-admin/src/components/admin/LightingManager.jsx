import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LuRefreshCw,
  LuCircleCheck,
  LuCircleX,
  LuLoader,
  LuSearch,
} from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import {
  getCommuneLighting,
  getGraphProfiles,
  getStreetlightStats,
  getStreetlightSyncRuns,
  getStreetlightSyncSettings,
  triggerStreetlightSync,
  updateCommuneLighting,
  updateGraphProfile,
  updateStreetlightSyncSettings,
} from "../../services/apiBack";
import "./UsersManager.css";
import "./PoisManager.css";
import "./LightingManager.css";

const SOURCE_LABELS = {
  osm: "OpenStreetMap",
  bordeaux: "Bordeaux Métropole",
  nantes: "Nantes Métropole",
  strasbourg: "Eurométropole de Strasbourg",
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

const hourToInput = (value) => (value === null || value === undefined ? "" : String(value));

// « 0 » est une heure valide (minuit) : on teste la chaîne vide, pas la véracité.
const inputToHour = (value) =>
  value === "" || value === null || value === undefined ? null : Number(value);

/** Une fenêtre est exploitable seulement si ses DEUX heures sont renseignées. */
const isFilled = (row) =>
  Boolean(row) && row.start !== "" && row.start != null && row.end !== "" && row.end != null;

/** Les lignes renvoyées par l'API, indexées par clé et prêtes pour les champs. */
const toWindowMap = (rows, keyOf) =>
  (Array.isArray(rows) ? rows : []).reduce((acc, row) => {
    acc[keyOf(row)] = {
      start: hourToInput(row.night_extinction_start),
      end: hourToInput(row.night_extinction_end),
    };
    return acc;
  }, {});

const errorMessage = (err, fallback) => {
  try {
    const detail = JSON.parse(err.message)?.detail;
    if (typeof detail === "string") return detail;
  } catch {
  }
  return err.message || fallback;
};

export default function LightingManager() {
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

  // Horaires d'extinction : défaut par emprise (indexé par id de profil) et
  // horaires par commune (indexés par nom, partagés entre profils).
  const [profiles, setProfiles] = useState([]);
  const [defaults, setDefaults] = useState({});
  const [schedules, setSchedules] = useState({});
  const [communeSearch, setCommuneSearch] = useState("");
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [defaultsSaved, setDefaultsSaved] = useState(false);
  const [savingSchedules, setSavingSchedules] = useState(false);
  const [schedulesSaved, setSchedulesSaved] = useState(false);

  const intervalTouched = useRef(false);
  // Une synchro en cours déclenche un rechargement toutes les 5 s : sans ce
  // garde-fou, il écraserait les heures en cours de saisie.
  const windowsTouched = useRef(false);

  const isRunning = runs.some((run) => run.status === "running");

  const load = useCallback(async () => {
    const [statsData, runsData, settingsData, profilesData, communeData] = await Promise.all([
      getStreetlightStats(token),
      getStreetlightSyncRuns(token),
      getStreetlightSyncSettings(token),
      getGraphProfiles(token),
      getCommuneLighting(token),
    ]);
    setStats(statsData);
    setRuns(Array.isArray(runsData) ? runsData : []);
    if (!intervalTouched.current) {
      setIntervalDays(settingsData.interval_days ? String(settingsData.interval_days) : "0");
    }
    setProfiles(Array.isArray(profilesData) ? profilesData : []);
    if (!windowsTouched.current) {
      setDefaults(toWindowMap(profilesData, (p) => p.id));
      setSchedules(toWindowMap(communeData, (row) => row.commune));
    }
  }, [token]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await load();
    } catch (err) {
      setError(errorMessage(err, "Impossible de charger l'éclairage."));
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
      const run = await triggerStreetlightSync(token);
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
      await updateStreetlightSyncSettings(token, { interval_days: parsed });
      intervalTouched.current = false;
      setSettingsSaved(true);
    } catch (err) {
      setActionError(errorMessage(err, "Impossible d'enregistrer l'intervalle."));
    } finally {
      setSavingSettings(false);
    }
  };

  const autoDisabled = Number(intervalDays) === 0;

  // Un horaire est attaché à la commune, pas au profil : on présente l'union de
  // toutes les communes connues. Y compris celles dont l'horaire subsiste alors
  // qu'elles ont été retirées de tous les profils — sans quoi il deviendrait
  // invisible et ineffaçable.
  const communes = useMemo(() => {
    const names = new Set();
    profiles.forEach((profile) => (profile.communes || []).forEach((c) => names.add(c)));
    Object.keys(schedules).forEach((c) => names.add(c));
    return [...names].sort((a, b) => a.localeCompare(b, "fr"));
  }, [profiles, schedules]);

  const shownCommunes = useMemo(() => {
    const query = communeSearch.trim().toLowerCase();
    if (!query) return communes;
    return communes.filter((c) => c.toLowerCase().includes(query));
  }, [communes, communeSearch]);

  const filledCommunes = communes.filter((c) => isFilled(schedules[c])).length;

  const editWindow = (setter, savedFlag) => (key, field, value) => {
    windowsTouched.current = true;
    savedFlag(false);
    setter((current) => ({
      ...current,
      [key]: { start: "", end: "", ...current[key], [field]: value },
    }));
  };

  const handleDefaultChange = editWindow(setDefaults, setDefaultsSaved);
  const handleScheduleChange = editWindow(setSchedules, setSchedulesSaved);

  /** Nom de la première entrée n'ayant qu'une seule des deux heures, s'il y en a.
   *
   * Le serveur ignore silencieusement une fenêtre incomplète : mieux vaut le dire
   * ici que laisser croire au réglage.
   */
  const findPartial = (keys, map, labelOf) => {
    const key = keys.find((k) => {
      const row = map[k] || {};
      return (!row.start) !== (!row.end);
    });
    return key === undefined ? null : labelOf(key);
  };

  const handleSaveDefaults = async (e) => {
    e.preventDefault();
    setActionError(null);
    setDefaultsSaved(false);

    const partial = findPartial(
      profiles.map((p) => p.id), defaults,
      (id) => profiles.find((p) => p.id === id)?.name || id
    );
    if (partial) {
      setActionError(`« ${partial} » : renseignez les deux heures, ou aucune.`);
      return;
    }

    // Un PATCH par profil réellement modifié : inutile de réécrire les autres,
    // et le backend rejoue la cascade quand le profil touché est l'actif.
    const changed = profiles.filter((profile) => {
      const row = defaults[profile.id] || {};
      return inputToHour(row.start) !== (profile.night_extinction_start ?? null)
        || inputToHour(row.end) !== (profile.night_extinction_end ?? null);
    });

    setSavingDefaults(true);
    try {
      for (const profile of changed) {
        const row = defaults[profile.id] || {};
        await updateGraphProfile(token, profile.id, {
          night_extinction_start: inputToHour(row.start),
          night_extinction_end: inputToHour(row.end),
        });
      }
      windowsTouched.current = false;
      await load();
      setDefaultsSaved(true);
    } catch (err) {
      setActionError(errorMessage(err, "Impossible d'enregistrer les fenêtres par défaut."));
    } finally {
      setSavingDefaults(false);
    }
  };

  const handleSaveSchedules = async (e) => {
    e.preventDefault();
    setActionError(null);
    setSchedulesSaved(false);

    const partial = findPartial(communes, schedules, (c) => c);
    if (partial) {
      setActionError(
        `« ${partial} » : renseignez les deux heures, ou aucune (pour revenir au défaut).`
      );
      return;
    }

    // L'union complète, et non la vue filtrée : une recherche en cours ne doit
    // pas amputer l'enregistrement des communes modifiées juste avant.
    const payload = communes.map((commune) => {
      const row = schedules[commune] || {};
      return {
        commune,
        night_extinction_start: inputToHour(row.start),
        night_extinction_end: inputToHour(row.end),
      };
    });

    setSavingSchedules(true);
    try {
      const rows = await updateCommuneLighting(token, payload);
      windowsTouched.current = false;
      setSchedules(toWindowMap(rows, (row) => row.commune));
      setSchedulesSaved(true);
    } catch (err) {
      setActionError(errorMessage(err, "Impossible d'enregistrer les horaires par commune."));
    } finally {
      setSavingSchedules(false);
    }
  };

  return (
    <div className="users-manager">
      <header className="users-manager-head">
        <div>
          <h1>Éclairage public</h1>
          <p className="users-manager-sub">
            {stats ? `${stats.total} point(s) lumineux en base` : "—"} · Dernière mise à jour :{" "}
            {formatDateTime(stats?.last_sync)}
          </p>
        </div>
        <button
          className="users-refresh"
          onClick={handleSync}
          disabled={loading || syncing || isRunning}
          title="Récupérer les lampadaires depuis OpenStreetMap et les open data locales"
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
            {Object.entries(SOURCE_LABELS)
              .filter(([key]) => stats?.by_source?.[key])
              .map(([key, label]) => (
                <li key={key} className="pois-stat">
                  <span className="pois-stat-value">{stats?.by_source?.[key] ?? 0}</span>
                  <span className="pois-stat-label">{label}</span>
                </li>
              ))}
          </ul>

          <p className="pois-settings-hint">
            Les lampadaires alimentent la couche « Éclairage public » de la carte (heatmap de
            couverture lumineuse et rues éclairées) et servent à inférer l'éclairage des voies
            dépourvues du tag OpenStreetMap. La synchro couvre l'emprise du profil de graphe
            actif : relancez-la après un changement de profil.
          </p>

          <form className="pois-settings" onSubmit={handleSaveSettings}>
            <div className="pois-settings-field">
              <label htmlFor="lighting-interval">Synchronisation automatique</label>
              <div className="pois-settings-input">
                <span>Tous les</span>
                <input
                  id="lighting-interval"
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
                  : "Les positions de lampadaires n'évoluent qu'à la marge : un intervalle long suffit."}
              </p>
            </div>
            <button type="submit" className="users-refresh" disabled={savingSettings}>
              {savingSettings ? "Enregistrement…" : settingsSaved ? "Enregistré ✓" : "Enregistrer"}
            </button>
          </form>

          <h2 className="pois-section-title">Horaires d'extinction</h2>

          <p className="pois-settings-hint">
            De nombreuses communes coupent leur éclairage une partie de la nuit : pendant
            cette fenêtre, le calcul d'itinéraire cesse de privilégier les rues éclairées.
            L'horaire retenu pour une voie suit cet ordre : son tag OpenStreetMap{" "}
            <code>lit:conditional</code> s'il existe, sinon l'horaire de sa commune, sinon
            la valeur par défaut de l'emprise. Tout enregistrement s'applique
            immédiatement, sans régénérer le graphe.
          </p>

          <h3 className="lighting-subtitle">Par défaut, sur chaque emprise</h3>

          <form onSubmit={handleSaveDefaults}>
            <ul className="lighting-window-list">
              {profiles.map((profile) => (
                <li key={profile.id} className="lighting-window-row">
                  <span className="lighting-window-name">
                    {profile.name}
                    {profile.is_active && <span className="lighting-window-tag">actif</span>}
                  </span>
                  <span>de</span>
                  <input
                    type="number" min={0} max={24} placeholder="—"
                    aria-label={`Début d'extinction par défaut sur ${profile.name}`}
                    value={defaults[profile.id]?.start ?? ""}
                    onChange={(e) => handleDefaultChange(profile.id, "start", e.target.value)}
                  />
                  <span>h à</span>
                  <input
                    type="number" min={0} max={24} placeholder="—"
                    aria-label={`Fin d'extinction par défaut sur ${profile.name}`}
                    value={defaults[profile.id]?.end ?? ""}
                    onChange={(e) => handleDefaultChange(profile.id, "end", e.target.value)}
                  />
                  <span>h</span>
                </li>
              ))}
            </ul>

            <p className="pois-settings-hint">
              S'applique aux communes de l'emprise qui n'ont pas d'horaire propre. Vide =
              valeur par défaut du serveur ; deux valeurs égales = pas d'extinction (allumé
              toute la nuit).
            </p>

            <button type="submit" className="users-refresh" disabled={savingDefaults}>
              {savingDefaults ? "Enregistrement…" : defaultsSaved ? "Enregistré ✓" : "Enregistrer les défauts"}
            </button>
          </form>

          <h3 className="lighting-subtitle">
            Par commune
            <span className="lighting-window-count">
              {filledCommunes} / {communes.length} renseignée{filledCommunes > 1 ? "s" : ""}
            </span>
          </h3>

          {communes.length === 0 ? (
            <div className="users-state">
              Aucune commune : créez d'abord un profil de graphe.
            </div>
          ) : (
            <form onSubmit={handleSaveSchedules}>
              <div className="users-search">
                <LuSearch size={18} />
                <input
                  type="text"
                  placeholder="Rechercher une commune…"
                  value={communeSearch}
                  onChange={(e) => setCommuneSearch(e.target.value)}
                />
              </div>

              {shownCommunes.length === 0 ? (
                <div className="users-state">Aucune commune ne correspond à cette recherche.</div>
              ) : (
                <ul className="lighting-window-list lighting-window-scroll">
                  {shownCommunes.map((commune) => (
                    <li key={commune} className="lighting-window-row">
                      <span className="lighting-window-name">{commune}</span>
                      <span>de</span>
                      <input
                        type="number" min={0} max={24} placeholder="—"
                        aria-label={`Début d'extinction à ${commune}`}
                        value={schedules[commune]?.start ?? ""}
                        onChange={(e) => handleScheduleChange(commune, "start", e.target.value)}
                      />
                      <span>h à</span>
                      <input
                        type="number" min={0} max={24} placeholder="—"
                        aria-label={`Fin d'extinction à ${commune}`}
                        value={schedules[commune]?.end ?? ""}
                        onChange={(e) => handleScheduleChange(commune, "end", e.target.value)}
                      />
                      <span>h</span>
                    </li>
                  ))}
                </ul>
              )}

              <p className="pois-settings-hint">
                Un horaire vaut pour tous les profils contenant la commune. Vider les deux
                champs revient au défaut de l'emprise. La recherche ne filtre que
                l'affichage : toutes les modifications sont enregistrées.
              </p>

              <button type="submit" className="users-refresh" disabled={savingSchedules}>
                {savingSchedules ? "Enregistrement…" : schedulesSaved ? "Enregistré ✓" : "Enregistrer les horaires"}
              </button>
            </form>
          )}

          <h2 className="pois-section-title">Historique des synchronisations</h2>

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
                      <th>Lampadaires</th>
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
                          <td>{formatCount(run.total_lamps)}</td>
                          <td>{formatCount(run.created_lamps)}</td>
                          <td>{formatCount(run.deleted_lamps)}</td>
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
                            {formatCount(run.total_lamps)} lampadaires ·{" "}
                            {formatCount(run.created_lamps)} nouveaux ·{" "}
                            {formatCount(run.deleted_lamps)} supprimés
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
