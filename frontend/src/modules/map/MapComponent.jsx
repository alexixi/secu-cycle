import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';

export default function MapComponent({ start, end, roadPaths }) {
    return (
        <MapContainer center={start} zoom={13} scrollWheelZoom={true} style={{ height: "90vh", width: "100%" }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                // url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"

            />
            <Marker position={start}>
                <Popup>Départ</Popup>
            </Marker>
            <Marker position={end}>
                <Popup>Arrivée</Popup>
            </Marker>
            {roadPaths && roadPaths.map((path, index) => (
                <Polyline key={index} positions={path} color="green" />
            ))}
        </MapContainer>
    );
}