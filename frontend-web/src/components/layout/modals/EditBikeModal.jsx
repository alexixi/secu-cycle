import { useEffect, useState } from "react";
import { FaPen, FaTrash } from "react-icons/fa";
import Button from "../../ui/Button";
import { MdDelete } from "react-icons/md";


import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"

export default function EditBikeModal({ isOpen, onClose, onConfirm, onDelete, hasError, bikeToEdit }) {
  const [bikeName, setBikeName] = useState("");
  const [bikeType, setBikeType] = useState("ville");
  const [bikeIsElectric, setBikeIsElectric] = useState(false);
  const [nameError, setNameError] = useState(false)
  const [writing, setWriting] = useState(false);

  useEffect(() => {
    if (bikeToEdit) {
      setBikeName(bikeToEdit.name || "");
      setBikeType(bikeToEdit.type || "ville");
      setBikeIsElectric(bikeToEdit.is_electric === true);
    }
  }, [bikeToEdit, isOpen]);


  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter") {
        handleSubmit(e);
      } else if ((e.key === "Delete") && bikeToEdit && !writing) {
        e.preventDefault();
        onDelete(bikeToEdit);
      }
    };

    const handleClickOutside = (e) => {
      if (e.target.classList.contains("modal-overlay")) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("click", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    setBikeName(bikeName?.trim());
    console.log("bikeName dans SUBMIT" + bikeName)
    if (!bikeName || bikeName === "" || bikeName.length < 3 || bikeName.length > 30) {
      setNameError(true);
      return;
    }
    e.preventDefault();
    onConfirm({
      ...bikeToEdit,
      name: bikeName,
      type: bikeType,
      is_electric: bikeIsElectric
    });
    setBikeName("");
    setBikeType(bikeType);
    setNameError(false);
  };

  const handleChange = (e) => {
    setBikeName(e.target.value)
    setWriting(true);
    if (e.target.value.trim().length >= 3 && e.target.value.trim().length <= 30) {
      setNameError(false);
    }
  }

  const handleBlur = (e) => {
    setWriting(false);
    if (!e || e.target.value.trim() === "" || e.target.value.trim().length < 3 || e.target.value.trim().length > 30) {
      setNameError(true);
    } else {
      setNameError(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Modifier un vélo</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <div className={"input-group" + (nameError ? " input-error" : "")}>
              <label htmlFor="name">Nom du vélo :</label>
              <input
                className="input"
                type="text"
                placeholder="Ex: Nakamura Summit 700"
                value={bikeName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                autoFocus
              />
              {nameError && (
                <div className="error-text">
                  Veuillez entrer un nom de vélo valide.<br />Le nom doit faire entre 3 et 30 caractères.
                </div>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="type">Type :</label>
              <select
                className="input"
                value={bikeType}
                onChange={(e) => setBikeType(e.target.value)}
              >
                <option value="ville">Ville</option>
                <option value="route">Route</option>
                <option value="vtt">VTT</option>
              </select>
            </div>

            <div className="input-group">
              <div className="form-group-checkbox">
                <label htmlFor="electric" style={{ margin: 0 }}>Électrique</label>
                <input
                  type="checkbox"
                  checked={bikeIsElectric}
                  onChange={(e) => setBikeIsElectric(e.target.checked)}
                />
              </div>
            </div>
            {hasError && <p className="error-text">Une erreur est survenue. Veuillez réessayer.</p>}
          </div>

          <div className="modal-actions">
            <Button type="button" onClick={onClose}>Annuler</Button>
            <Button type="button" className="danger-button" onClick={() => onDelete(bikeToEdit)} >Supprimer <FaTrash size={13} /></Button>
            <Button type="submit">Modifier <FaPen size={13} /></Button>
          </div>
        </form>

      </div>
    </div>
  );
}
