import { useState, useEffect } from "react";
import Button from "../../ui/Button";
import { MdOutlineReportProblem } from "react-icons/md";
import "../../ui/Input.css";
import "../../ui/PopUp.css";
import "../../ui/Form.css";

const REPORT_TYPES = [
    { value: "accident", label: "🚨 Accident" },
    { value: "travaux", label: "🚧 Travaux" },
    { value: "danger", label: "⚠️ Danger" },
    { value: "obstacle", label: "🪨 Obstacle" },
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
                            <select
                                className="input"
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                            >
                                {REPORT_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
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
