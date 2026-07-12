import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { MdOutlineReportProblem, MdContentCopy, MdCenterFocusStrong, MdCheck, MdOutlineTripOrigin } from "react-icons/md";
import { FaFlagCheckered } from "react-icons/fa";
import './MapContextMenu.css';

const MENU_MARGIN = 8;

export const formatCoords = (lat, lon) => `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

export default function MapContextMenu({ x, y, lat, lon, address, isAddressLoading, canReport,
    onClose, onSetStart, onSetEnd, onReport, onCenter }) {

    const menuRef = useRef(null);
    const [position, setPosition] = useState(null);
    const [isCopied, setIsCopied] = useState(false);

    useLayoutEffect(() => {
        const menu = menuRef.current;
        if (!menu) return;

        const container = menu.parentElement.getBoundingClientRect();
        setPosition({
            left: Math.max(MENU_MARGIN, Math.min(x, container.width - menu.offsetWidth - MENU_MARGIN)),
            top: Math.max(MENU_MARGIN, Math.min(y, container.height - menu.offsetHeight - MENU_MARGIN))
        });
    }, [x, y]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") onClose();
        };

        const handlePointerDown = (event) => {
            if (event.button === 2) return;
            if (menuRef.current && !menuRef.current.contains(event.target)) onClose();
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handlePointerDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handlePointerDown);
        };
    }, [onClose]);

    const handleCopy = async () => {
        const text = formatCoords(lat, lon);
        try {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
            setTimeout(onClose, 700);
        } catch {
            window.prompt("Copiez les coordonnées :", text);
            onClose();
        }
    };

    const items = [
        { id: "start", icon: <MdOutlineTripOrigin size={16} />, label: "Itinéraire depuis ce point", onClick: onSetStart },
        { id: "end", icon: <FaFlagCheckered size={16} />, label: "Itinéraire vers ce point", onClick: onSetEnd },
        canReport && { id: "report", icon: <MdOutlineReportProblem size={18} />, label: "Ajouter un signalement ici", onClick: onReport },
        { id: "center", icon: <MdCenterFocusStrong size={18} />, label: "Centrer et zoomer ici", onClick: onCenter, separator: true },
        { id: "copy", icon: isCopied ? <MdCheck size={18} /> : <MdContentCopy size={16} />, label: isCopied ? "Copié !" : "Copier les coordonnées", onClick: handleCopy }
    ].filter(Boolean);

    return (
        <div
            ref={menuRef}
            className="map-context-menu"
            style={{
                left: position ? position.left : x,
                top: position ? position.top : y,
                visibility: position ? "visible" : "hidden"
            }}
            onContextMenu={(event) => event.preventDefault()}
        >
            <div className="map-context-header">
                <span className="map-context-header-title" title={address?.display_name || ""}>
                    {isAddressLoading ? "Recherche de l'adresse..." : (address?.display_name || "Point sur la carte")}
                </span>
                <span className="map-context-header-coords">{formatCoords(lat, lon)}</span>
            </div>

            {items.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    className={`map-context-item ${item.separator ? "map-context-separator" : ""}`}
                    onClick={item.onClick}
                >
                    <span className="map-context-icon">{item.icon}</span>
                    {item.label}
                </button>
            ))}
        </div>
    );
}
