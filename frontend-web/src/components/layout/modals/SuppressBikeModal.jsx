import { useState, useEffect } from "react";
import { IoCheckmark } from "react-icons/io5";
import Button from "../../ui/Button";

import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"

export default function SuppressBikeModal({ isOpen, hasError, onClose, bikes, onConfirm }) {
    const [selectedIndexes, setSelectedIndexes] = useState([]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            console.log(e.key);
            if (e.key === "Escape") {
                onClose();
            }
            else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
                e.preventDefault();

                if (selectedIndexes.length === bikes.length) {
                    setSelectedIndexes([]);
                } else {
                    setSelectedIndexes(bikes.map((_, index) => index));
                }
            }
            else if ((e.key === "Delete" || e.key === "Backspace" || e.key === "Enter") && selectedIndexes.length > 0) {
                e.preventDefault();
                onConfirm(selectedIndexes);
                setSelectedIndexes([]);
            }
        };

        const handleOverlayClick = (e) => {
            if (e.target.classList.contains("modal-overlay")) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("click", handleOverlayClick);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("click", handleOverlayClick);
            document.body.style.overflow = "auto";
        };
    }, [isOpen, onClose, bikes, selectedIndexes, onConfirm]);
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
            <div className="modal-content">
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
                                    <strong>{bike.name || bike.type?.toUpperCase() || "Vélo"}</strong>
                                    {bike.is_electric ? " (Électrique)" : ""}
                                </label>
                            </div>
                        ))}

                        {hasError && <p className="error-text">Une erreur est survenue. Veuillez réessayer.</p>}
                    </div>

                    <div className="modal-actions">
                        <Button type="button" onClick={onClose}>Annuler</Button>
                        <Button type="submit" className="danger-button">Confirmer <IoCheckmark size={13} /></Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
