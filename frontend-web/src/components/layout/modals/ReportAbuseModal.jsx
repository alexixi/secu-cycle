import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { MdWarningAmber, MdCampaign, MdWrongLocation, MdMoreHoriz, MdPersonOff } from "react-icons/md";
import Button from "../../ui/Button";

import "../../ui/PopUp.css"
import "./ReportAbuseModal.css"

// `key` part au backend, `cle` désigne le libellé : les deux ne coïncident pas
// toujours (`wrong_place` / `fantaisiste`), d'où les deux champs.
const REASONS = [
    { key: "offensive", Icon: MdWarningAmber, cle: "offensant" },
    { key: "spam", Icon: MdCampaign, cle: "spam" },
    { key: "wrong_place", Icon: MdWrongLocation, cle: "fantaisiste" },
    { key: "other", Icon: MdMoreHoriz, cle: "autre", sansAide: true },
];

export default function ReportAbuseModal({ isOpen, onClose, onReport, onBlock }) {
    const { t } = useTranslation('carte');
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };

        const handleOverlayClick = (e) => {
            if (e.target.classList.contains("modal-overlay")) onClose();
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("click", handleOverlayClick);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("click", handleOverlayClick);
            document.body.style.overflow = "auto";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content abuse-modal">
                <h2>{t('ui.abus.titre')}</h2>
                <p className="abuse-lead">{t('ui.abus.delai')}</p>

                {REASONS.map(({ key, Icon, cle, sansAide }) => (
                    <button key={key} type="button" className="abuse-reason" onClick={() => onReport(key)}>
                        <Icon size={20} />
                        <span className="abuse-reason-text">
                            <strong>{t(`ui.abus.${cle}`)}</strong>
                            {!sansAide && <small>{t(`ui.abus.${cle}Aide`)}</small>}
                        </span>
                    </button>
                ))}

                <div className="abuse-block">
                    <button type="button" className="abuse-reason" onClick={onBlock}>
                        <MdPersonOff size={20} />
                        <span className="abuse-reason-text">
                            <strong>{t('ui.abus.bloquer')}</strong>
                            <small>{t('ui.abus.bloquerAide')}</small>
                        </span>
                    </button>
                </div>

                <div className="modal-actions">
                    <Button type="button" onClick={onClose}>{t('ui.abus.annuler')}</Button>
                </div>
            </div>
        </div>
    )
}
