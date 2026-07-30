import { useCallback, useEffect, useRef, useState } from "react";
import {
  LuWaypoints,
  LuSpline,
  LuHardDrive,
  LuPlus,
  LuTrash2,
  LuHammer,
  LuPlay,
  LuStar,
  LuDownload,
  LuUpload,
  LuX,
  LuCircleCheck,
  LuCircleX,
  LuLoader,
  LuTriangleAlert,
  LuInfo,
  LuChevronDown,
  LuChevronUp,
} from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import {
  activateGraphProfile,
  buildGraphProfile,
  createGraphProfile,
  deleteGraphProfile,
  exportGraphProfiles,
  getGraphBuilds,
  getGraphProfiles,
  getGraphProfileExtent,
  getGraphStats,
  importGraphProfiles,
  updateGraphProfile,
} from "../../services/apiBack";
import GraphExtentMap from "./GraphExtentMap";
import GraphImportModal, { readBundle } from "./GraphImportModal";
import GraphProfileModal from "./GraphProfileModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import "./UsersManager.css";
import "./PoisManager.css";
import "./GraphManager.css";

const STATUS_LABELS = { running: "En cours", success: "Réussie", failed: "Échouée" };
const STATUS_ICONS = { running: LuLoader, success: LuCircleCheck, failed: LuCircleX };

const POLL_INTERVAL_MS = 2000;

const COMMUNES_PREVIEW = 12;

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

const formatSize = (bytes) => {
  if (!bytes) return "—";
  const mo = bytes / 1e6;
  return mo >= 1000 ? `${(mo / 1000).toFixed(1)} Go` : `${mo.toFixed(0)} Mo`;
};

const formatCount = (value) =>
  value === null || value === undefined ? "—" : value.toLocaleString("fr-FR");

const downloadJson = (data, filename) => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const errorMessage = (err, fallback) => {
  try {
    const detail = JSON.parse(err.message)?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) {
      return detail[0].msg.replace(/^Value error, /, "");
    }
  } catch {
  }
  return err.message || fallback;
};

function ProgressBar({ value }) {
  const determinate = value !== null && value !== undefined;
  return (
    <div
      className={`graph-progress ${determinate ? "" : "indeterminate"}`}
      role="progressbar"
      aria-valuenow={determinate ? value : undefined}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="graph-progress-fill"
        style={determinate ? { width: `${value}%` } : undefined}
      />
    </div>
  );
}

