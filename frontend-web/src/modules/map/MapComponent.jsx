import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import Button from '../../components/ui/Button';
import ThemeToggle from '../../components/ui/ThemeToggle';
import MapContextMenu, { formatCoords } from './MapContextMenu';
import { useTheme } from '../../context/ThemeContext';
import { getPois } from '../../services/apiBack';
import { getAddressFromCoordinates } from '../../services/geocodingService';
import { trackEvent } from '../../services/analytics';

import { IoMdPin } from "react-icons/io";
import { FaLayerGroup } from "react-icons/fa";
import { MdOutlineReportProblem, MdOutlineTraffic, MdMyLocation, MdOutlinePlace } from "react-icons/md";
import poiWaterIcon from '../../assets/poi/water.png';
import poiToiletsFreeIcon from '../../assets/poi/toilets-free.png';
import poiToiletsPaidIcon from '../../assets/poi/toilets-paid.png';
import poiToiletsUnknownIcon from '../../assets/poi/toilets-unknown.png';
import poiParkingStandsIcon from '../../assets/poi/parking-stands.png';
import poiParkingRacksIcon from '../../assets/poi/parking-racks.png';
import poiParkingShelterIcon from '../../assets/poi/parking-shelter.png';
import poiParkingOtherIcon from '../../assets/poi/parking-other.png';
import poiRepairSelfserviceIcon from '../../assets/poi/repair-selfservice.png';
import poiRepairShopIcon from '../../assets/poi/repair-shop.png';
import './MapComponent.css';

const MAP_STYLES = [
    { id: "base", lightId: "base-v4", darkId: "base-v4-dark", label: "Basic", icon: "🍃" },
    { id: "streets", lightId: "streets-v4", darkId: "streets-v4-dark", label: "Rues", icon: "🛣️" },
    { id: "outdoor", lightId: "outdoor-v4", darkId: "outdoor-v4-dark", label: "Outdoor", icon: "🚴" },
    { id: "topo", lightId: "topo-v4", darkId: "topo-v4-dark", label: "Relief", icon: "⛰️" },
    { id: "hybrid", lightId: "hybrid-v4", darkId: "hybrid-v4", label: "Satellite", icon: "🛰️" },
    { id: "openstreetmap", lightId: "openstreetmap", darkId: "openstreetmap", label: "Détaillée", icon: "🗺️" },
];

const TRAFFIC_COLORS = { green: "#22c55e", orange: "#f97316", red: "#ef4444", gray: "#9ca3af" };

const REPORT_ICONS = {
    accident: "🚨",
    travaux: "🚧",
    danger: "⚠️",
    obstacle: "🪨",
};

// Libellé FR + couleur d'accent par type de signalement (libellés alignés sur
// ReportModal.jsx). Sert l'en-tête coloré du popup.
const REPORT_TYPE_META = {
    accident: { label: 'Accident', color: '#ef4444' },
    travaux: { label: 'Travaux', color: '#f97316' },
    danger: { label: 'Danger', color: '#f59e0b' },
    obstacle: { label: 'Obstacle', color: '#a16207' },
};

const REPORT_AGE_RTF = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });

