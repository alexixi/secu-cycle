import { useState, useEffect } from "react";
import Button from "../../ui/Button";
import { FaHome } from "react-icons/fa";
import { MdOutlineWork, MdEditLocationAlt } from "react-icons/md";

import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"

export default function EditAddressModal({ isOpen, onClose, addresses, onConfirm }) {
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
          
              <div className="input-group">
                    <label><FaHome size={15}/> Adresse du domicile</label>
                    <input 
                        className="input" 
                        type="text" 
                        name="homeAddress"
                        value={formData.homeAddress}
                        onChange={handleChange} 
                    />
                </div>

                <div className="input-group">
                    <label><MdOutlineWork size={15}/> Adresse du travail</label>
                    <input 
                        className="input" 
                        type="text" 
                        name="workAddress"
                        value={formData.workAddress}
                        onChange={handleChange} 
                    />
                </div>

              </div>

              <div className="modal-actions">
                <Button type="button" className="btn-cancel" onClick={onClose}>Annuler</Button>
                <Button type="submit" className="btn-add">Modifier <MdEditLocationAlt size={13}/></Button>
              </div>
            </form>
          </div>
        </div>
    )
}