import { useState, useEffect, use } from "react";
import { useAuth } from "../../../context/AuthContext";
import Button from "../../ui/Button";
import AdressInput from "../../ui/AdressInput";
import { FaHome } from "react-icons/fa";
import { MdOutlineWork, MdEditLocationAlt } from "react-icons/md";

import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"
import "./AddressModal.css"

export default function EditAddressModal({ isOpen, hasError, onClose, onConfirm }) {
    const { user } = useAuth();

    const [homeAddress, setHomeAddress] = useState(user?.home_address || "");
    const [workAddress, setWorkAddress] = useState(user?.work_address || "");

    useEffect(() => {
        if (isOpen && user) {
            setHomeAddress(user.home_address || "");
            setWorkAddress(user.work_address || "");
        }
    }, [isOpen, user]);

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

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(homeAddress, workAddress);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Modifier mes adresses</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-container">

                        <div className="input-group changeAddressInput">
                            <label htmlFor="homeAddress"><FaHome size={15} /> Adresse du domicile</label>
                            <AdressInput
                                id="homeAddress"
                                placeholder="Domicile"
                                defaultValue={homeAddress}
                                onSelect={(address) => setHomeAddress(address?.name || "")}
                                autoFocus
                            />
                        </div>

                        <div className="input-group changeAddressInput">
                            <label htmlFor="workAddress"><MdOutlineWork size={15} /> Adresse du travail</label>
                            <AdressInput
                                id="workAddress"
                                placeholder="Travail"
                                defaultValue={workAddress}
                                onSelect={(address) => setWorkAddress(address?.name || "")}
                            />
                        </div>


                        {hasError && <p className="error-text">Une erreur est survenue. Veuillez réessayer.</p>}
                    </div>
                    <div className="modal-actions">
                        <Button type="button" onClick={onClose}>Annuler</Button>
                        <Button type="submit">Modifier <MdEditLocationAlt size={13} /></Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
