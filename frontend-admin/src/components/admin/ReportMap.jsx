import { useEffect, useRef, useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { FaLayerGroup } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";
import ThemeToggle from "../ui/ThemeToggle";

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;

const MAP_STYLES = [
  { id: "base", lightId: "base-v4", darkId: "base-v4-dark", label: "Basic", icon: "🍃" },
  { id: "streets", lightId: "streets-v4", darkId: "streets-v4-dark", label: "Rues", icon: "🛣️" },
  { id: "outdoor", lightId: "outdoor-v4", darkId: "outdoor-v4-dark", label: "Outdoor", icon: "🚴" },
  { id: "topo", lightId: "topo-v4", darkId: "topo-v4-dark", label: "Relief", icon: "⛰️" },
  { id: "hybrid", lightId: "hybrid-v4", darkId: "hybrid-v4", label: "Satellite", icon: "🛰️" },
  { id: "openstreetmap", lightId: "openstreetmap", darkId: "openstreetmap", label: "Détaillée", icon: "🗺️" },
];

const THEME_MODES = ["light", "auto", "dark"];

export default function ReportMap({ latitude, longitude, icon = "📍", zoom = 16 }) {
  const { effectiveTheme } = useTheme();
  const [mapThemeMode, setMapThemeMode] = useState("auto");
  const [selectedMapStyle, setSelectedMapStyle] = useState("base");
  const [isMapSelectOpen, setIsMapSelectOpen] = useState(false);
  const layerControlRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("userMapThemeMode");
    if (THEME_MODES.includes(savedTheme)) setMapThemeMode(savedTheme);

    const savedBase = localStorage.getItem("userMapBaseStyle");
    if (savedBase && MAP_STYLES.some((s) => s.id === savedBase)) setSelectedMapStyle(savedBase);
  }, []);

  useEffect(() => {
    if (!isMapSelectOpen) return;
    const onPointerDown = (e) => {
      if (!layerControlRef.current?.contains(e.target)) setIsMapSelectOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isMapSelectOpen]);

  const handleMapThemeChange = (theme) => {
    setMapThemeMode(theme);
    localStorage.setItem("userMapThemeMode", theme);
  };

  const handleMapStyleChange = (styleId) => {
    setSelectedMapStyle(styleId);
    localStorage.setItem("userMapBaseStyle", styleId);
    setIsMapSelectOpen(false);
  };

  const hasPosition = Number.isFinite(latitude) && Number.isFinite(longitude);
  if (!hasPosition || !MAPTILER_KEY) {
    return <div className="report-map-fallback">Carte indisponible</div>;
  }

  const resolvedTheme = mapThemeMode === "auto" ? effectiveTheme : mapThemeMode;
  const styleConfig = MAP_STYLES.find((s) => s.id === selectedMapStyle) || MAP_STYLES[0];
  const styleId = resolvedTheme === "dark" ? styleConfig.darkId : styleConfig.lightId;
  const mapStyle = `https://api.maptiler.com/maps/${styleId}/style.json?key=${MAPTILER_KEY}`;

  return (
    <div className="report-map">
      <div className="report-map-controls">
        <ThemeToggle compact value={mapThemeMode} onChange={handleMapThemeChange} />

        <div className="report-map-layers" ref={layerControlRef}>
          <button
            type="button"
            className="report-map-layer-btn"
            onClick={() => setIsMapSelectOpen((open) => !open)}
            title="Changer le fond de carte"
            aria-expanded={isMapSelectOpen}
          >
            <FaLayerGroup size={14} />
          </button>

          {isMapSelectOpen && (
            <div className="report-map-style-menu">
              <div className="report-map-style-title">Fonds de carte</div>
              {MAP_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className={`report-map-style-item ${selectedMapStyle === style.id ? "active" : ""}`}
                  onClick={() => handleMapStyleChange(style.id)}
                >
                  <span>{style.icon}</span>
                  {style.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Map
        initialViewState={{ longitude, latitude, zoom }}
        mapStyle={mapStyle}
        attributionControl={{ compact: true }}
        style={{ position: "absolute", inset: 0 }}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <Marker longitude={longitude} latitude={latitude} anchor="bottom">
          <div className="report-map-pin">{icon}</div>
        </Marker>
      </Map>
    </div>
  );
}
