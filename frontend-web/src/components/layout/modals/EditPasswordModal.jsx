import { useState, useEffect } from "react";
import Button from "../../ui/Button";
import PasswordInput from "../../ui/PasswordInput";
import { FaPen } from "react-icons/fa";

import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"

export default function EditPasswordModal({ isOpen, onClose, onConfirm, oldPasswordError, generalError }) {
    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [newPasswordError, setNewPasswordError] = useState(false);


    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.addEventListener("click", (e) => {
                if (e.target.classList.contains("modal-overlay")) {
                    onClose();
                }
            });
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("click", (e) => {
                if (e.target.classList.contains("modal-overlay")) {
                    onClose();
                }
            });
            document.body.style.overflow = "auto";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setNewPasswordError(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            setNewPasswordError(true);
            return;
        }
        setNewPasswordError(false);
        onConfirm(formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Modifier mon mot de passe</h2>
                <form onSubmit={handleSubmit}>

                    <div className="input-container">

                        <div className="input-group">
                            <label>Mot de passe actuel</label>
                            <PasswordInput value={formData.oldPassword} onChange={handleChange} name="oldPassword" autoFocus />
                            {oldPasswordError &&
                                <p className="error-text">Ancien mot de passe incorrect.</p>
                            }
                        </div>

                        <div className={"input-group" + (newPasswordError ? " input-error" : "")}>
                            <label>Nouveau mot de passe</label>
                            <PasswordInput value={formData.newPassword} onChange={handleChange} name="newPassword" />
                        </div>

                        <div className={"input-group" + (newPasswordError ? " input-error" : "")}>
                            <label>Confirmation du nouveau mot de passe</label>
                            <PasswordInput value={formData.confirmPassword} onChange={handleChange} name="confirmPassword" />
                        </div>

                    </div>

                    {newPasswordError &&
                        <p className="error-text">Les nouveaux mots de passe doivent être les mêmes.</p>
                    }
                    {generalError &&
                        <p className="error-text">Une erreur est survenue. Veuillez réessayer.</p>
                    }

                    <div className="modal-actions">
                        <Button type="button" onClick={onClose}>Annuler</Button>
                        <Button type="submit">Confirmer <FaPen size={13} /></Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
