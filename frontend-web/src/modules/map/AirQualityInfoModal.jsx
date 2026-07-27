import { useEffect } from "react";
import Button from "../../components/ui/Button";
import "../../components/ui/PopUp.css";
import "./AirQualityInfoModal.css";

const EAQI_LEGEND = [
    { band: "good", label: "Bon", range: "0–20", color: "#50f0e6" },
    { band: "fair", label: "Moyen", range: "20–40", color: "#50ccaa" },
    { band: "moderate", label: "Dégradé", range: "40–60", color: "#f0e641" },
    { band: "poor", label: "Mauvais", range: "60–80", color: "#ff5050" },
    { band: "very_poor", label: "Très mauvais", range: "80–100", color: "#960032" },
    { band: "extreme", label: "Extrêmement mauvais", range: "> 100", color: "#7d2181" },
];

const US_AQI_LEGEND = [
    { band: "good", label: "Bon", range: "0–50", color: "#00e400" },
    { band: "moderate", label: "Moyen", range: "51–100", color: "#ffff00" },
    { band: "usg", label: "Mauvais pour sensibles", range: "101–150", color: "#ff7e00" },
    { band: "unhealthy", label: "Mauvais", range: "151–200", color: "#ff0000" },
    { band: "very_unhealthy", label: "Très mauvais", range: "201–300", color: "#8f3f97" },
    { band: "hazardous", label: "Dangereux", range: "> 300", color: "#7e0023" },
];

export default function AirQualityInfoModal({ isOpen, onClose }) {
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
            <div className="modal-content air-info-modal">
                <h2>Qualité de l'air</h2>

                <div className="air-info-columns">
                    <div className="air-info-col">
                        <h3 className="air-info-sources-title">Cellules — indice européen (CAMS)</h3>
                        <p>
                            Indice européen (<strong>EAQI</strong>) du service Copernicus (<strong>CAMS</strong>).
                            Chaque cellule ≈ <strong>11 km</strong> : un niveau régional, pas une mesure de rue.
                        </p>

                        <ul className="air-info-legend">
                            {EAQI_LEGEND.map((b) => (
                                <li key={b.band}>
                                    <span className="air-legend-swatch" style={{ backgroundColor: b.color }} />
                                    <span className="air-legend-label">{b.label}</span>
                                    <span className="air-legend-range">{b.range}</span>
                                </li>
                            ))}
                        </ul>

                        <p className="air-info-warn">
                            Deux rues voisines ont donc le même indice. Pour l'itinéraire, on privilégie les rues
                            <strong> à l'écart du trafic</strong> (déduit du réseau routier), pas la cellule.
                            Air bon = critère inactif.
                        </p>
                    </div>

                    <div className="air-info-col">
                        <h3 className="air-info-sources-title">Pastilles — capteurs au sol</h3>
                        <p>
                            Les <strong>pastilles</strong> sont des <strong>stations réelles</strong>. Un modèle
                            peut être en retard sur un feu récent ; une station le <strong>mesure</strong> sans
                            latence. Un pic proche pèse alors sur l'itinéraire.
                        </p>
                        <p className="air-info-warn">
                            Deux échelles : cellules en EAQI (européen), pastilles en <strong>AQI US</strong> —
                            échelle native des capteurs, non convertie.
                        </p>

                        <ul className="air-info-legend">
                            {US_AQI_LEGEND.map((b) => (
                                <li key={b.band}>
                                    <span className="air-legend-swatch" style={{ backgroundColor: b.color }} />
                                    <span className="air-legend-label">{b.label}</span>
                                    <span className="air-legend-range">{b.range}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <h3 className="air-info-sources-title">Sources</h3>
                <p>
                    Cellules : <strong>CAMS ENSEMBLE</strong> / <strong>Open-Meteo</strong>. Pastilles :
                    <strong> World Air Quality Index</strong> (waqi.info).
                </p>

                <div className="modal-actions">
                    <Button type="button" onClick={onClose}>Fermer</Button>
                </div>
            </div>
        </div>
    );
}
