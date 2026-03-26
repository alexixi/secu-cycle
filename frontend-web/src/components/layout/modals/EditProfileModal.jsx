import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import Button from "../../ui/Button";
import IconButton from "../../ui/IconButton";
import { FaUserEdit, FaPen } from "react-icons/fa";
import EditPasswordModal from "./EditPasswordModal"
import { changePassword } from "../../../services/apiBack";

import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"

export default function EditProfileModal({ isOpen, hasError, onClose, userData, onConfirm }) {
    const { token } = useAuth();
    const [passwordError, setPasswordError] = useState(false);
    const [generalError, setGeneralError] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        birthDate: "",
        level: "intermediaire",
    });

    const [isModalOpenPassword, setIsModalOpenPassword] = useState(false);


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

    const handleSubmitPassword = async (passwordData) => {
        try {
            await changePassword(token, passwordData.oldPassword, passwordData.newPassword);
            setIsModalOpenPassword(false);
            setPasswordError(false);
            setGeneralError(false);
        } catch (error) {
            if (error.status === 401 && error.message === "Ancien mot de passe incorrect.") {
                setPasswordError(true);
                setGeneralError(false);
            } else {
                console.error("Error changing password:", error);
                setGeneralError(true);
                setPasswordError(false);
            }
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content form-container">
                <h2>Modifier mon profil</h2>
                <form onSubmit={handleSubmit}>

                    <div className="input-container">

                        <div className="input-group">
                            <label htmlFor="firstName">Prénom</label>
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
                            <label htmlFor="lastName">Nom</label>
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
                            <label htmlFor="email">Adresse mail</label>
                            <input
                                className="input"
                                type="email"
                                name="email"
                                id="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="birthDate">Date de naissance</label>
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
                            <label htmlFor="sport-level">Niveau sportif</label>
                            <select
                                className="input"
                                name="level"
                                id="sport-level"
                                value={formData.level}
                                onChange={handleChange}
                            >
                                <option value="debutant">Débutant</option>
                                <option value="intermediaire">Intermédiaire</option>
                                <option value="experimente">Experimenté</option>
                            </select>
                        </div>

                    </div>

                    <IconButton type="button" className="button-change-password" onClick={() => setIsModalOpenPassword(true)} >Modifier le mot de passe <FaPen size={13} /></IconButton>

                    <div className="modal-actions">
                        <Button type="button" className="btn-cancel" onClick={onClose}>Annuler</Button>
                        <Button type="submit" className="btn-add">Modifier <FaUserEdit size={13} /></Button>
                    </div>
                </form>
            </div>

            <EditPasswordModal
                isOpen={isModalOpenPassword}
                onClose={() => setIsModalOpenPassword(false)}
                onConfirm={handleSubmitPassword}
                passwordError={passwordError}
                generalError={generalError}
            />
        </div>
    )
}
