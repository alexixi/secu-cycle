import { useEffect, useState } from "react";
import { FaRegNewspaper } from "react-icons/fa";
import Button from "../../ui/Button";
import { useAuth } from "../../../context/AuthContext";
import { setRecapEmails } from "../../../services/apiBack";

import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"

/**
 * Abonnements aux e-mails, ouverts depuis « Modifier mon profil ».
 *
 * La modale lit et écrit directement le contexte d'authentification plutôt que
 * de recevoir la valeur en propriété : `user.recap_emails` est la source de
 * vérité, et la faire transiter par le formulaire parent créerait un second état
 * à tenir synchronisé pour rien.
 *
 * Elle est prévue pour accueillir d'autres abonnements : chaque case s'ajoute
 * dans `preferences`, et l'enregistrement n'envoie que ce qui a changé.
 */
export default function NewsletterModal({ isOpen, onClose }) {
    const { user, token, updateUser } = useAuth();

    const [recapEmails, setRecapEmailsState] = useState(true);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(false);

    // Réaligné à chaque ouverture : rouvrir après avoir annulé doit montrer la
    // valeur enregistrée, pas celle qu'on avait laissée en plan.
    useEffect(() => {
        if (isOpen) {
            setRecapEmailsState(user?.recap_emails !== false);
            setError(false);
        }
    }, [isOpen, user]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Rien n'a bougé : inutile d'écrire, on referme simplement.
        if (recapEmails === (user?.recap_emails !== false)) {
            onClose();
            return;
        }

        setPending(true);
        setError(false);
        try {
            const updated = await setRecapEmails(token, recapEmails);
            updateUser({ ...user, ...updated });
            onClose();
        } catch (err) {
            console.error("Error updating newsletter preferences:", err);
            setError(true);
        } finally {
            setPending(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Newsletter</h2>
                <form onSubmit={handleSubmit}>

                    <label className="secondary-action-card secondary-action-card-check">
                        <FaRegNewspaper className="secondary-action-icon" size={18} />
                        <span className="secondary-action-text">
                            <strong>Récapitulatif d&apos;activité</strong>
                            <small>
                                Un bilan de vos trajets, kilomètres et badges au début de chaque
                                mois, et en début d&apos;année.
                            </small>
                        </span>
                        <input
                            type="checkbox"
                            name="recapEmails"
                            className="secondary-action-checkbox"
                            checked={recapEmails}
                            onChange={(e) => setRecapEmailsState(e.target.checked)}
                            disabled={pending}
                        />
                    </label>

                    <p className="newsletter-note">
                        Les e-mails liés à votre compte — vérification, réinitialisation de mot
                        de passe — ne dépendent pas de ce réglage et continueront de vous être
                        envoyés.
                    </p>

                    {error && (
                        <p className="error-text" role="alert">
                            Le réglage n&apos;a pas pu être enregistré. Réessayez dans un instant.
                        </p>
                    )}

                    <div className="modal-actions">
                        <Button type="button" onClick={onClose}>Annuler</Button>
                        <Button type="submit" disabled={pending}>Enregistrer</Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
