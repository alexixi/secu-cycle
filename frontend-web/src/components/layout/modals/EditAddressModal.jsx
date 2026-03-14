import { useState, useEffect } from "react";
import Button from "../../ui/Button";
import AdressInput from "../../ui/AdressInput";
import { FaHome } from "react-icons/fa";
import { MdOutlineWork, MdEditLocationAlt } from "react-icons/md";

import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"
import "./AddressModal.css"

export default function EditAddressModal({ isOpen, hasError, onClose, addresses, onConfirm }) {
    const [formData, setFormData] = useState({
        homeAddress: "",
        workAddress: ""
    });

    useEffect(() => {
        if (addresses) {
            setFormData(addresses);
        }
    }, [addresses, isOpen]);

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
                <h2>Modifier mes adresses</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-container">

                        <div className="input-group changeAddressInput">
                            <label><FaHome size={15} /> Adresse du domicile</label>
                            <AdressInput
                                id="homeAddress"
                                placeholder="Domicile"
                                defaultValue={formData.homeAddress}
                                onSelect={(place) => setFormData(prev => ({ ...prev, homeAddress: place.name }))}
                            />
                        </div>

                        <div className="input-group changeAddressInput">
                            <label><MdOutlineWork size={15} /> Adresse du travail</label>
                            <AdressInput
                                id="workAddress"
                                placeholder="Travail"
                                defaultValue={formData.workAddress}
                                onSelect={(place) => setFormData(prev => ({ ...prev, workAddress: place.name }))}
                            />
                        </div>


                        {hasError && <p className="error-text">Une erreur est survenue. Veuillez réessayer.</p>}
                    </div>
                    <div className="modal-actions">
                        <Button type="button" className="btn-cancel" onClick={onClose}>Annuler</Button>
                        <Button type="submit" className="btn-add">Modifier <MdEditLocationAlt size={13} /></Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
