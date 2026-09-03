import { Trans, useTranslation } from "react-i18next";
import { useEffect } from "react";
import Button from "../../components/ui/Button";
import "../../components/ui/PopUp.css";
import "./LightingInfoModal.css";

export default function LightingInfoModal({ isOpen, onClose, sources }) {
    const { t, i18n } = useTranslation('carte');
    const T = ({ k }) => <Trans t={t} i18nKey={k} components={{ b: <strong /> }} />;
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
                <h2>{t('ui.eclairage.h2')}</h2>

                <p><T k="ui.eclairage.lampadaires" /></p>

                <p><T k="ui.eclairage.ruesEclairees" /></p>

                <p className="lighting-info-warn">{t('ui.eclairage.avertissement')}</p>

                <p className="lighting-info-sources-title">{t('ui.eclairage.sourcesZone')}</p>

                {sources === null ? (
                    <p>{t('ui.eclairage.chargement')}</p>
                ) : sources.length === 0 ? (
                    <p>{t('ui.eclairage.aucunLampadaire')}</p>
                ) : (
                    <ul className="lighting-info-sources">
                        {sources.map((s) => (
                            <li key={s.source}>
                                {s.attribution}
                                {s.count ? ` — ${t('ui.eclairage.points', { n: s.count.toLocaleString(i18n.language) })}` : ""}
                            </li>
                        ))}
                    </ul>
                )}

                <p>{t('ui.eclairage.couverture')}</p>

                <div className="modal-actions">
                    <Button type="button" onClick={onClose}>{t('ui.fermer')}</Button>
                </div>
            </div>
        </div>
    );
}
