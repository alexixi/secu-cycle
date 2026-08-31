import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import Button from "../../ui/Button";
import { FaUserEdit } from "react-icons/fa";

import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"

export default function EditPersonalInfoModal({ isOpen, hasError, onClose, userData, onConfirm }) {
    const { t } = useTranslation('auth');
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        birthDate: "",
        level: "intermediaire",
    });

    useEffect(() => {
        if (userData) {
            setFormData(userData);
        }
    }, [userData, isOpen]);

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
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{t('modales.profil.titre')}</h2>
                <form onSubmit={handleSubmit}>

                    <div className="input-container">

                        <div className="input-group">
                            <label htmlFor="firstName">{t('champs.prenom')}</label>
                            <input
                                className="input"
                                type="text"
                                name="firstName"
                                id="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                autoFocus
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="lastName">{t('champs.nom')}</label>
                            <input
                                className="input"
                                type="text"
                                name="lastName"
                                id="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="birthDate">{t('modales.profil.naissance')}</label>
                            <input
                                className="input"
                                type="date"
                                name="birthDate"
                                id="birthDate"
                                value={formData.birthDate}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="sport-level">{t('modales.profil.niveauSportif')}</label>
                            <select
                                className="input"
                                name="level"
                                id="sport-level"
                                value={formData.level}
                                onChange={handleChange}
                            >
                                <option value="debutant">{t('niveau.debutant')}</option>
                                <option value="intermediaire">{t('niveau.intermediaire')}</option>
                                <option value="experimente">{t('niveau.experimente')}</option>
                            </select>
                        </div>

                    </div>

                    <div className="modal-actions">
                        <Button type="button" onClick={onClose}>{t('actions.annuler')}</Button>
                        <Button type="submit">{t('actions.modifier')} <FaUserEdit size={13} /></Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
