import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, NavigationControl, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { FaLayerGroup } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";
import ThemeToggle from "../ui/ThemeToggle";
import "./ReportsManager.css";

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

const FILL_LAYER_ID = "communes-fill";

const FALLBACK_VIEW = { longitude: 2.5, latitude: 46.6, zoom: 4.5 };

function boundsOf(geojson) {
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;

  const visit = (coords) => {
    if (typeof coords[0] === "number") {
      const [lon, lat] = coords;
      if (lon < west) west = lon;
      if (lon > east) east = lon;
      if (lat < south) south = lat;
      if (lat > north) north = lat;
      return;
    }
    coords.forEach(visit);
  };

  (geojson?.features || []).forEach((feature) => {
    if (feature.geometry?.coordinates) visit(feature.geometry.coordinates);
  });

  if (west === Infinity) return null;
  return [[west, south], [east, north]];
}

export default function GraphExtentMap({ geojson }) {
  const { effectiveTheme } = useTheme();
  const [mapThemeMode, setMapThemeMode] = useState("auto");
  const [selectedMapStyle, setSelectedMapStyle] = useState("base");
  const [isMapSelectOpen, setIsMapSelectOpen] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const layerControlRef = useRef(null);
  const mapRef = useRef(null);

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

  const bounds = useMemo(() => boundsOf(geojson), [geojson]);

  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !bounds) return;
    mapRef.current.fitBounds(bounds, { padding: 40, duration: 600 });
  }, [bounds, isMapLoaded]);

  const handleMapThemeChange = (theme) => {
    setMapThemeMode(theme);
    localStorage.setItem("userMapThemeMode", theme);
  };

  const handleMapStyleChange = (styleId) => {
    setSelectedMapStyle(styleId);
    localStorage.setItem("userMapBaseStyle", styleId);
    setIsMapSelectOpen(false);
  };

  if (!MAPTILER_KEY) {
    return <div className="graph-map-fallback">Carte indisponible (clé MapTiler manquante)</div>;
  }

  const resolvedTheme = mapThemeMode === "auto" ? effectiveTheme : mapThemeMode;
  const styleConfig = MAP_STYLES.find((s) => s.id === selectedMapStyle) || MAP_STYLES[0];
  const styleId = resolvedTheme === "dark" ? styleConfig.darkId : styleConfig.lightId;
  const mapStyle = `https://api.maptiler.com/maps/${styleId}/style.json?key=${MAPTILER_KEY}`;

  const accent = resolvedTheme === "dark" ? "#8c92f9" : "#3d46f6";

  return (
    <div className="graph-map">
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
        ref={mapRef}
        initialViewState={FALLBACK_VIEW}
        mapStyle={mapStyle}
        attributionControl={{ compact: true }}
        onLoad={() => setIsMapLoaded(true)}
        style={{ position: "absolute", inset: 0 }}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {geojson && (
          <Source id="communes" type="geojson" data={geojson}>
            <Layer
              id={FILL_LAYER_ID}
              type="fill"
              paint={{ "fill-color": accent, "fill-opacity": 0.18 }}
            />
            <Layer
              id="communes-outline"
              type="line"
              paint={{ "line-color": accent, "line-width": 1.5 }}
            />
            <Layer
              id="communes-label"
              type="symbol"
              layout={{
                "text-field": ["get", "name"],
                "text-size": 11,
                "text-allow-overlap": false,
              }}
              paint={{
                "text-color": resolvedTheme === "dark" ? "#e5e7eb" : "#1f2937",
                "text-halo-color": resolvedTheme === "dark" ? "#111827" : "#ffffff",
                "text-halo-width": 1.2,
              }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}
