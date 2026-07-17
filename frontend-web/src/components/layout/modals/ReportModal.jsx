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

const REPORT_TYPES = [
    { value: "accident", label: "Accident", icon: accidentIcon },
    { value: "travaux", label: "Travaux", icon: travauxIcon },
    { value: "danger", label: "Danger", icon: dangerIcon },
    { value: "obstacle", label: "Obstacle", icon: obstacleIcon },
];

export default function ReportModal({ isOpen, onClose, onConfirm, coords }) {
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
                <h2>Signaler un danger</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-container">
                        <div className="input-group">
                            <label>Type de signalement</label>
                            <div className="report-type-grid">
                                {REPORT_TYPES.map(t => (
                                    <button
                                        type="button"
                                        key={t.value}
                                        className={`report-type-card${reportType === t.value ? " selected" : ""}`}
                                        onClick={() => setReportType(t.value)}
                                        aria-pressed={reportType === t.value}
                                    >
                                        <img src={t.icon} alt="" className="report-type-icon" />
                                        <span>{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Description (optionnel)</label>
                            <textarea
                                className="input"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Décrivez le problème..."
                                style={{ resize: "vertical" }}
                            />
                        </div>
                    </div>
                    <div className="modal-actions">
                        <Button type="button" className="btn-cancel" onClick={onClose}>Annuler</Button>
                        <Button type="submit" className="btn-add">
                            Signaler <MdOutlineReportProblem size={15} />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
