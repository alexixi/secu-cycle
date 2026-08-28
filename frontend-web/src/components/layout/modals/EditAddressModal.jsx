import { useTranslation } from "react-i18next";
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

export default function EditAddressModal({ isOpen, hasError, onClose, onConfirm, focusField = "home" }) {
    const { t } = useTranslation('auth');
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
                <h2>{t('modales.adresses.titre')}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-container">

                        <div className="input-group changeAddressInput">
                            <label htmlFor="homeAddress"><FaHome size={15} /> {t('adresses.labelDomicile')}</label>
                            <AdressInput
                                id="homeAddress"
                                placeholder={t('adresses.domicile')}
                                defaultValue={homeAddress}
                                onSelect={(address) => setHomeAddress(address?.name || "")}
                                autoFocus={focusField === "home"}
                            />
                        </div>

                        <div className="input-group changeAddressInput">
                            <label htmlFor="workAddress"><MdOutlineWork size={15} /> {t('adresses.labelTravail')}</label>
                            <AdressInput
                                id="workAddress"
                                placeholder={t('adresses.travail')}
                                defaultValue={workAddress}
                                onSelect={(address) => setWorkAddress(address?.name || "")}
                                autoFocus={focusField === "work"}
                            />
                        </div>


                        {hasError && <p className="error-text">{t('erreurs.generique')}</p>}
                    </div>
                    <div className="modal-actions">
                        <Button type="button" onClick={onClose}>{t('actions.annuler')}</Button>
                        <Button type="submit">{t('actions.modifier')} <MdEditLocationAlt size={13} /></Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
