import { useRef, useEffect, useState } from 'react';
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import Button from '../../components/ui/Button';

import { IoMdPin } from "react-icons/io";
import { FaLayerGroup } from "react-icons/fa";
import { MdOutlineReportProblem, MdOutlineTraffic } from "react-icons/md";
import './MapComponent.css';

const TRAFFIC_COLORS = { green: "#22c55e", orange: "#f97316", red: "#ef4444", gray: "#9ca3af" };

const REPORT_ICONS = {
    accident: "🚨",
    travaux: "🚧",
    danger: "⚠️",
    obstacle: "🪨",
};

export default function MapComponent({ start, end, pointilles, itineraires, selectedItineraire, setSelectedItineraire, reports, onMapClick, onDeleteReport, isReportMode, onToggleReportMode, canReport, trafficPoints = [], showTraffic = false, onToggleTraffic, littleMap = false }) {

    const mapRef = useRef();
    const [hoverInfo, setHoverInfo] = useState(null);
    const [activeReport, setActiveReport] = useState(null);
    const [activeTraffic, setActiveTraffic] = useState(null);
    const [isMapSelectOpen, setIsMapSelectOpen] = useState(false);
    const [selectedMapStyle, setSelectedMapStyle] = useState("basic-v2");

    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current.getMap();

        if (start && end) {
            const lons = [start.lon, end.lon];
            const lats = [start.lat, end.lat];
            map.fitBounds([
                [Math.min(...lons), Math.min(...lats)],
                [Math.max(...lons), Math.max(...lats)]
            ], { padding: 50, maxZoom: 16, duration: 1000 });
        } else if (start) {
            map.flyTo({ center: [start.lon, start.lat], zoom: 15, duration: 1500 });
        } else if (end) {
            map.flyTo({ center: [end.lon, end.lat], zoom: 15, duration: 1500 });
        }
    }, [start, end]);

    const onClick = (event) => {
        const features = event.features;
        if (features && features.length > 0) {
            const clickedRouteId = features[0].properties.id;
            setSelectedItineraire(clickedRouteId);
            return;
        }

        if (onMapClick) {
            onMapClick({ lat: event.lngLat.lat, lon: event.lngLat.lng });
        }
    };

    const onHover = (event) => {
        const feature = event.features && event.features[0];
        if (feature) {
            setHoverInfo({
                lngLat: event.lngLat,
                name: feature.properties.name,
                distance: feature.properties.distance,
                duration: feature.properties.duration
            });
            event.target.getCanvas().style.cursor = 'pointer';
        } else {
            setHoverInfo(null);
            event.target.getCanvas().style.cursor = '';
        }
    };

    const MAP_STYLES = [
        { id: "dataviz-dark", label: "Sombre", icon: "🌙" },
        { id: "outdoor-v2", label: "Outdoor", icon: "🚴" },
        { id: "openstreetmap", label: "Détaillée", icon: "🗺️" },
        { id: "streets-v2", label: "Rues", icon: "🛣️" },
        { id: "topo-v2", label: "Relief", icon: "⛰️" },
        { id: "hybrid", label: "Satellite", icon: "🛰️" },
        { id: "basic-v2", label: "Basic", icon: "🍃" },
    ];

    const mapTilerKey = import.meta.env.VITE_MAPTILER_KEY;
    const currentMapStyle = `https://api.maptiler.com/maps/${selectedMapStyle}/style.json?key=${mapTilerKey}`;

    return (
        <div className={`map-container ${littleMap ? 'little-map' : ''}`}>
            {!littleMap && canReport && (
                <div className="map-report-control">
                    <Button
                        id="report-button"
                        onClick={onToggleReportMode}
                        className={isReportMode ? "report-button-active" : "report-button"}
                    >
                        <MdOutlineReportProblem size={18} />
                        {isReportMode ? "Cliquez sur la carte..." : "Ajouter un signalement"}
                    </Button>
                </div>
            )}

            {!littleMap && onToggleTraffic && (
                <div className="map-traffic-control">
                    <Button
                        onClick={onToggleTraffic}
                        className={showTraffic ? "report-button-active" : "report-button"}
                    >
                        <MdOutlineTraffic size={18} />
                        {showTraffic ? "Masquer le trafic" : "Trafic en temps réel"}
                    </Button>
                </div>
            )}

            <div className="map-layer-control">
                {isMapSelectOpen && (
                    <div className="map-style-menu">
                        <div className="map-style-menu-title">Fonds de carte</div>
                        {MAP_STYLES.map((style) => (
                            <button
                                key={style.id}
                                className={`map-style-item ${selectedMapStyle === style.id ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedMapStyle(style.id);
                                    setIsMapSelectOpen(false);
                                }}
                            >
                                <span className="style-icon">{style.icon}</span>
                                {style.label}
                            </button>
                        ))}
                    </div>
                )}

                <Button
                    type="button"
                    className="map-layer-toggle"
                    onClick={() => setIsMapSelectOpen(!isMapSelectOpen)}
                    title="Changer le fond de carte"
                >
                    <FaLayerGroup size={18} />
                    {littleMap ? "" : "Calques"}
                </Button>
            </div>
            <Map
                ref={mapRef}
                initialViewState={{ longitude: -0.5795, latitude: 44.8378, zoom: 13 }}
                mapStyle={currentMapStyle}
                interactiveLayerIds={itineraires ? itineraires.map((it) => `route-hitbox-${it.id}`) : []}
                onClick={onClick}
                onMouseMove={onHover}
                style={{ width: '100%', height: '100%' }}
            >
                <NavigationControl position="top-right" />

                {pointilles && pointilles.map((path, index) => {
                    const coords = path.map(p => [p.lon, p.lat]);
                    return (
                        <Source key={`pointilles-${index}`} type="geojson" data={{ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } }}>
                            <Layer type="line" paint={{ 'line-color': '#555df6', 'line-width': 3, 'line-dasharray': [2, 2] }} />
                        </Source>
                    );
                })}

                {itineraires && [...itineraires]
                    .sort((a, b) => (a.id === selectedItineraire ? 1 : b.id === selectedItineraire ? -1 : 0))
                    .map((itineraire) => {
                        const isSelected = selectedItineraire === itineraire.id;
                        const coords = itineraire.path.map(p => [p[1], p[0]]);

                        return (
                            <Source key={`itineraire-${itineraire.id}`} type="geojson" data={{
                                type: 'Feature',
                                properties: { id: itineraire.id, name: itineraire.name, distance: itineraire.distance, duration: itineraire.duration },
                                geometry: { type: 'LineString', coordinates: coords }
                            }}>
                                <Layer id={`route-${itineraire.id}`} type="line" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{
                                    'line-color': isSelected ? "#3d46f6" : "#8c92f9",
                                    'line-width': isSelected ? 5 : 3,
                                }} />
                                <Layer id={`route-hitbox-${itineraire.id}`} type="line" paint={{ 'line-color': 'transparent', 'line-width': 20 }} />
                            </Source>
                        );
                    })}

                {hoverInfo && (
                    <Popup longitude={hoverInfo.lngLat.lng} latitude={hoverInfo.lngLat.lat} closeButton={false} className="custom-map-tooltip">
                        <div className="itineraire-tooltip">
                            <strong>{hoverInfo.name}</strong>
                            <span className="tooltip-details">{hoverInfo.distance.toFixed(2)} km - {Math.round(hoverInfo.duration)} min</span>
                        </div>
                    </Popup>
                )}

                {start && (
                    <Marker longitude={start.lon} latitude={start.lat} anchor="bottom">
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '36px' }}>
                            <IoMdPin size={36} color="#3d46f6" style={{ filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.3))" }} />
                        </div>
                    </Marker>
                )}
                {end && (
                    <Marker longitude={end.lon} latitude={end.lat} anchor="bottom">
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '36px' }}>
                            <IoMdPin size={36} color="#e63946" style={{ filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.3))" }} />
                        </div>
                    </Marker>
                )}

                {reports && reports.map((report) => (
                    <Marker key={report.id} longitude={report.longitude} latitude={report.latitude} anchor="bottom">
                        <div style={{ fontSize: "28px", lineHeight: "1", cursor: "pointer", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
                            onClick={(e) => { e.stopPropagation(); setActiveReport(report); }}>
                            {REPORT_ICONS[report.report_type] || "📍"}
                        </div>
                    </Marker>
                ))}

                {trafficPoints && trafficPoints.map((pt) => (
                    <Marker key={`traffic-${pt.id}`} longitude={pt.lon} latitude={pt.lat} anchor="center">
                        <div
                            onClick={(e) => { e.stopPropagation(); setActiveTraffic(pt); }}
                            style={{
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                backgroundColor: TRAFFIC_COLORS[pt.level] || TRAFFIC_COLORS.gray,
                                border: "2px solid white",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                                cursor: "pointer",
                            }}
                        />
                    </Marker>
                ))}

                {activeTraffic && (
                    <Popup
                        longitude={activeTraffic.lon}
                        latitude={activeTraffic.lat}
                        onClose={() => setActiveTraffic(null)}
                        closeOnClick={false}
                        anchor="bottom"
                        offset={[0, -10]}
                    >
                        <div className="report-popup">
                            <h4 className="report-popup-title">{activeTraffic.name || "Point de comptage"}</h4>
                            {activeTraffic.speed != null && <p>🚗 Vitesse : <strong>{activeTraffic.speed} km/h</strong></p>}
                            {activeTraffic.flow != null && <p>🚦 Débit : <strong>{activeTraffic.flow} véh/h</strong></p>}
                            {activeTraffic.occupancy != null && <p>📊 Occupation : <strong>{activeTraffic.occupancy}%</strong></p>}
                        </div>
                    </Popup>
                )}

                {activeReport && (
                    <Popup
                        longitude={activeReport.longitude}
                        latitude={activeReport.latitude}
                        onClose={() => setActiveReport(null)}
                        closeOnClick={false}
                        anchor="bottom"
                        offset={[0, -35]}
                    >
                        <div className="report-popup">
                            <h4 className="report-popup-title">
                                {REPORT_ICONS[activeReport.report_type]}
                                <span style={{ textTransform: 'capitalize' }}>{activeReport.report_type}</span>
                            </h4>

                            {activeReport.report_description && (
                                <p className="report-popup-desc">{activeReport.report_description}</p>
                            )}

                            {onDeleteReport && (
                                <Button
                                    className="danger-button report-popup-delete"
                                    type="button"
                                    onClick={() => { onDeleteReport(activeReport.id); setActiveReport(null); }}
                                >
                                    Supprimer
                                </Button>
                            )}
                        </div>
                    </Popup>
                )}

            </Map>
        </div>
    );
}
