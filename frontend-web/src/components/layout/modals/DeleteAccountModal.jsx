import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { MdDelete, MdWarningAmber, MdInfoOutline } from "react-icons/md";
import Button from "../../ui/Button";
import PasswordInput from "../../ui/PasswordInput";

import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"
import "./DeleteAccountModal.css"

// Des clés plutôt que des phrases : l'ordre vit ici, les mots dans le catalogue.
const SUPPRIME = ['ligneCompte', 'ligneIdentite', 'ligneAdresses', 'ligneVelos',
    'ligneTrajets', 'ligneBadges'];

export default function DeleteAccountModal({ isOpen, onClose, onConfirm, passwordError, generalError }) {
    const { t } = useTranslation('auth');
    const [password, setPassword] = useState("");
    const [acknowledged, setAcknowledged] = useState(false);

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

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(password);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content delete-account-modal">

                <div className="delete-account-header">
                    <span className="delete-account-badge">
                        <MdWarningAmber size={30} />
                    </span>
                    <h2>{t('modales.suppressionCompte.titre')}</h2>
                    <p className="delete-account-lead">{t('modales.suppressionCompte.chapeau')}</p>
                </div>

                <form onSubmit={handleSubmit}>

                    <p className="delete-account-section-title">{t('modales.suppressionCompte.sectionTitre')}</p>
                    <ul className="delete-account-list">
                        {SUPPRIME.map((cle) => <li key={cle}>{t(`modales.suppressionCompte.${cle}`)}</li>)}
                    </ul>

                    <div className="delete-account-keep">
                        <MdInfoOutline size={18} />
                        <span>{t('modales.suppressionCompte.conserve')}</span>
                    </div>

                    <div className={"input-group delete-account-field" + (passwordError ? " input-error" : "")}>
                        <label htmlFor="deletePassword">{t('modales.suppressionCompte.confirmezMotDePasse')}</label>
                        <PasswordInput
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            name="deletePassword"
                            autoComplete="current-password"
                            autoFocus
                        />
                    </div>

                    <div className="delete-account-ack">
                        <input
                            type="checkbox"
                            id="delete-ack"
                            checked={acknowledged}
                            onChange={() => setAcknowledged((prev) => !prev)}
                        />
                        <label htmlFor="delete-ack">{t('modales.suppressionCompte.acquittement')}</label>
                    </div>

                    {passwordError && <p className="error-text">{t('modales.suppressionCompte.motDePasseIncorrect')}</p>}
                    {generalError && <p className="error-text">{t('erreurs.generique')}</p>}

                    <div className="modal-actions">
                        <Button type="button" onClick={onClose}>{t('actions.annuler')}</Button>
                        <Button type="submit" className="danger-button" disabled={!acknowledged || !password}>
                            {t('actions.supprimer')} <MdDelete size={15} />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
