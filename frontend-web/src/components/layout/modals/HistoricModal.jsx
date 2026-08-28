import { useTranslation } from "react-i18next";
import { useEffect } from "react";

import Button from "../../ui/Button";
import i18n from "../../../i18n/index";
import MapComponent from "../../../modules/map/MapComponent";

import { MdDirectionsBike, MdOutlineTimer, MdOutlineSpeed, MdHealthAndSafety, MdBatteryChargingFull, MdElectricBike } from "react-icons/md";
import { FaFlagCheckered, FaTrash, FaBalanceScale, FaRegClock } from "react-icons/fa";
import { PiPathBold } from "react-icons/pi";

import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from "recharts";

import "../../ui/PopUp.css"
import "./HistoricModal.css";

const ROUTE_TYPE_ICONS = {
    fast: MdOutlineSpeed,
    safe: MdHealthAndSafety,
    compromise: FaBalanceScale,
};

// Le type de vélo vient de l'historique en base ; sa clé de libellé n'a pas la
// même forme que le type lui-même, d'où cette table de correspondance.
const BIKE_TYPE_KEYS = {
    standard: "standard",
    ville: "veloVille",
    vtt: "vtt",
    route: "veloRoute",
};

export default function HistoricModal({ isOpen, onClose, onDelete, entry }) {
    const { t } = useTranslation('auth');

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
    const cleVariante = `variantes.${route.route_type}`;
    const routeLabel = t(cleVariante) === cleVariante ? route.route_type : t(cleVariante);
    const cleVelo = BIKE_TYPE_KEYS[route.bike_type?.toLowerCase()];
    const bikeLabel = route.bike_type ? (cleVelo ? t(`velo.${cleVelo}`) : route.bike_type) : null;
    const isElectric = route.is_electric === "True" || route.is_electric === true;
    const date = new Date(entry.created_at).toLocaleDateString(i18n.language, {
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

    const RouteTypeIcon = ROUTE_TYPE_ICONS[route.route_type] || PiPathBold;

    const elevationData = path
        ? path.filter(p => typeof p[2] === "number").map(p => ({ elevation: p[2] }))
        : [];
    const hasElevation = elevationData.length > 1;

    return (
        <div className="modal-overlay">
            <div className="modal-content big-modal">
                <h2 className="modal-title"><PiPathBold /> {t('modales.historique.titre')}</h2>
                <div className="modal-main">
                    <div className="modal-path-info">
                        <div className="route-box">
                            <div className="route-point">
                                <span className="route-point-icon" style={{ color: "#3d46f6" }}>
                                    <MdDirectionsBike size={20} />
                                </span>
                                <div className="route-point-text">
                                    <span className="route-point-label">{t('modales.historique.depart')}</span>
                                    <span className="route-point-address">{route.start_address}</span>
                                </div>
                            </div>
                            <div className="route-connector" />
                            <div className="route-point">
                                <span className="route-point-icon" style={{ color: "#e63946" }}>
                                    <FaFlagCheckered size={18} />
                                </span>
                                <div className="route-point-text">
                                    <span className="route-point-label">{t('modales.historique.arrivee')}</span>
                                    <span className="route-point-address">{route.end_address}</span>
                                </div>
                            </div>
                        </div>

                        <div className="stat-grid">
                            <div className="stat-box">
                                <PiPathBold className="stat-box-icon" size={22} />
                                <span className="stat-box-value">{route.distance_km?.toFixed(2)} km</span>
                            </div>
                            <div className="stat-box">
                                <MdOutlineTimer className="stat-box-icon" size={22} />
                                <span className="stat-box-value">{Math.round(route.duration_min)} min</span>
                            </div>
                            <div className="stat-box">
                                <RouteTypeIcon className="stat-box-icon" size={22} />
                                <span className="stat-box-value">{routeLabel}</span>
                            </div>
                            {bikeLabel && (
                                <div className="stat-box">
                                    {isElectric
                                        ? <MdElectricBike className="stat-box-icon" size={22} />
                                        : <MdDirectionsBike className="stat-box-icon" size={22} />}
                                    <span className="stat-box-value">{bikeLabel}</span>
                                </div>
                            )}
                            <div className="stat-box">
                                <FaRegClock className="stat-box-icon" size={20} />
                                <span className="stat-box-value">{date}</span>
                            </div>
                        </div>

                        {hasElevation && (
                            <div className="modal-elevation">
                                <span className="modal-elevation-label">{t('modales.historique.profilAltimetrique')}</span>
                                <div className="modal-elevation-chart">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={elevationData}>
                                            <YAxis hide domain={['dataMin', 'dataMax']} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'var(--bg-surface)',
                                                    border: '1px solid var(--primary)',
                                                    borderRadius: '8px',
                                                    padding: '4px 8px',
                                                    fontSize: '0.80em',
                                                    boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                                                }}
                                                itemStyle={{ color: 'var(--text-main)', margin: 0, fontWeight: 'bold' }}
                                                labelFormatter={() => ""}
                                                formatter={(value) => [`${value} m`, t('modales.historique.altitude')]}
                                                wrapperStyle={{ outline: 'none' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="elevation"
                                                stroke="var(--primary)"
                                                fill="var(--primary)"
                                                fillOpacity={0.2}
                                                isAnimationActive={true}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="modal-map">
                        <MapComponent
                            start={start}
                            end={end}
                            itineraires={itineraires}
                            selectedItineraire="hist"
                            setSelectedItineraire={() => {}}
                            reports={[]}
                            littleMap={true}
                        />
                    </div>
                </div>
                <div className="modal-actions">
                    {onDelete && (
                        <Button type="button" className="danger-button" onClick={() => onDelete(entry.id)}>
                            {t('actions.supprimer')} <FaTrash size={13} />
                        </Button>
                    )}
                    <Button type="button" onClick={onClose}>{t('actions.fermer')}</Button>
                </div>
            </div>
        </div>
    );
}
