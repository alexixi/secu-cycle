import { Trans, useTranslation } from "react-i18next";
import { useEffect } from "react";
import Button from "../../components/ui/Button";
import "../../components/ui/PopUp.css";
import "./AirQualityInfoModal.css";

const EAQI_LEGEND = [
    { band: "good", range: "0–20", color: "#50f0e6" },
    { band: "fair", range: "20–40", color: "#50ccaa" },
    { band: "moderate", range: "40–60", color: "#f0e641" },
    { band: "poor", range: "60–80", color: "#ff5050" },
    { band: "very_poor", range: "80–100", color: "#960032" },
    { band: "extreme", range: "> 100", color: "#7d2181" },
];

const US_AQI_LEGEND = [
    { band: "good", range: "0–50", color: "#00e400" },
    { band: "moderate", range: "51–100", color: "#ffff00" },
    { band: "usg", range: "101–150", color: "#ff7e00" },
    { band: "unhealthy", range: "151–200", color: "#ff0000" },
    { band: "very_unhealthy", range: "201–300", color: "#8f3f97" },
    { band: "hazardous", range: "> 300", color: "#7e0023" },
];

export default function AirQualityInfoModal({ isOpen, onClose, resolutionKm = 11 }) {
    const { t } = useTranslation('carte');
    const T = ({ k, ...params }) => (
        <Trans t={t} i18nKey={k} components={{ b: <strong /> }} values={params} />
    );
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
                <h2>{t('ui.airModal.h2')}</h2>

                <div className="air-info-columns">
                    <div className="air-info-col">
                        <h3 className="air-info-sources-title">{t('ui.airModal.cellules')}</h3>
                        <p><T k="ui.airModal.cellulesTexte" resolution={resolutionKm} /></p>

                        <ul className="air-info-legend">
                            {EAQI_LEGEND.map((b) => (
                                <li key={b.band}>
                                    <span className="air-legend-swatch" style={{ backgroundColor: b.color }} />
                                    <span className="air-legend-label">{t(`ui.airModal.eaqi.${b.band}`)}</span>
                                    <span className="air-legend-range">{b.range}</span>
                                </li>
                            ))}
                        </ul>

                        <p className="air-info-warn"><T k="ui.airModal.cellulesAvertissement" /></p>
                    </div>

                    <div className="air-info-col">
                        <h3 className="air-info-sources-title">{t('ui.airModal.pastilles')}</h3>
                        <p><T k="ui.airModal.pastillesTexte" /></p>
                        <p className="air-info-warn"><T k="ui.airModal.pastillesAvertissement" /></p>

                        <ul className="air-info-legend">
                            {US_AQI_LEGEND.map((b) => (
                                <li key={b.band}>
                                    <span className="air-legend-swatch" style={{ backgroundColor: b.color }} />
                                    <span className="air-legend-label">{t(`ui.airModal.us.${b.band}`)}</span>
                                    <span className="air-legend-range">{b.range}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <h3 className="air-info-sources-title">{t('ui.airModal.sources')}</h3>
                <p><T k="ui.airModal.sourcesTexte" /></p>

                <div className="modal-actions">
                    <Button type="button" onClick={onClose}>{t('ui.fermer')}</Button>
                </div>
            </div>
        </div>
    );
}