const formatReportAge = (createdAt) => {
    if (!createdAt) return null;
    const then = new Date(createdAt).getTime();
    if (Number.isNaN(then)) return null;
    const minutes = Math.round((Date.now() - then) / 60000);
    if (minutes < 1) return 'Signalé à l’instant';
    if (minutes < 60) return `Signalé ${REPORT_AGE_RTF.format(-minutes, 'minute')}`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `Signalé ${REPORT_AGE_RTF.format(-hours, 'hour')}`;
    const days = Math.round(hours / 24);
    if (days < 7) return `Signalé ${REPORT_AGE_RTF.format(-days, 'day')}`;
    return `Signalé le ${new Date(createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
};

const PARKING_TYPES = [
    { id: 'stands', label: 'Arceaux', color: '#22C55E' },
    { id: 'racks', label: 'Râteliers, pince-roues', color: '#0D9488' },
    { id: 'shelter', label: 'Abris et consignes', color: '#15803D' },
    { id: 'other', label: 'Autres, non précisé', color: '#9CA3AF' },
];

const TOILET_TYPES = [
    { id: 'free', label: 'Gratuites', color: '#EC4899' },
    { id: 'paid', label: 'Payantes', color: '#9F1239' },
    { id: 'unknown', label: 'Non précisé', color: '#8B5CF6' },
];

const REPAIR_TYPES = [
    { id: 'selfservice', label: 'Libre-service', color: '#F97316' },
    { id: 'shop', label: 'Atelier / magasin', color: '#C2410C' },
];

const POI_CATEGORIES = [
    { id: 'water', label: "Points d'eau", color: '#0EA5E9' },
    { id: 'toilets', label: 'Toilettes', color: '#8B5CF6', subTypes: TOILET_TYPES, subTypeProp: 'toilet_fee' },
    { id: 'parking', label: 'Parkings vélo', color: '#22C55E', subTypes: PARKING_TYPES, subTypeProp: 'parking_type' },
    { id: 'repair', label: 'Réparation', color: '#F97316', subTypes: REPAIR_TYPES, subTypeProp: 'repair_kind' },
];

const DEFAULT_SUB_TYPES = Object.fromEntries(
    POI_CATEGORIES.filter(c => c.subTypes).map(c => [c.id, Object.fromEntries(c.subTypes.map(t => [t.id, true]))])
);

const mergeSubTypes = (saved) => Object.fromEntries(
    Object.entries(DEFAULT_SUB_TYPES).map(([cat, defaults]) => [cat, { ...defaults, ...(saved?.[cat] || {}) }])
);

const POI_IMAGE_ASSETS = [
    { key: 'poi-water', src: poiWaterIcon },
    { key: 'poi-toilets-free', src: poiToiletsFreeIcon },
    { key: 'poi-toilets-paid', src: poiToiletsPaidIcon },
    { key: 'poi-toilets-unknown', src: poiToiletsUnknownIcon },
    { key: 'poi-parking-stands', src: poiParkingStandsIcon },
    { key: 'poi-parking-racks', src: poiParkingRacksIcon },
    { key: 'poi-parking-shelter', src: poiParkingShelterIcon },
    { key: 'poi-parking-other', src: poiParkingOtherIcon },
    { key: 'poi-repair-selfservice', src: poiRepairSelfserviceIcon },
    { key: 'poi-repair-shop', src: poiRepairShopIcon },
];

const POI_LAYER_ID = 'pois-symbol';

const TOILET_FEE_LABELS = { free: 'Gratuit', paid: 'Payant', unknown: 'Non précisé' };

const POI_DETAIL_FIELDS = [
    {
        key: 'parking_type',
        label: 'Aménagement',
        format: (value) => PARKING_TYPES.find(t => t.id === value)?.label || value,
    },
    {
        key: 'toilet_fee',
        label: 'Tarif',
        format: (value) => TOILET_FEE_LABELS[value] || value,
    },
    {
        key: 'repair_kind',
        label: 'Type',
        format: (value) => REPAIR_TYPES.find(t => t.id === value)?.label || value,
    },
    { key: 'opening_hours', label: 'Horaires' },
    { key: 'fee', label: 'Payant', except: 'toilets' },
    { key: 'capacity', label: 'Capacité' },
    { key: 'covered', label: 'Couvert' },
    { key: 'access', label: 'Accès' },
    { key: 'wheelchair', label: 'Accessible PMR' },
    { key: 'seasonal', label: 'Saisonnier' },
];

const formatPoiTag = (value) => {
    if (value === 'yes') return 'Oui';
    if (value === 'no') return 'Non';
    return String(value);
};

const isRouteFeature = (feature) => feature?.layer?.id?.startsWith('route-hitbox-');

export default function MapComponent({ start, end, pointilles, itineraires, selectedItineraire, setSelectedItineraire, reports, onMapClick, onDeleteReport, onVote, canVote, currentUserId, isReportMode, onToggleReportMode, canReport, trafficPoints = [], showTraffic = false, onToggleTraffic, onNavigateToPoi, onSetStart, onSetEnd, onReportAt, littleMap = false }) {

    const mapRef = useRef();
    const { effectiveTheme } = useTheme();
    const [hoverInfo, setHoverInfo] = useState(null);
    const [activeReport, setActiveReport] = useState(null);

    const handleVote = async (reportId, isPresent) => {
        if (!onVote) return;
        const res = await onVote(reportId, isPresent);
        if (res?.is_disabled) {
            setActiveReport(null);
        } else if (res) {
            setActiveReport(prev => (prev && prev.id === reportId
                ? { ...prev, confirmations_count: res.confirmations_count, denials_count: res.denials_count }
                : prev));
        }
    };
    const [activeTraffic, setActiveTraffic] = useState(null);
    const [isMapSelectOpen, setIsMapSelectOpen] = useState(false);
    const [selectedMapStyle, setSelectedMapStyle] = useState("base");
    const [mapThemeMode, setMapThemeMode] = useState("auto");
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [userPosition, setUserPosition] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const [isPoiMenuOpen, setIsPoiMenuOpen] = useState(false);
    const [enabledPoiCats, setEnabledPoiCats] = useState({});
    // { toilets: {free,paid,unknown}, parking: {stands,...} }
    const [enabledSubTypes, setEnabledSubTypes] = useState(DEFAULT_SUB_TYPES);
    const poiCacheRef = useRef({});
    const [poiData, setPoiData] = useState({});
    const [activePoi, setActivePoi] = useState(null);
    const [arePoiImagesReady, setArePoiImagesReady] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [contextAddress, setContextAddress] = useState(null);
    const [isContextAddressLoading, setIsContextAddressLoading] = useState(false);
    const contextGeocodeRef = useRef(null);

    useEffect(() => {
        const savedTheme = localStorage.getItem('userMapThemeMode');
        if (savedTheme === 'light' || savedTheme === 'auto' || savedTheme === 'dark') setMapThemeMode(savedTheme);

        const savedBase = localStorage.getItem('userMapBaseStyle');
        if (savedBase && MAP_STYLES.some(s => s.id === savedBase)) setSelectedMapStyle(savedBase);

        const savedPois = localStorage.getItem('userMapPois');
        if (savedPois) {
            try {
                setEnabledPoiCats(JSON.parse(savedPois));
            } catch {
            }
        }

        const savedSubTypes = localStorage.getItem('userMapSubTypes');
        if (savedSubTypes) {
            try {
                setEnabledSubTypes(mergeSubTypes(JSON.parse(savedSubTypes)));
            } catch {
            }
        }
    }, []);

    useEffect(() => {
        if (littleMap) return;
        POI_CATEGORIES.forEach(({ id }) => {
            if (!enabledPoiCats[id] || poiCacheRef.current[id]) return;
            poiCacheRef.current[id] = true;
            getPois(id)
                .then(collection => setPoiData(prev => ({ ...prev, [id]: collection })))
                .catch(error => {
                    poiCacheRef.current[id] = false;  // autorise une nouvelle tentative
                    console.error(`Erreur chargement POI ${id}:`, error);
                });
        });
    }, [enabledPoiCats, littleMap]);

    const handlePoiCategoryToggle = (id) => {
        const next = { ...enabledPoiCats, [id]: !enabledPoiCats[id] };
        setEnabledPoiCats(next);
        localStorage.setItem('userMapPois', JSON.stringify(next));
    };

    const handleSubTypeToggle = (catId, subId) => {
        const next = {
            ...enabledSubTypes,
            [catId]: { ...enabledSubTypes[catId], [subId]: !enabledSubTypes[catId]?.[subId] },
        };
        setEnabledSubTypes(next);
        localStorage.setItem('userMapSubTypes', JSON.stringify(next));
    };

    // Une seule source pour les 4 catégories : l'icône est choisie par expression
    // sur `category`, et un unique layer symbol gère la collision globale.
    // Les sous-familles (parking, toilettes) se filtrent ici, sans nouvelle requête.
    const poisGeoJSON = useMemo(() => ({
        type: 'FeatureCollection',
        features: POI_CATEGORIES
            .filter(({ id }) => enabledPoiCats[id] && poiData[id])
            .flatMap((cat) => (
                cat.subTypes
                    ? poiData[cat.id].features.filter(f => enabledSubTypes[cat.id]?.[f.properties[cat.subTypeProp]])
                    : poiData[cat.id].features
            )),
    }), [enabledPoiCats, enabledSubTypes, poiData]);

    const showPois = !littleMap && arePoiImagesReady && poisGeoJSON.features.length > 0;

    const poiImagesRef = useRef({});

    useEffect(() => {
        if (littleMap || !isMapLoaded || !mapRef.current) return;
        const map = mapRef.current.getMap();

        const registerImages = () => {
            POI_IMAGE_ASSETS.forEach(({ key }) => {
                const image = poiImagesRef.current[key];
                if (image && !map.hasImage(key)) {
                    map.addImage(key, image, { pixelRatio: 2 });
                }
            });
        };

        let cancelled = false;
        Promise.all(POI_IMAGE_ASSETS.map(({ key, src }) => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => { poiImagesRef.current[key] = img; resolve(); };
            img.onerror = reject;
            img.src = src;
        }))).then(() => {
            if (cancelled) return;
            registerImages();
            map.on('styledata', registerImages);
            setArePoiImagesReady(true);
        }).catch(error => console.error("Erreur chargement des icônes POI:", error));

        return () => {
            cancelled = true;
            map.off('styledata', registerImages);
        };
    }, [isMapLoaded, littleMap]);

    const handleMapThemeChange = (theme) => {
        setMapThemeMode(theme);
        localStorage.setItem('userMapThemeMode', theme);
    };

    const handleMapStyleChange = (styleId) => {
        setSelectedMapStyle(styleId);
        localStorage.setItem('userMapBaseStyle', styleId);
    };

    useEffect(() => {
        if (!mapRef.current || !isMapLoaded) return;
        const map = mapRef.current.getMap();

        const it = itineraires?.[0];
        if (it?.path?.length) {
            const lons = it.path.map(p => p[1]);
            const lats = it.path.map(p => p[0]);
            map.fitBounds([
                [Math.min(...lons), Math.min(...lats)],
                [Math.max(...lons), Math.max(...lats)]
            ], { padding: 50, maxZoom: 16, duration: 1000 });
        } else if (start && end) {
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
    }, [start, end, itineraires, isMapLoaded]);

    const handleLocate = () => {
        if (!navigator.geolocation) {
            alert("La géolocalisation n'est pas disponible sur ce navigateur.");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setUserPosition({ lat: latitude, lon: longitude });
                setIsLocating(false);
                mapRef.current?.getMap().flyTo({ center: [longitude, latitude], zoom: 16, duration: 1500 });
            },
            () => {
                setIsLocating(false);
                alert("Impossible de récupérer votre position. Vérifiez que la localisation est autorisée pour ce site.");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const closeContextMenu = useCallback(() => setContextMenu(null), []);

    const onContextMenu = (event) => {
        setActivePoi(null);
        setActiveReport(null);
        setActiveTraffic(null);
        setHoverInfo(null);
        setContextMenu({
            x: event.point.x,
            y: event.point.y,
            lat: event.lngLat.lat,
            lon: event.lngLat.lng
        });
    };

    useEffect(() => {
        if (!contextMenu) {
            setContextAddress(null);
            setIsContextAddressLoading(false);
            contextGeocodeRef.current = null;
            return;
        }

        let cancelled = false;
        setContextAddress(null);
        setIsContextAddressLoading(true);

        const request = getAddressFromCoordinates(contextMenu.lat, contextMenu.lon).catch(() => null);
        contextGeocodeRef.current = request;

        request.then((result) => {
            if (cancelled) return;
            setContextAddress(result);
            setIsContextAddressLoading(false);
        });

        return () => { cancelled = true; };
    }, [contextMenu]);

    const handleContextAction = (action) => {
        if (!contextMenu) return;
        const { lat, lon } = contextMenu;
        const pendingAddress = contextGeocodeRef.current;
        const name = contextAddress?.display_name || formatCoords(lat, lon);

        trackEvent("map_context_action", { action });

        if (action === "start" || action === "end") {
            const setPoint = action === "start" ? onSetStart : onSetEnd;
            setPoint?.({ lat, lon, name });

            if (!contextAddress && pendingAddress) {
                pendingAddress.then((result) => {
                    if (result?.display_name) setPoint?.({ lat, lon, name: result.display_name });
                });
            }
        }
        else if (action === "report") onReportAt?.({ lat, lon });
        else if (action === "center") mapRef.current?.getMap().flyTo({ center: [lon, lat], zoom: 17, duration: 800 });

        setContextMenu(null);
    };

    const onClick = (event) => {
        setContextMenu(null);
        const features = event.features || [];

        const poiFeature = features.find(f => f.layer?.id === POI_LAYER_ID);
        if (poiFeature) {
            const [lon, lat] = poiFeature.geometry.coordinates;
            setActiveReport(null);
            setActiveTraffic(null);
            setActivePoi({ ...poiFeature.properties, lat, lon });
            return;
        }

        const routeFeature = features.find(isRouteFeature);
        if (routeFeature) {
            setSelectedItineraire(routeFeature.properties.id);
            return;
        }

        // Clic à vide : on ferme tout popup ouvert avant de déléguer au parent
        // (mode signalement). Les markers font stopPropagation, ils n'arrivent pas ici.
        setActivePoi(null);
        setActiveReport(null);
        setActiveTraffic(null);
        if (onMapClick) {
            onMapClick({ lat: event.lngLat.lat, lon: event.lngLat.lng });
        }
    };

    const onHover = (event) => {
        const features = event.features || [];
        // Seuls les itinéraires portent une infobulle ; un POI survolé ne doit
        // pas alimenter hoverInfo, dont le rendu lit distance/duration.
        const feature = features.find(isRouteFeature);
        if (feature) {
            setHoverInfo({
                lngLat: event.lngLat,
                name: feature.properties.name,
                distance: feature.properties.distance,
                duration: feature.properties.duration
            });
        } else {
            setHoverInfo(null);
        }
        event.target.getCanvas().style.cursor = features.length ? 'pointer' : '';
    };

    const handleNavigateToPoi = () => {
        if (!activePoi || !onNavigateToPoi) return;
        onNavigateToPoi({
            lat: activePoi.lat,
            lon: activePoi.lon,
            name: activePoi.name || POI_CATEGORIES.find(c => c.id === activePoi.category)?.label,
        });
        setActivePoi(null);
    };

    const mapTilerKey = import.meta.env.VITE_MAPTILER_KEY;
    const resolvedTheme = mapThemeMode === "auto" ? effectiveTheme : mapThemeMode;
    const styleConfig = MAP_STYLES.find(s => s.id === selectedMapStyle) || MAP_STYLES[0];
    const styleIdToUse = resolvedTheme === "dark" ? styleConfig.darkId : styleConfig.lightId;
    const currentMapStyle = `https://api.maptiler.com/maps/${styleIdToUse}/style.json?key=${mapTilerKey}`;

    const getInitialViewState = () => {
        const it = itineraires?.[0];
        if (it?.path?.length) {
            const lons = it.path.map(p => p[1]);
            const lats = it.path.map(p => p[0]);
            return {
                bounds: [[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]],
                fitBoundsOptions: { padding: 50, maxZoom: 16 }
            };
        }
        if (start && end) {
            const lons = [start.lon, end.lon];
            const lats = [start.lat, end.lat];
            return {
                bounds: [[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]],
                fitBoundsOptions: { padding: 50, maxZoom: 16 }
            };
        }
        if (start) return { longitude: start.lon, latitude: start.lat, zoom: 15 };
        if (end) return { longitude: end.lon, latitude: end.lat, zoom: 15 };
        return { longitude: -0.5795, latitude: 44.8378, zoom: 13 };
    };

    return (
        <div className={`map-container ${littleMap ? 'little-map' : ''} ${resolvedTheme === 'dark' ? 'map-dark' : ''}`}>
            {!littleMap && canReport && (
                <div className="map-report-control">
                    <Button
                        id="report-button"
                        onClick={onToggleReportMode}
                        className={isReportMode ? "report-button-active" : "report-button"}
                        title="Ajouter un signalement"
                    >
                        <MdOutlineReportProblem size={18} />
                        <span className="map-btn-label">{isReportMode ? "Cliquez sur la carte..." : "Ajouter un signalement"}</span>
                    </Button>
                </div>
            )}

            {!littleMap && onToggleTraffic && (
                <div
                    className="map-traffic-control"
                    style={{ bottom: canReport ? "95px" : "45px" }}
                >
                    <Button
                        onClick={onToggleTraffic}
                        className={showTraffic ? "report-button-active" : "report-button"}
                        title="Trafic en temps réel"
                    >
                        <MdOutlineTraffic size={18} />
                        <span className="map-btn-label">{showTraffic ? "Masquer le trafic" : "Trafic en temps réel"}</span>
                    </Button>
                    {showTraffic && (
                        <div className="traffic-legend">
                            <span className="traffic-legend-item"><span className="traffic-dot" style={{ backgroundColor: "#22c55e" }} />Route fluide</span>
                            <span className="traffic-legend-item"><span className="traffic-dot" style={{ backgroundColor: "#f97316" }} />Route ralentie</span>
                            <span className="traffic-legend-item"><span className="traffic-dot" style={{ backgroundColor: "#ef4444" }} />Route bloquée</span>
                            <span className="traffic-legend-item"><span className="traffic-dot" style={{ backgroundColor: "#9ca3af" }} />Inconnu</span>
                        </div>
                    )}
                </div>
            )}

            {!littleMap && (
                <div className="map-theme-control">
                    <ThemeToggle compact value={mapThemeMode} onChange={handleMapThemeChange} />
                </div>
            )}

            {!littleMap && (
                <div className="map-locate-control">
                    <Button
                        type="button"
                        className="map-locate-toggle"
                        onClick={handleLocate}
                        disabled={isLocating}
                        title="Centrer la carte sur ma position"
                    >
                        <MdMyLocation size={18} />
                        {littleMap ? "" : <span className="map-btn-label">{isLocating ? "Localisation..." : "Ma position"}</span>}
                    </Button>
                </div>
            )}

            {!littleMap && (
                <div className="map-poi-control">
                    {isPoiMenuOpen && (
                        <div className="map-style-menu">
                            <div className="map-style-menu-title">{"Points d'intérêt"}</div>
                            {POI_CATEGORIES.map((category) => (
                                <div key={category.id}>
                                    <label className="map-poi-item">
                                        <span className="map-poi-badge" style={{ backgroundColor: category.color }} />
                                        <span className="map-poi-label">{category.label}</span>
                                        <input
                                            type="checkbox"
                                            checked={!!enabledPoiCats[category.id]}
                                            onChange={() => handlePoiCategoryToggle(category.id)}
                                        />
                                    </label>

                                    {category.subTypes && enabledPoiCats[category.id] && category.subTypes.map((subType) => (
                                        <label key={subType.id} className="map-poi-item map-poi-subitem">
                                            <span className="map-poi-dot" style={{ backgroundColor: subType.color }} />
                                            <span className="map-poi-label">{subType.label}</span>
                                            <input
                                                type="checkbox"
                                                checked={!!enabledSubTypes[category.id]?.[subType.id]}
                                                onChange={() => handleSubTypeToggle(category.id, subType.id)}
                                            />
                                        </label>
                                    ))}
                                </div>
                            ))}
                            <div className="map-poi-hint">Zoomez pour les faire apparaître.</div>
                        </div>
                    )}

                    <Button
                        type="button"
                        className="map-layer-toggle"
                        onClick={() => setIsPoiMenuOpen(!isPoiMenuOpen)}
                        title="Afficher des points d'intérêt"
                    >
                        <MdOutlinePlace size={18} />
                        <span className="map-btn-label">Points d'intérêt</span>
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
                                    handleMapStyleChange(style.id);
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
                    {littleMap ? "" : <span className="map-btn-label">Calques</span>}
                </Button>
            </div>
            <Map
                ref={mapRef}
                initialViewState={getInitialViewState()}
                mapStyle={currentMapStyle}
                interactiveLayerIds={[
                    ...(itineraires ? itineraires.map((it) => `route-hitbox-${it.id}`) : []),
                    ...(showPois ? [POI_LAYER_ID] : []),
                ]}
                onClick={onClick}
                onMouseMove={onHover}
                onContextMenu={littleMap ? undefined : onContextMenu}
                onMoveStart={closeContextMenu}
                onLoad={() => setIsMapLoaded(true)}
                style={{ width: '100%', height: '100%' }}
            >
                <NavigationControl position="top-right" />

                {userPosition && (
                    <Marker longitude={userPosition.lon} latitude={userPosition.lat} anchor="center">
                        <div className="user-position-dot" />
                    </Marker>
                )}

                {/* Déclarée avant les sources d'itinéraires : les POI passent donc
                    sous les tracés. Les signalements sont des Marker DOM, toujours
                    au-dessus du canvas. */}
                {showPois && (
                    <Source id="pois" type="geojson" data={poisGeoJSON}>
                        <Layer
                            id={POI_LAYER_ID}
                            type="symbol"
                            minzoom={10}
                            layout={{
                                'icon-image': ['match', ['get', 'category'],
                                    'water', 'poi-water',
                                    // Les toilettes se déclinent selon la gratuité.
                                    'toilets', ['match', ['get', 'toilet_fee'],
                                        'free', 'poi-toilets-free',
                                        'paid', 'poi-toilets-paid',
                                        'poi-toilets-unknown'],
                                    // Le parking se décline par famille d'aménagement.
                                    'parking', ['match', ['get', 'parking_type'],
                                        'stands', 'poi-parking-stands',
                                        'racks', 'poi-parking-racks',
                                        'shelter', 'poi-parking-shelter',
                                        'poi-parking-other'],
                                    // La réparation distingue libre-service et atelier.
                                    'repair', ['match', ['get', 'repair_kind'],
                                        'shop', 'poi-repair-shop',
                                        'poi-repair-selfservice'],
                                    'poi-water'],
                                'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.3, 13, 0.6, 17, 1.1],
                                // Dédensification : le moteur masque les icônes qui se chevauchent.
                                'icon-allow-overlap': false,
                                // Priorité de placement : les parkings (très nombreux) cèdent la
                                // place aux catégories rares (toilettes, réparation) qui seraient
                                // sinon écrasées par collision. Sort-key bas = placé en premier.
                                'symbol-sort-key': ['match', ['get', 'category'], 'parking', 1, 0],
                                'text-field': ['step', ['zoom'], '', 16, ['coalesce', ['get', 'name'], '']],
                                'text-size': 11,
                                'text-anchor': 'top',
                                'text-offset': [0, 1.7],
                                'text-allow-overlap': false,
                                // En cas de collision, on sacrifie le libellé avant l'icône.
                                'text-optional': true,
                            }}
                            paint={{
                                'icon-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.45, 13, 0.7, 15, 1],
                                'text-color': resolvedTheme === 'dark' ? '#e5e7eb' : '#1f2937',
                                'text-halo-color': resolvedTheme === 'dark' ? '#111827' : '#ffffff',
                                'text-halo-width': 1.2,
                            }}
                        />
                    </Source>
                )}

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
                            onClick={(e) => { e.stopPropagation(); setActivePoi(null); setActiveTraffic(null); setActiveReport(report); }}>
                            {REPORT_ICONS[report.report_type] || "📍"}
                        </div>
                    </Marker>
                ))}

                {trafficPoints && trafficPoints.map((pt) => (
                    <Marker key={`traffic-${pt.id}`} longitude={pt.lon} latitude={pt.lat} anchor="center">
                        <div
                            onClick={(e) => { e.stopPropagation(); setActivePoi(null); setActiveReport(null); setActiveTraffic(pt); }}
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
                        <div className="map-popup">
                            <div
                                className="map-popup-header"
                                style={{ backgroundColor: TRAFFIC_COLORS[activeTraffic.level] || TRAFFIC_COLORS.gray }}
                            >
                                <span className="map-popup-icon">🚦</span>
                                <span className="map-popup-title">{activeTraffic.name || "Point de comptage"}</span>
                            </div>
                            <div className="map-popup-body">
                                {activeTraffic.speed != null && <p className="map-popup-line">🚗 Vitesse : <strong>{activeTraffic.speed} km/h</strong></p>}
                                {activeTraffic.flow != null && <p className="map-popup-line">🚦 Débit : <strong>{activeTraffic.flow} véh/h</strong></p>}
                                {activeTraffic.occupancy != null && <p className="map-popup-line">📊 Occupation : <strong>{activeTraffic.occupancy}%</strong></p>}
                            </div>
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
                        <div className="map-popup">
                            <div
                                className="map-popup-header"
                                style={{ backgroundColor: REPORT_TYPE_META[activeReport.report_type]?.color || '#6b7280' }}
                            >
                                <span className="map-popup-icon">{REPORT_ICONS[activeReport.report_type] || "📍"}</span>
                                <span className="map-popup-title">
                                    {REPORT_TYPE_META[activeReport.report_type]?.label || activeReport.report_type}
                                </span>
                            </div>
                            <div className="map-popup-body">
                                {activeReport.report_description && (
                                    <p className="map-popup-desc">{activeReport.report_description}</p>
                                )}
                                {formatReportAge(activeReport.created_at) && (
                                    <p className="map-popup-meta">{formatReportAge(activeReport.created_at)}</p>
                                )}
                                <p className="map-popup-votes">
                                    <span className="vote-chip vote-chip-yes">👍 {activeReport.confirmations_count ?? 0} là</span>
                                    <span className="vote-chip vote-chip-no">👎 {activeReport.denials_count ?? 0} pas là</span>
                                </p>
                            </div>
                            {(() => {
                                const isOwnReport = activeReport.user_id != null && activeReport.user_id === currentUserId;
                                const showVote = canVote && onVote && !isOwnReport;
                                const showDelete = onDeleteReport && isOwnReport;
                                if (!showVote && !showDelete) return null;
                                return (
                                    <div className="map-popup-footer">
                                        {showVote && (
                                            <div className="map-popup-vote-actions">
                                                <Button
                                                    className="vote-button-yes"
                                                    type="button"
                                                    onClick={() => handleVote(activeReport.id, true)}
                                                >
                                                    Confirmer
                                                </Button>
                                                <Button
                                                    className="vote-button-no"
                                                    type="button"
                                                    onClick={() => handleVote(activeReport.id, false)}
                                                >
                                                    Pas là
                                                </Button>
                                            </div>
                                        )}
                                        {showDelete && (
                                            <Button
                                                className="danger-button"
                                                type="button"
                                                onClick={() => { onDeleteReport(activeReport.id); setActiveReport(null); }}
                                            >
                                                Supprimer
                                            </Button>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </Popup>
                )}

                {activePoi && (
                    <Popup
                        longitude={activePoi.lon}
                        latitude={activePoi.lat}
                        onClose={() => setActivePoi(null)}
                        closeOnClick={false}
                        anchor="bottom"
                        offset={[0, -12]}
                    >
                        {(() => {
                            const category = POI_CATEGORIES.find(c => c.id === activePoi.category);
                            const details = POI_DETAIL_FIELDS.filter(field => field.except !== activePoi.category
                                && activePoi[field.key] !== undefined && activePoi[field.key] !== null);
                            return (
                                <div className="map-popup">
                                    <div className="map-popup-header" style={{ backgroundColor: category?.color || '#6b7280' }}>
                                        <span className="map-popup-icon">📍</span>
                                        <span className="map-popup-header-text">
                                            <span className="map-popup-title">{activePoi.name || category?.label}</span>
                                            {activePoi.name && <span className="map-popup-subtitle">{category?.label}</span>}
                                        </span>
                                    </div>
                                    {details.length > 0 && (
                                        <div className="map-popup-body">
                                            {details.map(field => (
                                                <p key={field.key} className="map-popup-detail">
                                                    {field.label} : <strong>{(field.format || formatPoiTag)(activePoi[field.key])}</strong>
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                    {onNavigateToPoi && (
                                        <div className="map-popup-footer">
                                            <Button type="button" onClick={handleNavigateToPoi}>
                                                Y aller
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </Popup>
                )}

            </Map>

            {!littleMap && contextMenu && (
                <MapContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    lat={contextMenu.lat}
                    lon={contextMenu.lon}
                    address={contextAddress}
                    isAddressLoading={isContextAddressLoading}
                    canReport={canReport && !!onReportAt}
                    onClose={closeContextMenu}
                    onSetStart={() => handleContextAction("start")}
                    onSetEnd={() => handleContextAction("end")}
                    onReport={() => handleContextAction("report")}
                    onCenter={() => handleContextAction("center")}
                />
            )}
        </div>
    );
}
