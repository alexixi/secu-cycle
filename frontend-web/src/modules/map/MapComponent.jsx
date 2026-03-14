import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from 'react-leaflet';
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
        else if (center) {
            map.flyTo([center.lat, center.lon], 15, { duration: 1.5 });
        }
    }, [center, bounds, map]);
    return null;
};

export default function MapComponent({ start, end, pointilles, itineraires, selectedItineraire, setSelectedItineraire }) {
    return (
        <MapContainer center={start ? start : [44.8378, -0.5795]} zoom={13} scrollWheelZoom={true} className="map-container">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            // url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"

            />
            {start && (
                <>
                    <Marker position={start}>
                        <Popup>Départ</Popup>
                    </Marker>
                    {start && !end && <MapController center={start} zoom={15} />}
                </>
            )}
            {end && (
                <>
                    <Marker position={end}>
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
