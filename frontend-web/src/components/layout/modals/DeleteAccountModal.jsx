import { useState, useEffect } from "react";
import { MdDelete, MdWarningAmber, MdInfoOutline } from "react-icons/md";
import Button from "../../ui/Button";
import PasswordInput from "../../ui/PasswordInput";

import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"
import "./DeleteAccountModal.css"

const SUPPRIME = [
    "Votre compte et votre adresse e-mail",
    "Votre nom, votre date de naissance et votre niveau sportif",
    "Vos adresses de domicile et de travail",
    "Vos vélos",
    "Vos itinéraires, leurs tracés et votre historique",
    "Vos badges et vos sessions de connexion",
];

export default function DeleteAccountModal({ isOpen, onClose, onConfirm, passwordError, generalError }) {
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
                    <h2>Supprimer mon compte</h2>
                    <p className="delete-account-lead">
                        La suppression est immédiate et définitive. Aucune restauration
                        ne sera possible.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>

                    <p className="delete-account-section-title">Ce qui sera supprimé</p>
                    <ul className="delete-account-list">
                        {SUPPRIME.map((ligne) => <li key={ligne}>{ligne}</li>)}
                    </ul>

                    <div className="delete-account-keep">
                        <MdInfoOutline size={18} />
                        <span>
                            Vos signalements de dangers restent visibles pour les autres
                            cyclistes, mais ils ne sont plus reliés à votre compte.
                        </span>
                    </div>

                    <div className={"input-group delete-account-field" + (passwordError ? " input-error" : "")}>
                        <label htmlFor="deletePassword">Confirmez avec votre mot de passe</label>
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
                        <label htmlFor="delete-ack">
                            Je comprends que mon compte et mes données seront supprimés
                            sans possibilité de restauration.
                        </label>
                    </div>

                    {passwordError && <p className="error-text">Mot de passe incorrect.</p>}
                    {generalError && <p className="error-text">Une erreur est survenue. Veuillez réessayer.</p>}

                    <div className="modal-actions">
                        <Button type="button" onClick={onClose}>Annuler</Button>
                        <Button type="submit" className="danger-button" disabled={!acknowledged || !password}>
                            Supprimer <MdDelete size={15} />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
