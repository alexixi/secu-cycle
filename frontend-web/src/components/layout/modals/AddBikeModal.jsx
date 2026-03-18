import { useState, useEffect } from "react";
import { AiFillPlusCircle } from "react-icons/ai";
import Button from "../../ui/Button";

import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"

export default function AddBikeModal({ isOpen, hasError, onClose, onConfirm }) {
  const [bikeName, setBikeName] = useState("");
  const [bikeType, setBikeType] = useState("vtt");
  const [bikeIsElectric, setBikeIsElectric] = useState(false);

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
              <label htmlFor="bikeName">Nom du vélo :</label>
              <input
                className="input"
                type="text"
                id="bikeName"
                placeholder="Ex: Nakamura Summit 700"
                value={bikeName}
                onChange={(e) => setBikeName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="input-group">
              <label htmlFor="bikeType">Type :</label>
              <select
                className="input"
                id="bikeType"
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
                <label htmlFor="bikeIsElectric" style={{ margin: 0 }}>Électrique</label>
                <input
                  type="checkbox"
                  id="bikeIsElectric"
                  checked={bikeIsElectric}
                  onChange={(e) => setBikeIsElectric(e.target.checked)}
                />
              </div>
            </div>
            {hasError && <p className="error-text">Une erreur est survenue. Veuillez réessayer.</p>}
          </div>

          <div className="modal-actions">
            <Button type="button" className="btn-cancel" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="btn-add">Ajouter <AiFillPlusCircle size={13} /></Button>
          </div>
        </form>

      </div>
    </div>
  );
}
