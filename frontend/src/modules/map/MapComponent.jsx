import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useEffect } from 'react';

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

export default function MapComponent({ start, end, roadPaths, color = "green", dashed = false }) {
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
            {roadPaths && roadPaths.map((path, index) => (
                <Polyline key={index} positions={path} color={color} dashArray={dashed ? "10,10" : undefined} />
            ))}
        </MapContainer>
    );
}
