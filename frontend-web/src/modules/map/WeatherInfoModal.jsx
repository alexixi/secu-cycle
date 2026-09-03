import { Trans, useTranslation } from "react-i18next";
import { useEffect } from "react";
import Button from "../../components/ui/Button";
import "../../components/ui/PopUp.css";
import "./WeatherInfoModal.css";
import { WEATHER_ALERT_COLORS } from "./weather";

// Les niveaux portent leur identifiant ; libellé et détail sont au catalogue.
const ALERT_LEGEND = ["none", "watch", "warning", "severe"];

export default function WeatherInfoModal({ isOpen, onClose }) {
    const { t } = useTranslation('carte');
    const T = ({ k }) => <Trans t={t} i18nKey={k} components={{ b: <strong />, em: <em /> }} />;
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
                <h2>{t('ui.meteoModal.h2')}</h2>

                <div className="weather-info-columns">
                    <div className="weather-info-col">
                        <h3 className="weather-info-sources-title">{t('ui.meteoModal.niveauxVigilance')}</h3>
                        <p><T k="ui.meteoModal.releve" /></p>

                        <ul className="weather-info-legend">
                            {ALERT_LEGEND.map((niveau) => (
                                <li key={niveau}>
                                    <span
                                        className="weather-legend-swatch"
                                        style={{ backgroundColor: WEATHER_ALERT_COLORS[niveau] }}
                                    />
                                    <span className="weather-legend-label">{t(`ui.meteoModal.niveaux.${niveau}`)}</span>
                                    <span className="weather-legend-range">{t(`ui.meteoModal.niveaux.${niveau}Detail`)}</span>
                                </li>
                            ))}
                        </ul>

                        <p className="weather-info-warn"><T k="ui.meteoModal.avertissement" /></p>
                    </div>

                    <div className="weather-info-col">
                        <h3 className="weather-info-sources-title">{t('ui.meteoModal.pluie30')}</h3>
                        <p><T k="ui.meteoModal.pluie30Texte" /></p>

                        <p className="weather-info-warn"><T k="ui.meteoModal.ventPonts" /></p>
                    </div>
                </div>

                <h3 className="weather-info-sources-title">{t('ui.meteoModal.sources')}</h3>
                <p><T k="ui.meteoModal.sourcesTexte" /></p>

                <div className="modal-actions">
                    <Button type="button" onClick={onClose}>{t('ui.fermer')}</Button>
                </div>
            </div>
        </div>
    );
}
