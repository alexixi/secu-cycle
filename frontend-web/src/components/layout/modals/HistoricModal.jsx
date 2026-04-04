import { useEffect } from "react";

import Button from "../../ui/Button";
import MapComponent from "../../../modules/map/MapComponent";

import { FaTrash } from "react-icons/fa";
import { MdDirectionsBike, MdOutlineTimer } from "react-icons/md";
import { FaFlagCheckered } from "react-icons/fa";
import { PiPathBold } from "react-icons/pi";

import "../../ui/PopUp.css"
import "./HistoricModal.css";

export default function HistoricModal({ isOpen, onClose, onDelete, entry }) {

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" || e.key === "Enter") {
                onClose();
            } else if (e.key === "Delete" || e.key === "Backspace") {
                e.preventDefault();
                onDelete();
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

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-main">
                    <div className="modal-path-info">
                        <div className="modal-path-info-address">
                            <h3><MdDirectionsBike size={24} /> {entry.route.start_address}</h3>
                            <h3><FaFlagCheckered size={24} /> {entry.route.end_address}</h3>
                        </div>
                        <div className="modal-path-info-details">
                            <span><PiPathBold /> {entry.route.distance_km.toFixed(2)} km</span>
                            <span><MdOutlineTimer /> {Math.round(entry.route.duration_min)} min</span>
                        </div>
                    </div>
                    <div className="modal-map">
                        <MapComponent start={entry.route.start_coordinates} end={entry.route.end_coordinates} route={entry.route} />
                    </div>
                </div>
                <div className="modal-actions">
                    <Button type="button" className="danger-button" onClick={() => onDelete(bikeToEdit)} >Supprimer <FaTrash size={13} /></Button>
                    <Button type="button" onClick={onClose}>Ok</Button>
                </div>
            </div>
        </div>
    );
}
