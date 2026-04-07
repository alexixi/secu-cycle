import { useEffect } from "react";

import Button from "../../ui/Button";
import MapComponent from "../../../modules/map/MapComponent";

import { MdDirectionsBike, MdOutlineTimer } from "react-icons/md";
import { FaFlagCheckered, FaTrash } from "react-icons/fa";
import { PiPathBold } from "react-icons/pi";

import "../../ui/PopUp.css"
import "./HistoricModal.css";

const ROUTE_TYPE_LABELS = {
    fast: "Rapide",
    safe: "Sécurisé",
    compromise: "Compromis",
};

const BIKE_TYPE_LABELS = {
    standard: "Vélo standard",
    ville: "Vélo de ville",
    vtt: "VTT",
    route: "Vélo de route",
};

export default function HistoricModal({ isOpen, onClose, onDelete, entry }) {

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" || e.key === "Enter") {
                onClose();
            } else if ((e.key === "Delete" || e.key === "Backspace") && onDelete) {
                e.preventDefault();
                onDelete(entry.id);
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
    }, [isOpen, onClose, onDelete, entry]);

    if (!isOpen || !entry?.route) return null;

    const route = entry.route;
    const routeLabel = ROUTE_TYPE_LABELS[route.route_type] || route.route_type;
    const bikeLabel = route.bike_type ? BIKE_TYPE_LABELS[route.bike_type.toLowerCase()] || route.bike_type : null;
    const isElectric = route.is_electric === "True" || route.is_electric === true;
    const date = new Date(entry.created_at).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric"
    });

    const path = route.path;
    const startCoord = path?.[0];
    const endCoord = path?.[path.length - 1];
    const start = startCoord ? { lat: startCoord[0], lon: startCoord[1] } : null;
    const end = endCoord ? { lat: endCoord[0], lon: endCoord[1] } : null;
    const itineraires = path ? [{
        id: "hist",
        name: routeLabel,
        path,
        distance: route.distance_km,
        duration: route.duration_min,
    }] : [];

    return (
        <div className="modal-overlay">
            <div className="modal-content big-modal">
                <div className="modal-main">
                    <div className="modal-path-info">
                        <div className="modal-path-info-address">
                            <h3><MdDirectionsBike size={24} /> {route.start_address}</h3>
                            <h3><FaFlagCheckered size={24} /> {route.end_address}</h3>
                        </div>
                        <div className="modal-path-info-details">
                            <span><PiPathBold /> {route.distance_km?.toFixed(2)} km</span>
                            <span><MdOutlineTimer /> {Math.round(route.duration_min)} min</span>
                            <span>Type : {routeLabel}</span>
                            {bikeLabel && <span><MdDirectionsBike /> {bikeLabel}{isElectric ? " ⚡" : ""}</span>}
                            <span>Le {date}</span>
                        </div>
                    </div>
                    <div className="modal-map">
                        <MapComponent
                            start={start}
                            end={end}
                            itineraires={itineraires}
                            selectedItineraire="hist"
                            setSelectedItineraire={() => {}}
                        />
                    </div>
                </div>
                <div className="modal-actions">
                    {onDelete && (
                        <Button type="button" className="danger-button" onClick={() => onDelete(entry.id)}>
                            Supprimer <FaTrash size={13} />
                        </Button>
                    )}
                    <Button type="button" onClick={onClose}>Fermer</Button>
                </div>
            </div>
        </div>
    );
}
