import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { FaPen, FaTrash } from "react-icons/fa";
import Button from "../../ui/Button";
import { MdDelete } from "react-icons/md";


import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"

export default function EditBikeModal({ isOpen, onClose, onConfirm, onDelete, hasError, bikeToEdit }) {
    const { t } = useTranslation('auth');
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
        <h2>{t('modales.modifVelo.titre')}</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <div className={"input-group" + (nameError ? " input-error" : "")}>
              <label htmlFor="name">{t('velo.nom')}</label>
              <input
                className="input"
                type="text"
                placeholder={t('velo.nomPlaceholder')}
                value={bikeName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                autoFocus
              />
              {nameError && (
                <div className="error-text">
                  {t('velo.nomRequis')}<br />{t('velo.nomInvalide')}
                </div>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="type">{t('velo.type')}</label>
              <select
                className="input"
                value={bikeType}
                onChange={(e) => setBikeType(e.target.value)}
              >
                <option value="ville">{t('velo.ville')}</option>
                <option value="route">{t('velo.route')}</option>
                <option value="vtt">{t('velo.vtt')}</option>
              </select>
            </div>

            <div className="input-group">
              <div className="form-group-checkbox">
                <label htmlFor="electric" style={{ margin: 0 }}>{t('velo.electrique')}</label>
                <input
                  type="checkbox"
                  checked={bikeIsElectric}
                  onChange={(e) => setBikeIsElectric(e.target.checked)}
                />
              </div>
            </div>
            {hasError && <p className="error-text">{t('erreurs.generique')}</p>}
          </div>

          <div className="modal-actions">
            <Button type="button" onClick={onClose}>{t('actions.annuler')}</Button>
            <Button type="button" className="danger-button" onClick={() => onDelete(bikeToEdit)} >{t('actions.supprimer')} <FaTrash size={13} /></Button>
            <Button type="submit">{t('actions.modifier')} <FaPen size={13} /></Button>
          </div>
        </form>

      </div>
    </div>
  );
}
