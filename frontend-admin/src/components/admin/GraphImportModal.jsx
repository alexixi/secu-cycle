import { useEffect, useMemo, useState } from "react";
import { LuFileJson } from "react-icons/lu";
import Button from "../ui/Button";
import "../ui/PopUp.css";

// Même jeu de caractères que le backend : le nom sert de nom de fichier.
const NAME_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

// Doivent suivre EXPORT_KIND / EXPORT_VERSION de backend/schemas/graph_profile.py.
const EXPORT_KIND = "secu-cycle.graph-profile";
const EXPORT_VERSION = 1;

const describeExtinction = (start, end) => {
  if (start === null && end === null) return "extinction par défaut";
  const hour = (value) => (value === null || value === undefined ? "—" : `${value} h`);
  return `extinction ${hour(start)} → ${hour(end)}`;
};

/** Contrôle de forme minimal, avant même d'ouvrir la modale. */
export function readBundle(text) {
  const bundle = JSON.parse(text);
  if (!bundle || bundle.kind !== EXPORT_KIND) {
    throw new Error("Ce fichier n'est pas un export de profil de graphe.");
  }
  if (bundle.version > EXPORT_VERSION) {
    throw new Error("Ce fichier a été produit par une version plus récente de Sécu'Cycle.");
  }
  if (!Array.isArray(bundle.profiles) || bundle.profiles.length === 0) {
    throw new Error("Ce fichier ne contient aucun profil.");
  }
  return bundle;
}

export default function GraphImportModal({ fileName, bundle, profiles, onCancel, onImport }) {
  const [names, setNames] = useState(() => bundle.profiles.map((p) => p.name ?? ""));
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [onCancel]);

  const taken = useMemo(() => new Set(profiles.map((p) => p.name)), [profiles]);

  const issues = useMemo(() => {
    const trimmed = names.map((name) => name.trim());
    return trimmed.map((name) => {
      if (!name) return "Le nom est obligatoire.";
      if (!NAME_PATTERN.test(name)) {
        return "Lettres, chiffres, tirets et underscores uniquement, 64 caractères au plus.";
      }
      if (taken.has(name)) return "Un profil porte déjà ce nom : renommez-le.";
      if (trimmed.filter((other) => other === name).length > 1) {
        return "Ce nom apparaît deux fois dans l'import.";
      }
      return null;
    });
  }, [names, taken]);

  const blocked = issues.some(Boolean);

  const setName = (index, value) =>
    setNames((current) => current.map((name, i) => (i === index ? value : name)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await onImport({
        ...bundle,
        profiles: bundle.profiles.map((profile, i) => ({
          ...profile,
          name: names[i].trim(),
        })),
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const lightingCount = bundle.commune_lighting?.length || 0;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target.classList.contains("modal-overlay") && onCancel()}
    >
      <div className="modal-content graph-modal">
        <h2>Importer un profil</h2>

        <form onSubmit={handleSubmit}>
          <div className="graph-modal-body">
            <p className="graph-import-file">
              <LuFileJson size={16} />
              <span>{fileName}</span>
            </p>

            {bundle.profiles.map((profile, index) => (
              <label className="graph-modal-field" key={index}>
                <span>Nom</span>
                <input
                  type="text"
                  value={names[index]}
                  onChange={(e) => setName(index, e.target.value)}
                  autoFocus={index === 0}
                  required
                />
                {issues[index] && (
                  <small className="graph-import-issue">{issues[index]}</small>
                )}
                <small>
                  {profile.communes?.length || 0} commune
                  {(profile.communes?.length || 0) > 1 ? "s" : ""} ·{" "}
                  {describeExtinction(
                    profile.night_extinction_start ?? null,
                    profile.night_extinction_end ?? null
                  )}
                </small>
              </label>
            ))}

            <p className="graph-modal-summary">
              {lightingCount > 0
                ? `${lightingCount} horaire${lightingCount > 1 ? "s" : ""} d'éclairage par commune ${lightingCount > 1 ? "seront importés" : "sera importé"}.`
                : "Aucun horaire d'éclairage dans ce fichier."}
              {" "}Le graphe n'est pas dans le fichier : il restera à générer.
            </p>

            {error && <div className="users-alert">{error}</div>}
          </div>

          <div className="modal-actions">
            <Button type="button" onClick={onCancel} disabled={busy}>
              Annuler
            </Button>
            <Button type="submit" disabled={busy || blocked}>
              {busy ? "Import…" : "Importer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