export default function GraphManager() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [extent, setExtent] = useState(null);
  const [extentLoading, setExtentLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [newCommune, setNewCommune] = useState("");
  const [allCommunes, setAllCommunes] = useState(false);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [toActivate, setToActivate] = useState(null);
  const fileInputRef = useRef(null);

  const selected = profiles.find((p) => p.id === selectedId) || null;
  const runningBuild = builds.find((b) => b.status === "running") || null;
  const isBuilding = Boolean(runningBuild);
  const isReloading = Boolean(stats?.loading);

  const shownStats =
    selected?.is_active && stats?.loaded
      ? { nodes: stats.nodes, edges: stats.edges, size_bytes: stats.size_bytes }
      : {
        nodes: selected?.nodes ?? null,
        edges: selected?.edges ?? null,
        size_bytes: selected?.size_bytes ?? null,
      };

  const load = useCallback(async () => {
    const [statsData, profilesData, buildsData] = await Promise.all([
      getGraphStats(token),
      getGraphProfiles(token),
      getGraphBuilds(token),
    ]);
    setStats(statsData);
    setProfiles(Array.isArray(profilesData) ? profilesData : []);
    setBuilds(Array.isArray(buildsData) ? buildsData : []);
    return profilesData;
  }, [token]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profilesData = await load();
      setSelectedId((current) => {
        if (current && profilesData.some((p) => p.id === current)) return current;
        const active = profilesData.find((p) => p.is_active) || profilesData[0];
        return active ? active.id : null;
      });
    } catch (err) {
      setError(errorMessage(err, "Impossible de charger les profils de graphe."));
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!isBuilding && !isReloading) return;
    const id = setInterval(() => {
      load().catch(() => {
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isBuilding, isReloading, load]);

  const communesKey = selected ? selected.communes.join("|") : null;

  useEffect(() => {
    setAllCommunes(false);
  }, [selectedId]);

  const communes = selected?.communes || [];
  const shownCommunes = allCommunes ? communes : communes.slice(0, COMMUNES_PREVIEW);
  const hiddenCommunes = communes.length - shownCommunes.length;

  useEffect(() => {
    if (!selectedId) {
      setExtent(null);
      return;
    }
    let cancelled = false;
    setExtentLoading(true);
    getGraphProfileExtent(token, selectedId)
      .then((data) => {
        if (!cancelled) setExtent(data);
      })
      .catch(() => {
        if (!cancelled) setExtent(null);
      })
      .finally(() => {
        if (!cancelled) setExtentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, communesKey, token]);

  const runAction = async (action, fallbackMessage) => {
    setActionError(null);
    setBusy(true);
    try {
      await action();
      await load();
    } catch (err) {
      setActionError(errorMessage(err, fallbackMessage));
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (body) => {
    let profile;
    try {
      profile = await createGraphProfile(token, body);
    } catch (err) {
      throw new Error(errorMessage(err, "Impossible de créer le profil."));
    }
    setCreating(false);
    await load();
    setSelectedId(profile.id);
  };

  const handleExport = async (profile) => {
    setActionError(null);
    setBusy(true);
    try {
      const bundle = await exportGraphProfiles(token, profile?.id ?? null);
      downloadJson(bundle, profile ? `${profile.name}.json` : "graph-profiles.json");
    } catch (err) {
      setActionError(errorMessage(err, "Export impossible."));
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setActionError(null);
    try {
      setImporting({ fileName: file.name, bundle: readBundle(await file.text()) });
    } catch (err) {
      setActionError(
        err instanceof SyntaxError
          ? "Fichier illisible : ce n'est pas un JSON valide."
          : err.message
      );
    }
  };

  const handleImport = async (bundle) => {
    let created;
    try {
      created = await importGraphProfiles(token, bundle);
    } catch (err) {
      throw new Error(errorMessage(err, "Import impossible."));
    }
    setImporting(null);
    await load();
    if (created.length > 0) setSelectedId(created[0].id);
  };

  const handleAddCommune = async (e) => {
    e.preventDefault();
    if (!selected || !newCommune.trim()) return;
    const communes = [...selected.communes, newCommune.trim()];
    await runAction(async () => {
      await updateGraphProfile(token, selected.id, { communes });
      setNewCommune("");
    }, "Impossible d'ajouter la commune.");
  };

  const handleRemoveCommune = async (commune) => {
    if (!selected) return;
    const communes = selected.communes.filter((c) => c !== commune);
    if (communes.length === 0) {
      setActionError("Un profil doit contenir au moins une commune.");
      return;
    }
    await runAction(
      () => updateGraphProfile(token, selected.id, { communes }),
      "Impossible de retirer la commune."
    );
  };

  const handleBuild = (profile) =>
    runAction(
      () => buildGraphProfile(token, profile.id),
      "Impossible de lancer la génération."
    );

  const handleSetDefault = (profile) =>
    runAction(
      () => updateGraphProfile(token, profile.id, { is_default: true }),
      "Impossible de définir le profil par défaut."
    );

  const handleDelete = async () => {
    if (!toDelete) return;
    setActionError(null);
    try {
      await deleteGraphProfile(token, toDelete.id);
      setToDelete(null);
      if (selectedId === toDelete.id) setSelectedId(null);
      await load();
    } catch (err) {
      setToDelete(null);
      setActionError(errorMessage(err, "Suppression impossible."));
    }
  };

  const handleActivate = async () => {
    if (!toActivate) return;
    const profile = toActivate;
    setToActivate(null);
    await runAction(
      () => activateGraphProfile(token, profile.id),
      "Impossible d'activer le profil."
    );
  };

  return (
    <div className="users-manager">
      <header className="users-manager-head">
        <div>
          <h1>Graphe de routage</h1>
          <p className="users-manager-sub">
            {selected ? (
              <>
                Profil <strong>{selected.name}</strong>
                {selected.is_active
                  ? " · chargé par l'API"
                  : selected.graph_exists
                    ? " · graphe généré, non chargé"
                    : " · graphe non généré"}
              </>
            ) : (
              "Aucun profil sélectionné"
            )}
          </p>
        </div>

        <div className="graph-head-actions">
          <input
            type="file"
            accept="application/json,.json"
            ref={fileInputRef}
            onChange={handleFile}
            hidden
          />
          <button
            className="users-refresh"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            title="Créer un ou plusieurs profils à partir d'un fichier exporté"
          >
            <LuUpload size={16} />
            <span>Importer</span>
          </button>
          <button
            className="users-refresh"
            onClick={() => handleExport(null)}
            disabled={busy || profiles.length === 0}
            title="Télécharger tous les profils dans un seul fichier"
          >
            <LuDownload size={16} />
            <span>Exporter tout</span>
          </button>
        </div>
      </header>

      {isReloading && (
        <div className="graph-notice">
          <LuLoader size={15} className="spin" />
          Rechargement du graphe en cours : le calcul d'itinéraire est momentanément
          indisponible.
        </div>
      )}

      {runningBuild && (
        <div className="graph-notice graph-notice-build">
          <LuHammer size={15} />
          <div className="graph-progress-block">
            <span className="graph-progress-label">
              Génération de « {runningBuild.profile_name} »
              {runningBuild.step ? ` — ${runningBuild.step}` : " — démarrage…"}
              {runningBuild.progress !== null && runningBuild.progress !== undefined
                ? ` (${runningBuild.progress} %)`
                : ""}
            </span>
            <ProgressBar value={runningBuild.progress} />
          </div>
        </div>
      )}

      {actionError && <div className="users-alert">{actionError}</div>}

      {loading ? (
        <div className="users-state">Chargement…</div>
      ) : error ? (
        <div className="users-state users-state-error">{error}</div>
      ) : (
        <>
          <ul className="pois-stats">
            <li className="pois-stat">
              <span className="pois-stat-icon"><LuWaypoints size={18} /></span>
              <span className="pois-stat-value">{formatCount(shownStats.nodes)}</span>
              <span className="pois-stat-label">Nœuds</span>
            </li>
            <li className="pois-stat">
              <span className="pois-stat-icon"><LuSpline size={18} /></span>
              <span className="pois-stat-value">{formatCount(shownStats.edges)}</span>
              <span className="pois-stat-label">Arêtes</span>
            </li>
            <li className="pois-stat">
              <span className="pois-stat-icon"><LuHardDrive size={18} /></span>
              <span className="pois-stat-value">{formatSize(shownStats.size_bytes)}</span>
              <span className="pois-stat-label">Taille sur disque</span>
            </li>
          </ul>

          <div className="graph-layout">
            <section className="graph-panel">
              <h2 className="pois-section-title">Profils</h2>

              <ul className="graph-profiles">
                {profiles.map((profile) => (
                  <li
                    key={profile.id}
                    className={`graph-profile ${profile.id === selectedId ? "selected" : ""}`}
                    onClick={() => setSelectedId(profile.id)}
                  >
                    <div className="graph-profile-main">
                      <span className="graph-profile-name">
                        {profile.name}
                        {profile.is_active && (
                          <span className="pois-status pois-status-success">Actif</span>
                        )}
                        {profile.is_default && <span className="pois-status">Par défaut</span>}
                      </span>
                      <span className="graph-profile-sub">
                        {profile.communes.length} commune{profile.communes.length > 1 ? "s" : ""}
                        {profile.graph_exists
                          ? ` · ${formatCount(profile.nodes)} nœuds · ${formatSize(profile.size_bytes)}`
                          : " · graphe non généré"}
                      </span>
                    </div>

                    <div className="graph-profile-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="row-action"
                        title="Générer le graphe"
                        disabled={busy || isBuilding || isReloading}
                        onClick={() => handleBuild(profile)}
                      >
                        <LuHammer size={16} />
                      </button>
                      <button
                        className="row-action"
                        title={
                          profile.graph_exists
                            ? "Activer ce profil"
                            : "Générez d'abord le graphe"
                        }
                        disabled={
                          busy || isBuilding || isReloading || profile.is_active || !profile.graph_exists
                        }
                        onClick={() => setToActivate(profile)}
                      >
                        <LuPlay size={16} />
                      </button>
                      <button
                        className={`row-action ${profile.is_default ? "graph-star-on" : ""}`}
                        title={
                          profile.is_default
                            ? "Profil chargé au démarrage"
                            : "Charger ce profil au démarrage"
                        }
                        disabled={busy}
                        onClick={() => !profile.is_default && handleSetDefault(profile)}
                      >
                        <LuStar size={16} fill={profile.is_default ? "currentColor" : "none"} />
                      </button>
                      <button
                        className="row-action"
                        title="Exporter ce profil"
                        disabled={busy}
                        onClick={() => handleExport(profile)}
                      >
                        <LuDownload size={16} />
                      </button>
                      <button
                        className="row-action danger"
                        title="Supprimer"
                        disabled={busy || profile.is_active || profile.is_default}
                        onClick={() => setToDelete(profile)}
                      >
                        <LuTrash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
                <li
                  className="graph-profile graph-profile-new"
                  onClick={() => setCreating(true)}
                >
                  <LuPlus size={18} />
                  <span>Nouveau profil</span>
                </li>
              </ul>
            </section>

            <section className="graph-panel">
              <h2 className="pois-section-title">
                Emprise{selected ? ` — ${selected.name}` : ""}
              </h2>

              {selected?.is_stale && (
                <div className="graph-notice graph-notice-warn">
                  <LuTriangleAlert size={15} />
                  Les communes ont changé depuis la dernière génération : le graphe et les
                  POI ne reflètent plus ce profil. Régénérez-le, puis resynchronisez les POI.
                </div>
              )}

              {selected?.is_contiguous === false && (
                <div className="graph-notice">
                  <LuInfo size={15} />
                  Ces communes ne se touchent pas : le graphe couvrira plusieurs zones
                  séparées. Chacune reste navigable, mais aucun itinéraire ne peut relier
                  deux zones entre elles.
                </div>
              )}

              {extentLoading ? (
                <div className="users-state">Géocodage des communes…</div>
              ) : (
                <GraphExtentMap geojson={extent} />
              )}

              {selected && (
                <>
                  <form className="graph-add-commune" onSubmit={handleAddCommune}>
                    <input
                      type="text"
                      placeholder="Ajouter une commune (ex. Talence, France)"
                      value={newCommune}
                      onChange={(e) => setNewCommune(e.target.value)}
                      required
                    />
                    <button type="submit" className="users-refresh" disabled={busy}>
                      <LuPlus size={16} />
                      <span>Ajouter</span>
                    </button>
                  </form>

                  <ul className="graph-communes">
                    {shownCommunes.map((commune) => (
                      <li key={commune} className="graph-commune">
                        <span>{commune}</span>
                        <button
                          className="graph-commune-remove"
                          title="Retirer cette commune"
                          disabled={busy}
                          onClick={() => handleRemoveCommune(commune)}
                        >
                          <LuX size={13} />
                        </button>
                      </li>
                    ))}

                    {(hiddenCommunes > 0 || allCommunes) && (
                      <li>
                        <button
                          type="button"
                          className="graph-commune graph-commune-toggle"
                          onClick={() => setAllCommunes((open) => !open)}
                        >
                          {allCommunes ? (
                            <>
                              <LuChevronUp size={14} />
                              Voir moins
                            </>
                          ) : (
                            <>
                              <LuChevronDown size={14} />
                              {hiddenCommunes} de plus
                            </>
                          )}
                        </button>
                      </li>
                    )}
                  </ul>
                </>
              )}
            </section>
          </div>

          <h2 className="pois-section-title">Historique des générations</h2>

          {builds.length === 0 ? (
            <div className="users-state">Aucune génération pour le moment.</div>
          ) : (
            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Profil</th>
                    <th>Date et heure</th>
                    <th>Nœuds</th>
                    <th>Arêtes</th>
                    <th>Taille</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {builds.map((build) => {
                    const StatusIcon = STATUS_ICONS[build.status];
                    return (
                      <tr key={build.id}>
                        <td className="cell-name">{build.profile_name}</td>
                        <td>{formatDateTime(build.started_at)}</td>
                        <td>{formatCount(build.nodes)}</td>
                        <td>{formatCount(build.edges)}</td>
                        <td>{formatSize(build.size_bytes)}</td>
                        <td>
                          <span className={`pois-status pois-status-${build.status}`}>
                            {StatusIcon && (
                              <StatusIcon
                                size={13}
                                className={build.status === "running" ? "spin" : ""}
                              />
                            )}
                            {STATUS_LABELS[build.status] || build.status}
                          </span>
                          {build.status === "running" && (
                            <ProgressBar value={build.progress} />
                          )}
                          {build.status === "failed" && build.error && (
                            <p className="pois-error">{build.error}</p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {creating && (
        <GraphProfileModal
          profiles={profiles}
          onCancel={() => setCreating(false)}
          onCreate={handleCreate}
        />
      )}

      {importing && (
        <GraphImportModal
          fileName={importing.fileName}
          bundle={importing.bundle}
          profiles={profiles}
          onCancel={() => setImporting(null)}
          onImport={handleImport}
        />
      )}

      {toDelete && (
        <ConfirmDeleteModal
          title="Supprimer le profil"
          message={`Le profil « ${toDelete.name} » et son graphe généré seront supprimés définitivement.`}
          confirmLabel="Supprimer"
          busyLabel="Suppression…"
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}

      {toActivate && (
        <ConfirmDeleteModal
          title="Activer ce profil"
          message={`L'API va recharger son graphe sur « ${toActivate.name} ». Le calcul d'itinéraire sera indisponible pendant 1 à 2 minutes.`}
          confirmLabel="Activer"
          busyLabel="Activation…"
          onCancel={() => setToActivate(null)}
          onConfirm={handleActivate}
        />
      )}
    </div>
  );
}
