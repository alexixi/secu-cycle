import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import Button from "../../ui/Button";
import { MdOutlineReportProblem } from "react-icons/md";
import "../../ui/Input.css";
import "../../ui/PopUp.css";
import "../../ui/Form.css";
import "./ReportModal.css";
import accidentIcon from "../../../assets/reports/accident.png";
import travauxIcon from "../../../assets/reports/travaux.png";
import dangerIcon from "../../../assets/reports/danger.png";
import obstacleIcon from "../../../assets/reports/obstacle.png";
import { carteLabel } from "../../../i18n/carteLabels";

// Les libellés vivent dans le domaine « carte », partagés avec les marqueurs de
// MapComponent : un même type ne doit pas se nommer autrement selon l'endroit.
const REPORT_TYPES = [
    { value: "accident", icon: accidentIcon },
    { value: "travaux", icon: travauxIcon },
    { value: "danger", icon: dangerIcon },
    { value: "obstacle", icon: obstacleIcon },
];

export default function ReportModal({ isOpen, onClose, onConfirm, coords }) {
    const { t } = useTranslation('itineraire');
    const [reportType, setReportType] = useState("danger");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (isOpen) {
            setReportType("danger");
            setDescription("");
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
            else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                onConfirm({ reportType, description, lat: coords.lat, lon: coords.lon });
            }
        };
        const handleClickOutside = (e) => {
            if (e.target.classList.contains("modal-overlay")) onClose();
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
        e.preventDefault();
        onConfirm({ reportType, description, lat: coords.lat, lon: coords.lon });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content form-container">
                <h2>{t('signalement.titre')}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-container">
                        <div className="input-group">
                            <label>{t('signalement.type')}</label>
                            <div className="report-type-grid">
                                {REPORT_TYPES.map(type => (
                                    <button
                                        type="button"
                                        key={type.value}
                                        className={`report-type-card${reportType === type.value ? " selected" : ""}`}
                                        onClick={() => setReportType(type.value)}
                                        aria-pressed={reportType === type.value}
                                    >
                                        <img src={type.icon} alt="" className="report-type-icon" />
                                        <span>{carteLabel('signalement', type.value)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="input-group">
                            <label>{t('signalement.description')}</label>
                            <textarea
                                className="input"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t('signalement.descriptionPlaceholder')}
                                style={{ resize: "vertical" }}
                            />
                        </div>
                    </div>
                    <div className="modal-actions">
                        <Button type="button" className="btn-cancel" onClick={onClose}>{t('signalement.annuler')}</Button>
                        <Button type="submit" className="btn-add">
                            {t('signalement.envoyer')} <MdOutlineReportProblem size={15} />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
