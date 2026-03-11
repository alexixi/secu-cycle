import { useState } from "react";
import { IoCheckmark } from "react-icons/io5";
import Button from "../../ui/Button";

import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"

export default function SuppressBikeModal({ isOpen, hasError, onClose, bikes, onConfirm }) {
    const [selectedIndexes, setSelectedIndexes] = useState([]);

    if (!isOpen) return null;

    const handleCheckboxChange = (index) => {
        setSelectedIndexes((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(selectedIndexes);
        setSelectedIndexes([]);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content form-container">
                <h2>Supprimer mes vélos</h2>
                <form onSubmit={handleSubmit}>

                    <div className="input-container group-checkbox-container">

                        <p>Sélectionnez les vélos à retirer de votre profil :</p>

                        {bikes.map((bike, index) => (
                            <div key={index} className="form-group-checkbox">
                                <input
                                    type="checkbox"
                                    id={`bike-${index}`}
                                    checked={selectedIndexes.includes(index)}
                                    onChange={() => handleCheckboxChange(index)}
                                />
                                <label htmlFor={`bike-${index}`}>
                                    <strong>{bike.name || bike.type.toUpperCase()}</strong>
                                    {bike.isElectric === "1" || bike.isElectric === true ? " (Électrique)" : ""}
                                </label>
                            </div>
                        ))}

                        {hasError && <p className="error-text">Une erreur est survenue. Veuillez réessayer.</p>}
                    </div>

                    <div className="modal-actions">
                        <Button type="button" className="btn-cancel" onClick={onClose}>Annuler</Button>
                        <Button type="submit" className="btn-add">Confirmer <IoCheckmark size={13} /></Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
