import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import Button from "../../ui/Button";
import IconButton from "../../ui/IconButton";
import { FaUserEdit, FaPen } from "react-icons/fa";
import EditPasswordModal from "./EditPasswordModal"
import { changePassword } from "../../../services/apiBack.mock";

import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"

export default function EditProfileModal({ isOpen, hasError, onClose, userData, onConfirm }) {
    const { token } = useAuth();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        birthDate: "",
        level: "intermediaire",
        password: ""
    });

  const [isModalOpenPassword, setIsModalOpenPassword] = useState(false);


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

    const handleSubmitPassword = async (passwordData) => {    
        try{
            await changePassword(token, passwordData.oldPassword, passwordData.newPassword);
            setIsModalOpenPassword(false);
        } catch (error) {
            console.error("Erreur lors du changement de mot de passe", error);
        }
        
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

                    </div>
                        
                    <IconButton type="button" className="button-change-password" onClick={() => setIsModalOpenPassword(true)} >Modifier le mot de passe <FaPen size={13}/></IconButton>

                    <div className="modal-actions">
                        <Button type="button" className="btn-cancel" onClick={onClose}>Annuler</Button>
                        <Button type="submit" className="btn-add">Modifier <FaUserEdit size={13}/></Button>
                    </div>
                </form>
            </div>

            <EditPasswordModal
                isOpen={isModalOpenPassword}    
                onClose={() => setIsModalOpenPassword(false)}
                onConfirm={handleSubmitPassword}
            />
        </div>
    )
}
