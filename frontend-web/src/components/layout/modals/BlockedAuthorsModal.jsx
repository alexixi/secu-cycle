import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useState } from "react";
import { MdPersonOff } from "react-icons/md";
import Button from "../../ui/Button";
import i18n from "../../../i18n/index";
import { getMyBlocks, unblockUser } from "../../../services/apiBack";

import "../../ui/PopUp.css"
import "./ReportAbuseModal.css"

const formatDate = (iso) => {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(i18n.language, { day: "numeric", month: "long", year: "numeric" });
};

export default function BlockedAuthorsModal({ isOpen, onClose, token }) {
    const { t } = useTranslation('auth');
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        getMyBlocks(token)
            .then((data) => { setBlocks(data || []); setError(false); })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [token]);

    useEffect(() => {
        if (isOpen) load();
    }, [isOpen, load]);

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

    const handleUnblock = async (blockedId) => {
        setBlocks((prev) => prev.filter((b) => b.blocked_id !== blockedId));
        try {
            await unblockUser(token, blockedId);
        } catch (e) {
            console.error("Déblocage impossible :", e);
            setError(true);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content abuse-modal">
                <h2>{t('modales.auteursBloques.titre')}</h2>
                <p className="abuse-lead">{t('modales.auteursBloques.intro')}</p>

                {loading && <p className="abuse-lead">{t('actions.chargement')}</p>}
                {!loading && error && <p className="error-text">{t('modales.auteursBloques.erreurChargement')}</p>}
                {!loading && !error && blocks.length === 0 && (
                    <p className="abuse-lead">{t('modales.auteursBloques.aucun')}</p>
                )}

                {blocks.map((block) => (
                    <div key={block.blocked_id} className="abuse-reason blocked-row">
                        <MdPersonOff size={20} />
                        <span className="abuse-reason-text">
                            <strong>{t('modales.auteursBloques.auteur')}</strong>
                            <small>{t('modales.auteursBloques.depuis', { date: formatDate(block.created_at) })}</small>
                        </span>
                        <button
                            type="button"
                            className="blocked-unblock"
                            onClick={() => handleUnblock(block.blocked_id)}
                        >
                            {t('actions.debloquer')}
                        </button>
                    </div>
                ))}

                <div className="modal-actions">
                    <Button type="button" onClick={onClose}>{t('actions.fermer')}</Button>
                </div>
            </div>
        </div>
    )
}
