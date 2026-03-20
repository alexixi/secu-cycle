import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from 'react-leaflet';
import { renderToString } from 'react-dom/server';
import { MdDirectionsBike } from "react-icons/md";
import { FaFlagCheckered } from "react-icons/fa";
import { useEffect } from 'react';
import './MapComponent.css';

const MapController = ({ center, bounds }) => {
    const map = useMap();

    useEffect(() => {
        if (bounds && bounds.length > 1) {
            map.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 16,
                duration: 1
            });
        }
        else if (center && center.lat !== null && center.lon !== null) {
            map.flyTo([center.lat, center.lon], 15, { duration: 1.5 });
        }
    }, [center, bounds, map]);
    return null;
};

export default function MapComponent({ start, end, pointilles, itineraires, selectedItineraire, setSelectedItineraire }) {

    const startIconHtml = renderToString(
        <MdDirectionsBike size={32} color="#3d46f6" style={{ filter: "drop-shadow(2px 4px 8px rgba(255, 255, 255, 0.9))" }} />
    );

    const endIconHtml = renderToString(
        <FaFlagCheckered size={32} color="#3d46f6" style={{ filter: "drop-shadow(2px 4px 8px rgba(255, 255, 255, 0.9))" }} />
    );

    const startIcon = L.divIcon({
        html: startIconHtml,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 25],
        popupAnchor: [0, -32]
    });

    const endIcon = L.divIcon({
        html: endIconHtml,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [5, 32],
        popupAnchor: [6, -32]
    });

    return (
        <MapContainer center={start ? start : [44.8378, -0.5795]} zoom={13} scrollWheelZoom={true} className="map-container">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            // url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"

            />
            {start && (
                <>
                    <Marker position={start} icon={startIcon}>
                        <Popup>Départ</Popup>
                    </Marker>
                    {start && !end && <MapController center={start} zoom={15} />}
                </>
            )}
            {end && (
                <>
                    <Marker position={end} icon={endIcon}>
                        <Popup>Arrivée</Popup>
                    </Marker>
                    {end && !start && <MapController center={end} zoom={15} />}
                </>
            )}
            {start && end && (
                <MapController
                    center={{ lat: (start.lat + end.lat) / 2, lon: (start.lon + end.lon) / 2 }}
                    bounds={[start, end]} />
            )}
            {pointilles && pointilles.map((path, index) => (
                <Polyline key={index} positions={path} color="blue" dashArray="10,10" />
            ))}
            {itineraires && itineraires.length > 0 && itineraires.map((itineraire, index) => {
                const isSelected = selectedItineraire === itineraire.id;

                return (
                    <Polyline
                        key={`${index}-${isSelected ? 'selected' : 'unselected'}`}
                        positions={itineraire.path}
                        color={isSelected ? "#3d46f6" : "#555df6"}
                        weight={isSelected ? 5 : 4}
                        zIndexOffset={isSelected ? 1000 : 0}
                        opacity={isSelected ? 1 : 0.7}
                        eventHandlers={{
                            click: (e) => {
                                setSelectedItineraire(itineraire.id);
                                L.DomEvent.stopPropagation(e);
                            },
                        }}
                    >
                        <Tooltip
                            key={`${index}-${isSelected ? 'permanent' : 'sticky'}`}
                            direction="top"
                            opacity="1"
                            permanent={isSelected}
                            sticky={!isSelected}
                            className={`custom-map-tooltip ${isSelected ? 'tooltip-selected' : 'tooltip-standard'}`}
                        >
                            <div className="itineraire-tooltip">
                                <strong>{itineraire.name}</strong>
                                <span className="tooltip-details">
                                    {itineraire.distance.toFixed(2)} km - {Math.round(itineraire.duration)} min
                                </span>
                            </div>
                        </Tooltip>
                    </Polyline>
                )
            })}
        </MapContainer>
    );
}
