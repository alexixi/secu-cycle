import { useState } from "react";
import { AiFillPlusCircle } from "react-icons/ai";
import Button from "../../ui/Button";

import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"

export default function AddBikeModal({ isOpen, onClose, onConfirm }) {
  const [bikeName, setBikeName] = useState("");
  const [bikeType, setBikeType] = useState("vtt");
  const [bikeIsElectric, setBikeIsElectric] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      name: bikeName,
      type: bikeType,
      isElectric: bikeIsElectric
    });
    
    setBikeName("");
    setBikeType("vtt");
    setBikeIsElectric(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content form-container">
        <h2>Ajouter un vélo</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <div className="input-group">
              <label>Nom du vélo :</label>
              <input 
                className="input" 
                type="text" 
                placeholder="Ex: Nakamura Summit 700" 
                value={bikeName}
                onChange={(e) => setBikeName(e.target.value)} 
              />
            </div>

            <div className="input-group">
              <label>Type :</label>
              <select 
                className="input" 
                value={bikeType} 
                onChange={(e) => setBikeType(e.target.value)}
              >
                <option value="vtt">VTT</option>
                <option value="ville">Ville</option>
                <option value="route">Route</option>
              </select>
            </div>

            <div className="input-group">
              <div className="form-group-checkbox">
                <label>Électrique</label> 
                <input 
                  type="checkbox" 
                  checked={bikeIsElectric} 
                  onChange={(e) => setBikeIsElectric(e.target.checked)} 
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <Button type="button" className="btn-cancel" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="btn-add">Ajouter <AiFillPlusCircle size={13}/></Button>
          </div>
        </form>
      </div>
    </div>
  );
}