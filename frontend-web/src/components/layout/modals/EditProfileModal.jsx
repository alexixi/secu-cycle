import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../../context/AuthContext";
import Button from "../../ui/Button";
import { FaUserEdit, FaEnvelope, FaLock, FaChevronRight, FaTrashAlt } from "react-icons/fa";
import EditPasswordModal from "./EditPasswordModal"
import DeleteAccountModal from "./DeleteAccountModal";
import { changePassword, deleteAccount } from "../../../services/apiBack";

import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"

export default function EditProfileModal({ isOpen, hasError, onClose, userData, onConfirm }) {
    const { token, logoutAuth } = useAuth();
    const navigate = useNavigate();
    const [passwordError, setPasswordError] = useState(false);
    const [generalError, setGeneralError] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        birthDate: "",
        level: "intermediaire",
    });

    const [isModalOpenPassword, setIsModalOpenPassword] = useState(false);
    const [isModalOpenDelete, setIsModalOpenDelete] = useState(false);
    const [deletePasswordError, setDeletePasswordError] = useState(false);
    const [deleteError, setDeleteError] = useState(false);


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

    const handleDeleteAccount = async (password) => {
        setDeletePasswordError(false);
        setDeleteError(false);
        try {
            await deleteAccount(token, password);
            setIsModalOpenDelete(false);
            onClose();
            logoutAuth();
            navigate("/", { replace: true });
        } catch (error) {
            if (error?.status === 401) {
                setDeletePasswordError(true);
            } else {
                console.error("Erreur suppression du compte:", error);
                setDeleteError(true);
            }
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
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

                    <div className="modal-secondary-actions">
                        {/* La modale doit se fermer avant la navigation, sinon
                            l'overlay persiste par-dessus la nouvelle page. */}
                        <button
                            type="button"
                            className="secondary-action-card"
                            onClick={() => { onClose(); navigate("/profil/email"); }}
                        >
                            <FaEnvelope className="secondary-action-icon" size={18} />
                            <span className="secondary-action-text">
                                <strong>Adresse mail</strong>
                                <small>{userData?.email || "Non renseignée"}</small>
                            </span>
                            <FaChevronRight className="secondary-action-chevron" size={13} />
                        </button>

                        <button
                            type="button"
                            className="secondary-action-card"
                            onClick={() => setIsModalOpenPassword(true)}
                        >
                            <FaLock className="secondary-action-icon" size={18} />
                            <span className="secondary-action-text">
                                <strong>Mot de passe</strong>
                                <small>Modifier votre mot de passe</small>
                            </span>
                            <FaChevronRight className="secondary-action-chevron" size={13} />
                        </button>

                        <button
                            type="button"
                            className="secondary-action-card secondary-action-card-danger"
                            onClick={() => setIsModalOpenDelete(true)}
                        >
                            <FaTrashAlt className="secondary-action-icon" size={18} />
                            <span className="secondary-action-text">
                                <strong>Supprimer mon compte</strong>
                                <small>Effacer définitivement vos données</small>
                            </span>
                            <FaChevronRight className="secondary-action-chevron" size={13} />
                        </button>
                    </div>

                    <div className="modal-actions">
                        <Button type="button" onClick={onClose}>Annuler</Button>
                        <Button type="submit">Modifier <FaUserEdit size={13} /></Button>
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

            <DeleteAccountModal
                isOpen={isModalOpenDelete}
                passwordError={deletePasswordError}
                generalError={deleteError}
                onClose={() => { setIsModalOpenDelete(false); setDeletePasswordError(false); setDeleteError(false); }}
                onConfirm={handleDeleteAccount}
            />
        </div>
    )
}
