import { useState, useEffect } from "react";
import { AiFillPlusCircle } from "react-icons/ai";
import Button from "../../ui/Button";
import { useAuth } from "../../../context/AuthContext";


import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"

export default function AddBikeModal({ isOpen, hasError, onClose, onConfirm }) {
  const [bikeName, setBikeName] = useState("");
  const [nameError, setNameError] = useState(false)
  const [bikeType, setBikeType] = useState("ville");
  const [bikeIsElectric, setBikeIsElectric] = useState(false);
  const { userBikes } = useAuth();

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
    let name = bikeName.trim();
    if (name === "") {
      const sameTypeCount = userBikes.filter((v) => v.type === bikeType).length;
      if (sameTypeCount === 0) {
        name = bikeType.charAt(0).toUpperCase() + bikeType.slice(1);
      } else {
        name = `${bikeType.charAt(0).toUpperCase() + bikeType.slice(1)} ${sameTypeCount + 1}`;
      }
    } else if (name.length < 3 || name.length > 30) {
      setNameError(true);
      return;
    }
    onConfirm({
      name: name,
      type: bikeType,
      isElectric: bikeIsElectric
    });

    setBikeName("");
    setBikeType(bikeType);
    setBikeIsElectric(false);
    setNameError(false);
  };


  const handleChange = (e) => {
    setBikeName(e.target.value)
    if (!e || e.target.value.trim() === "" || (e.target.value.trim().length >= 3 && e.target.value.trim().length <= 30)) {
      setNameError(false);
    }
  }

  const handleBlur = (e) => {
    if (!e || e.target.value.trim() === "") {
      setNameError(false);
    } else if (e.target.value.trim().length < 3 || e.target.value.trim().length > 30) {
      setNameError(true);
    } else {
      setNameError(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content form-container">
        <h2>Ajouter un vélo</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <div className={"input-group" + (nameError ? " input-error" : "")}>
              <label htmlFor="bikeName">Nom du vélo :</label>
              <input
                className="input"
                type="text"
                id="bikeName"
                placeholder="Ex: Nakamura Summit 700"
                value={bikeName}
                onBlur={handleBlur}
                onChange={handleChange}
                autoFocus
              />
              {nameError && (
                <div className="error-text">
                  Veuillez entrer un nom de vélo valide.<br />Le nom doit faire entre 3 et 30 caractères.
                </div>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="bikeType">Type :</label>
              <select
                className="input"
                id="bikeType"
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
