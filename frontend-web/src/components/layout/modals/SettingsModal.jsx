import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../../context/AuthContext";
import Button from "../../ui/Button";
import { FaUserEdit, FaEnvelope, FaLock, FaChevronRight, FaTrashAlt, FaUserSlash, FaRegNewspaper } from "react-icons/fa";
import EditPersonalInfoModal from "./EditPersonalInfoModal";
import EditPasswordModal from "./EditPasswordModal"
import DeleteAccountModal from "./DeleteAccountModal";
import BlockedAuthorsModal from "./BlockedAuthorsModal";
import NewsletterModal from "./NewsletterModal";
import { changePassword, deleteAccount } from "../../../services/apiBack";
import { useLocalizedPath } from '../../../i18n/useLang';

import "../../ui/Input.css"
import "../../ui/PopUp.css"
import "../../ui/Form.css"

export default function SettingsModal({ isOpen, hasError, onClose, userData, onConfirm }) {
    const { t } = useTranslation('auth');
    const path = useLocalizedPath();
    const { token, logoutAuth } = useAuth();
    const navigate = useNavigate();
    const [passwordError, setPasswordError] = useState(false);
    const [generalError, setGeneralError] = useState(false);

    const [isModalOpenInfos, setIsModalOpenInfos] = useState(false);
    const [isModalOpenPassword, setIsModalOpenPassword] = useState(false);
    const [isModalOpenDelete, setIsModalOpenDelete] = useState(false);
    const [isModalOpenBlocks, setIsModalOpenBlocks] = useState(false);
    const [isModalOpenNewsletter, setIsModalOpenNewsletter] = useState(false);
    const [deletePasswordError, setDeletePasswordError] = useState(false);
    const [deleteError, setDeleteError] = useState(false);


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

    // La sous-modale ne se referme qu'en cas de succès : sur échec, la saisie
    // reste à l'écran plutôt que d'être perdue. « Paramètres » reste ouverte
    // dans les deux cas, comme après un changement de mot de passe.
    const handleSubmitInfos = async (data) => {
        if (await onConfirm(data)) setIsModalOpenInfos(false);
    };

    const handleSubmitPassword = async (passwordData) => {
        try {
            await changePassword(token, passwordData.oldPassword, passwordData.newPassword);
            setIsModalOpenPassword(false);
            setPasswordError(false);
            setGeneralError(false);
        } catch (error) {
            // Sur PATCH /users/me/password, 401 ne signifie que « ancien mot de
            // passe faux » : les 401 de session morte sont interceptés en amont
            // par l'en-tête X-Auth-Error. Comparer le message traduit casserait
            // dès que l'API répond en anglais.
            if (error.status === 401) {
                setPasswordError(true);
                setGeneralError(false);
            } else {
                console.error("Error changing password:", error);
                setGeneralError(true);
                setPasswordError(false);
            }
        }
    };

    const handleDeleteAccount = async (password) => {
        setDeletePasswordError(false);
        setDeleteError(false);
        try {
            await deleteAccount(token, password);
            setIsModalOpenDelete(false);
            onClose();
            logoutAuth();
            navigate(path("home"), { replace: true });
        } catch (error) {
            if (error?.status === 401) {
                setDeletePasswordError(true);
            } else {
                console.error("Erreur suppression du compte:", error);
                setDeleteError(true);
            }
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{t('modales.parametres.titre')}</h2>

                <div className="modal-secondary-actions">
                    <button
                        type="button"
                        className="secondary-action-card"
                        onClick={() => setIsModalOpenInfos(true)}
                    >
                        <FaUserEdit className="secondary-action-icon" size={18} />
                        <span className="secondary-action-text">
                            <strong>{t('modales.profil.titre')}</strong>
                            <small>{t('modales.profil.infosAction')}</small>
                        </span>
                        <FaChevronRight className="secondary-action-chevron" size={13} />
                    </button>

                    {/* La modale doit se fermer avant la navigation, sinon
                        l'overlay persiste par-dessus la nouvelle page. */}
                    <button
                        type="button"
                        className="secondary-action-card"
                        onClick={() => { onClose(); navigate(path("profilEmail")); }}
                    >
                        <FaEnvelope className="secondary-action-icon" size={18} />
                        <span className="secondary-action-text">
                            <strong>{t('champs.email')}</strong>
                            <small>{userData?.email || t('modales.profil.emailNonRenseigne')}</small>
                        </span>
                        <FaChevronRight className="secondary-action-chevron" size={13} />
                    </button>

                    <button
                        type="button"
                        className="secondary-action-card"
                        onClick={() => setIsModalOpenPassword(true)}
                    >
                        <FaLock className="secondary-action-icon" size={18} />
                        <span className="secondary-action-text">
                            <strong>{t('champs.motDePasse')}</strong>
                            <small>{t('modales.profil.motDePasseAction')}</small>
                        </span>
                        <FaChevronRight className="secondary-action-chevron" size={13} />
                    </button>

                    <button
                        type="button"
                        className="secondary-action-card"
                        onClick={() => setIsModalOpenBlocks(true)}
                    >
                        <FaUserSlash className="secondary-action-icon" size={18} />
                        <span className="secondary-action-text">
                            <strong>{t('modales.auteursBloques.titre')}</strong>
                            <small>{t('modales.profil.auteursBloquesAction')}</small>
                        </span>
                        <FaChevronRight className="secondary-action-chevron" size={13} />
                    </button>

                    <button
                        type="button"
                        className="secondary-action-card"
                        onClick={() => setIsModalOpenNewsletter(true)}
                    >
                        <FaRegNewspaper className="secondary-action-icon" size={18} />
                        <span className="secondary-action-text">
                            <strong>{t('modales.profil.newsletter')}</strong>
                            <small>{t('modales.profil.newsletterAction')}</small>
                        </span>
                        <FaChevronRight className="secondary-action-chevron" size={13} />
                    </button>

                    <button
                        type="button"
                        className="secondary-action-card secondary-action-card-danger"
                        onClick={() => setIsModalOpenDelete(true)}
                    >
                        <FaTrashAlt className="secondary-action-icon" size={18} />
                        <span className="secondary-action-text">
                            <strong>{t('modales.profil.supprimerCompte')}</strong>
                            <small>{t('modales.profil.supprimerCompteAction')}</small>
                        </span>
                        <FaChevronRight className="secondary-action-chevron" size={13} />
                    </button>
                </div>

                <div className="modal-actions">
                    <Button type="button" onClick={onClose}>{t('actions.fermer')}</Button>
                </div>
            </div>

            <EditPersonalInfoModal
                isOpen={isModalOpenInfos}
                hasError={hasError}
                onClose={() => setIsModalOpenInfos(false)}
                userData={userData}
                onConfirm={handleSubmitInfos}
            />

            <EditPasswordModal
                isOpen={isModalOpenPassword}
                onClose={() => setIsModalOpenPassword(false)}
                onConfirm={handleSubmitPassword}
                oldPasswordError={passwordError}
                generalError={generalError}
            />

            <BlockedAuthorsModal
                isOpen={isModalOpenBlocks}
                onClose={() => setIsModalOpenBlocks(false)}
                token={token}
            />

            <NewsletterModal
                isOpen={isModalOpenNewsletter}
                onClose={() => setIsModalOpenNewsletter(false)}
            />

            <DeleteAccountModal
                isOpen={isModalOpenDelete}
                passwordError={deletePasswordError}
                generalError={deleteError}
                onClose={() => { setIsModalOpenDelete(false); setDeletePasswordError(false); setDeleteError(false); }}
                onConfirm={handleDeleteAccount}
            />
        </div>
    )
}
