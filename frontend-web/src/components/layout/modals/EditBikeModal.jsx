import { useEffect, useState } from "react";
import { FaPen } from "react-icons/fa";
import Button from "../../ui/Button";
import IconButton from "../../ui/IconButton";
import { MdDelete } from "react-icons/md";


import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"

export default function EditBikeModal({ isOpen, onClose, onConfirm, onDelete, hasError, bikeToEdit }) {
  const [bikeName, setBikeName] = useState("");
  const [bikeType, setBikeType] = useState("vtt");
  const [bikeIsElectric, setBikeIsElectric] = useState(false);

  useEffect(() => {
    if (bikeToEdit) {
      setBikeName(bikeToEdit.name || "");
      setBikeType(bikeToEdit.type || "vtt");
      setBikeIsElectric(bikeToEdit.isElectric === true || bikeToEdit.isElectric === "1");
    }
  }, [bikeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      ...bikeToEdit,
      name: bikeName,
      type: bikeType,
      isElectric: bikeIsElectric
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content form-container">
        <h2>Modifier un vélo</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <div className="input-group">
              <label htmlFor="name">Nom du vélo :</label>
              <input
                className="input"
                type="text"
                placeholder="Ex: Nakamura Summit 700"
                value={bikeName}
                onChange={(e) => setBikeName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label htmlFor="type">Type :</label>
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
                <label htmlFor="electric" style={{ margin:0 }}>Électrique</label>
                <input
                  type="checkbox"
                  checked={bikeIsElectric}
                  onChange={(e) => setBikeIsElectric(e.target.checked)}
                />
              </div>
            </div>
            {hasError && <p className="error-text">Une erreur est survenue. Veuillez réessayer.</p>}
          </div>

          <IconButton type="button" className="button-suppress-bike" onClick={() => onDelete(bikeToEdit)} >Supprimer le vélo <MdDelete size={20} /></IconButton>

          <div className="modal-actions">
            <Button type="button" className="btn-cancel" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="btn-add">Modifier <FaPen size={13}/></Button>
          </div>
        </form>

      </div>
    </div>
  );
}
