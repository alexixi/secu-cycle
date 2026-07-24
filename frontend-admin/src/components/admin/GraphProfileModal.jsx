import { useEffect, useMemo, useState } from "react";
import { LuPlus, LuX } from "react-icons/lu";
import Button from "../ui/Button";
import "../ui/PopUp.css";

function composeCommunes(profiles, baseIds, extras) {
  const inherited = baseIds.flatMap(
    (id) => profiles.find((p) => p.id === id)?.communes || []
  );
  return [...new Set([...inherited, ...extras])];
}

export default function GraphProfileModal({ profiles, onCancel, onCreate }) {
  const [name, setName] = useState("");
  const [baseIds, setBaseIds] = useState([]);
  const [extras, setExtras] = useState([]);
  const [communeInput, setCommuneInput] = useState("");
  const [extStart, setExtStart] = useState("");
  const [extEnd, setExtEnd] = useState("");
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

  const composed = useMemo(
    () => composeCommunes(profiles, baseIds, extras),
    [profiles, baseIds, extras]
  );

  const inheritedCount = baseIds.reduce(
    (total, id) => total + (profiles.find((p) => p.id === id)?.communes.length || 0),
    0
  );
  const duplicates = inheritedCount + extras.length - composed.length;

  const toggleBase = (id) =>
    setBaseIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );

  const addCommune = (e) => {
    e.preventDefault();
    const commune = communeInput.trim();
    if (!commune) return;
    if (!extras.includes(commune)) setExtras((current) => [...current, commune]);
    setCommuneInput("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await onCreate({
        name: name.trim(),
        base_profile_ids: baseIds,
        communes: extras,
        night_extinction_start: extStart === "" ? null : Number(extStart),
        night_extinction_end: extEnd === "" ? null : Number(extEnd),
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target.classList.contains("modal-overlay") && onCancel()}
    >
      <div className="modal-content graph-modal">
        <h2>Nouveau profil</h2>

        <form onSubmit={handleSubmit}>
          <div className="graph-modal-body">
            <label className="graph-modal-field">
              <span>Nom</span>
              <input
                type="text"
                placeholder="ex. bordeaux-tournai"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
              <small>Lettres, chiffres, tirets et underscores : il sert de nom de fichier.</small>
            </label>

            <div className="graph-modal-field">
              <span>Reprendre les communes de</span>
              <ul className="graph-modal-bases">
                {profiles.map((profile) => (
                  <li key={profile.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={baseIds.includes(profile.id)}
                        onChange={() => toggleBase(profile.id)}
                      />
                      <span className="graph-modal-base-name">{profile.name}</span>
                      <span className="graph-modal-base-sub">
                        {profile.communes.length} commune{profile.communes.length > 1 ? "s" : ""}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <div className="graph-modal-field">
              <span>Communes supplémentaires</span>
              <div className="graph-add-commune">
                <input
                  type="text"
                  placeholder="ex. Talence, France"
                  value={communeInput}
                  onChange={(e) => setCommuneInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCommune(e)}
                />
                <button type="button" className="users-refresh" onClick={addCommune}>
                  <LuPlus size={16} />
                  <span>Ajouter</span>
                </button>
              </div>

              {extras.length > 0 && (
                <ul className="graph-communes">
                  {extras.map((commune) => (
                    <li key={commune} className="graph-commune">
                      <span>{commune}</span>
                      <button
                        type="button"
                        className="graph-commune-remove"
                        title="Retirer"
                        onClick={() =>
                          setExtras((current) => current.filter((c) => c !== commune))
                        }
                      >
                        <LuX size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="graph-modal-field">
              <span>Extinction de l'éclairage — défaut sur l'emprise (optionnel)</span>
              <div className="graph-extinction-row">
                <span>de</span>
                <input
                  type="number" min={0} max={24} placeholder="—"
                  value={extStart}
                  onChange={(e) => setExtStart(e.target.value)}
                />
                <span>h à</span>
                <input
                  type="number" min={0} max={24} placeholder="—"
                  value={extEnd}
                  onChange={(e) => setExtEnd(e.target.value)}
                />
                <span>h</span>
              </div>
              <small>
                Heures où les lampadaires sont éteints, appliquées aux communes sans
                horaire propre. Vide = valeur par défaut ; deux valeurs égales = pas
                d'extinction. Se modifie ensuite depuis la page « Éclairage », avec les
                horaires par commune.
              </small>
            </div>

            <p className="graph-modal-summary">
              {composed.length === 0
                ? "Aucune commune : cochez un profil de base ou ajoutez une commune."
                : `${composed.length} commune${composed.length > 1 ? "s" : ""} au total`}
              {duplicates > 0 &&
                ` — ${duplicates} doublon${duplicates > 1 ? "s" : ""} ignoré${duplicates > 1 ? "s" : ""}`}
            </p>

            {error && <div className="users-alert">{error}</div>}
          </div>

          <div className="modal-actions">
            <Button type="button" onClick={onCancel} disabled={busy}>
              Annuler
            </Button>
            <Button type="submit" disabled={busy || !name.trim() || composed.length === 0}>
              {busy ? "Création…" : "Créer le profil"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
