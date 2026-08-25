import { useEffect } from "react";
import { MdWarningAmber, MdCampaign, MdWrongLocation, MdMoreHoriz, MdPersonOff } from "react-icons/md";
import Button from "../../ui/Button";

import "../../ui/PopUp.css"
import "./ReportAbuseModal.css"

const REASONS = [
    { key: "offensive", Icon: MdWarningAmber, label: "Contenu offensant", hint: "Insultes, haine, propos déplacés" },
    { key: "spam", Icon: MdCampaign, label: "Spam ou publicité", hint: "Message sans rapport avec la sécurité à vélo" },
    { key: "wrong_place", Icon: MdWrongLocation, label: "Signalement fantaisiste", hint: "Danger inventé ou placé n'importe où" },
    { key: "other", Icon: MdMoreHoriz, label: "Autre motif", hint: null },
];

export default function ReportAbuseModal({ isOpen, onClose, onReport, onBlock }) {
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
                <h2>Signaler ce contenu</h2>
                <p className="abuse-lead">
                    Nous examinons chaque signalement sous 24 heures. Au-delà de deux
                    signalements, le contenu disparaît de la carte en attendant notre décision.
                </p>

                {REASONS.map(({ key, Icon, label, hint }) => (
                    <button key={key} type="button" className="abuse-reason" onClick={() => onReport(key)}>
                        <Icon size={20} />
                        <span className="abuse-reason-text">
                            <strong>{label}</strong>
                            {hint && <small>{hint}</small>}
                        </span>
                    </button>
                ))}

                <div className="abuse-block">
                    <button type="button" className="abuse-reason" onClick={onBlock}>
                        <MdPersonOff size={20} />
                        <span className="abuse-reason-text">
                            <strong>Bloquer cet auteur</strong>
                            <small>Vous ne verrez plus aucun de ses signalements. Réversible depuis votre profil.</small>
                        </span>
                    </button>
                </div>

                <div className="modal-actions">
                    <Button type="button" onClick={onClose}>Annuler</Button>
                </div>
            </div>
        </div>
    )
}
