import { useEffect } from "react";
import Button from "../../components/ui/Button";
import "../../components/ui/PopUp.css";
import "./LightingInfoModal.css";

export default function LightingInfoModal({ isOpen, onClose, sources }) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        const handleClickOutside = (e) => {
            if (e.target.classList.contains("modal-overlay")) onClose();
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("click", handleClickOutside);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("click", handleClickOutside);
            document.body.style.overflow = "auto";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content lighting-info-modal">
                <h2>Éclairage public</h2>

                <p>
                    <strong>Lampadaires</strong> : les lampadaires renseignés par OpenStreetMap,
                    ou synchronisés depuis des jeux de données open data des métropoles.
                    Un lampadaire = un halo lumineux sur la carte.
                </p>

                <p>
                    <strong>Rues éclairées</strong> : les rues marquées comme éclairées sur OpenStreetMap.
                    Toutes les routes n'ont pas nécessairement cette information, c'est pour ça que nous déduisons
                    l'éclairage de certaines routes avec la présence de lampadaires ou la proximité immédiate d'une rue éclairée.
                </p>

                <p className="lighting-info-warn">
                    Une zone sans halo n'est pas forcément non éclairée : le plus souvent, c'est la
                    donnée qui manque. Peu de villes françaises ont un jeu open data de lampadaires,
                    et OpenStreetMap n'est pas complet partout, surtout dans les zones rurales.
                </p>

                <p className="lighting-info-sources-title">Sources sur cette zone</p>

                {sources === null ? (
                    <p>Chargement…</p>
                ) : sources.length === 0 ? (
                    <p>Aucun lampadaire synchronisé sur cette zone.</p>
                ) : (
                    <ul className="lighting-info-sources">
                        {sources.map((s) => (
                            <li key={s.source}>
                                {s.attribution}
                                {s.count ? ` — ${s.count.toLocaleString("fr-FR")} points` : ""}
                            </li>
                        ))}
                    </ul>
                )}

                <p>
                    OpenStreetMap couvre l'ensemble de la zone ; les jeux open data métropolitains
                    n'existent que sur certaines villes et viennent alors densifier la couverture.
                </p>

                <div className="modal-actions">
                    <Button type="button" onClick={onClose}>Fermer</Button>
                </div>
            </div>
        </div>
    );
}
