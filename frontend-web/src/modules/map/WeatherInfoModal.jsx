import { useEffect } from "react";
import Button from "../../components/ui/Button";
import "../../components/ui/PopUp.css";
import "./WeatherInfoModal.css";
import { WEATHER_ALERT_COLORS } from "./weather";

const ALERT_LEGEND = [
    { level: "none", label: "Rien à signaler", detail: "Conditions ordinaires" },
    { level: "watch", label: "Vigilance", detail: "Rafales ≥ 40 km/h, pluie, froid, brouillard" },
    { level: "warning", label: "Conditions difficiles", detail: "Orage, neige, fortes pluies, gel" },
    { level: "severe", label: "Danger", detail: "Verglas, grêle, rafales ≥ 80 km/h" },
];

export default function WeatherInfoModal({ isOpen, onClose }) {
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
            <div className="modal-content weather-info-modal">
                <h2>Météo</h2>

                <div className="weather-info-columns">
                    <div className="weather-info-col">
                        <h3 className="weather-info-sources-title">Niveaux de vigilance</h3>
                        <p>
                            Le relevé est pris en <strong>un point au centre de
                            l'agglomération</strong>, et le bandeau porte le niveau de vigilance
                            le plus élevé du moment. C'est un niveau <strong>régional</strong> :
                            une cellule orageuse fait 5 à 15 km, nous n'échantillonnons qu'un
                            point. D'où « Risque d'orage », jamais « Orage sur votre trajet ».
                        </p>

                        <ul className="weather-info-legend">
                            {ALERT_LEGEND.map((b) => (
                                <li key={b.level}>
                                    <span
                                        className="weather-legend-swatch"
                                        style={{ backgroundColor: WEATHER_ALERT_COLORS[b.level] }}
                                    />
                                    <span className="weather-legend-label">{b.label}</span>
                                    <span className="weather-legend-range">{b.detail}</span>
                                </li>
                            ))}
                        </ul>

                        <p className="weather-info-warn">
                            On dit donc « <strong>risque</strong> d'orage », jamais « orage sur
                            votre trajet ». La météo <strong>n'infléchit pas</strong> le calcul
                            d'itinéraire : elle vous informe, elle ne vous fait pas faire un détour
                            sur une prévision de cette résolution.
                        </p>
                    </div>

                    <div className="weather-info-col">
                        <h3 className="weather-info-sources-title">Pluie dans les 30 minutes</h3>
                        <p>
                            La prévision au pas de <strong>15 minutes</strong> vient des modèles à
                            fine maille <strong>AROME</strong> (Météo-France) et
                            <strong> ICON-D2</strong> (DWD). Hors de leur couverture, elle n'est pas
                            affichée du tout plutôt que d'être interpolée en silence depuis la
                            prévision horaire.
                        </p>

                        <p className="weather-info-warn">
                            Le <strong>vent</strong> ajuste la durée <em>affichée</em> de
                            l'itinéraire, jamais le tracé retenu. Sous 3 °C, les
                            <strong> ponts</strong> d'au moins 30 m sont signalés : un tablier perd
                            sa chaleur par ses deux faces et gèle une à deux heures avant la
                            chaussée voisine.
                        </p>
                    </div>
                </div>

                <h3 className="weather-info-sources-title">Sources</h3>
                <p>
                    Prévisions : <strong>Open-Meteo</strong> (DWD ICON-D2, Météo-France AROME,
                    NOAA GFS).
                </p>

                <div className="modal-actions">
                    <Button type="button" onClick={onClose}>Fermer</Button>
                </div>
            </div>
        </div>
    );
}
