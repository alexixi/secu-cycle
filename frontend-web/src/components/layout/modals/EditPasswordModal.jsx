import { useState, useEffect } from "react";
import Button from "../../ui/Button";
import PasswordInput from "../../ui/PasswordInput";
import { FaPen } from "react-icons/fa";

import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"

export default function EditPasswordModal({ isOpen, onClose, onConfirm }) {
    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [errorMessage, setErrorMessage] = useState("");
    const hasError = errorMessage.length > 0;

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errorMessage) setErrorMessage("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            setErrorMessage("Les nouveaux mots de passe doivent être les mêmes.");
            return;
        }
        setErrorMessage("");
        onConfirm(formData);
    };

    return (
        <div className="modal-overlay">
          <div className="modal-content form-container">
            <h2>Modifier mon mot de passe</h2>
            <form onSubmit={handleSubmit}>

              <div className="input-container">
          
                <div className="input-group">
                    <label>Mot de passe actuel</label>
                    <PasswordInput value={formData.oldPassword} onChange={handleChange} name="oldPassword">
                    </PasswordInput>
                </div>

                <div className={"input-group" + (hasError ? " input-error" : "")}>
                    <label>Nouveau mot de passe</label>
                    <PasswordInput value={formData.newPassword} onChange={handleChange} name="newPassword">
                    </PasswordInput>
                </div>

                <div className={"input-group" + (hasError ? " input-error" : "")}>
                    <label>Confirmation du nouveau mot de passe</label>
                    <PasswordInput value={formData.confirmPassword} onChange={handleChange} name="confirmPassword">
                    </PasswordInput>
                </div>

              </div>

              {hasError && <p className="error-text">{errorMessage}</p>}

              <div className="modal-actions">
                <Button type="button" className="btn-cancel" onClick={onClose}>Annuler</Button>
                <Button type="submit" className="btn-add">Confirmer <FaPen size={13}/></Button>
              </div>
            </form>
          </div>
        </div>
    )
}