import { useState, useEffect } from "react";
import Button from "../../ui/Button";
import { FaUserEdit } from "react-icons/fa";

import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"

export default function EditProfileModal({ isOpen, hasError, onClose, userData, onConfirm }) {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        birthDate: "",
        level: "intermediaire",
        password: ""
    });

    useEffect(() => {
        if (userData) {
            setFormData(userData);
        }
    }, [userData, isOpen]);

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
            <div className="modal-content form-container">
                <h2>Modifier mon profil</h2>
                <form onSubmit={handleSubmit}>

                    <div className="input-container">

                        <div className="input-group">
                            <label>Prénom</label>
                            <input
                                className="input"
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <label>Nom</label>
                            <input
                                className="input"
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <label>Adresse mail</label>
                            <input
                                className="input"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <label>Date de naissance</label>
                            <input
                                className="input"
                                type="date"
                                name="birthDate"
                                value={formData.birthDate}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <label>Niveau sportif</label>
                            <select
                                className="input"
                                name="level"
                                value={formData.level}
                                onChange={handleChange}
                            >
                                <option value="debutant">Débutant</option>
                                <option value="intermediaire">Intermédiaire</option>
                                <option value="experimente">Experimenté</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label>Mot de passe</label>
                            <input
                                className="input"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        {hasError && <p className="error-text">Une erreur est survenue. Veuillez réessayer.</p>}
                    </div>

                    <div className="modal-actions">
                        <Button type="button" className="btn-cancel" onClick={onClose}>Annuler</Button>
                        <Button type="submit" className="btn-add">Modifier <FaUserEdit size={13} /></Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
