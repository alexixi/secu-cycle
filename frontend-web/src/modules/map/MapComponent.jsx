import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import Button from '../../components/ui/Button';
import ThemeToggle from '../../components/ui/ThemeToggle';
import MapContextMenu, { formatCoords } from './MapContextMenu';
import { useTheme } from '../../context/ThemeContext';
import { getPois, getAccidents } from '../../services/apiBack';
import { getAddressFromCoordinates, getApproxLocationFromIp } from '../../services/geocodingService';
import { trackEvent } from '../../services/analytics';

import { IoMdPin } from "react-icons/io";
import { FaLayerGroup } from "react-icons/fa";
import { MdOutlineReportProblem, MdOutlineTraffic, MdMyLocation, MdOutlinePlace } from "react-icons/md";
import reportAccidentIcon from '../../assets/reports/accident.png';
import reportTravauxIcon from '../../assets/reports/travaux.png';
import reportDangerIcon from '../../assets/reports/danger.png';
import reportObstacleIcon from '../../assets/reports/obstacle.png';
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

const poiImageModules = import.meta.glob('../../assets/poi/*.png', { eager: true, import: 'default' });
const POI_IMAGE_ASSETS = Object.entries(poiImageModules).map(([filePath, src]) => ({
    key: `poi-${filePath.split('/').pop().replace('.png', '')}`,
    src,
}));

const REPORT_IMAGE_ASSETS = [
    { key: 'report-accident', src: reportAccidentIcon },
    { key: 'report-travaux', src: reportTravauxIcon },
    { key: 'report-danger', src: reportDangerIcon },
    { key: 'report-obstacle', src: reportObstacleIcon },
];

const MAP_IMAGE_ASSETS = [...POI_IMAGE_ASSETS, ...REPORT_IMAGE_ASSETS];

const IMAGE_SRC_BY_KEY = Object.fromEntries(MAP_IMAGE_ASSETS.map(({ key, src }) => [key, src]));

const reportIconSrc = (type) => IMAGE_SRC_BY_KEY[`report-${type}`] || IMAGE_SRC_BY_KEY['report-danger'];

const RESTRICTED_ACCESS = ['private', 'no', 'permit', 'employees', 'delivery', 'military', 'agricultural', 'forestry'];
const OFF_COLOR = '#9CA3AF';
const CUSTOMERS_COLOR = '#F59E0B';

const isPoiUnavailable = (poi) => (
    RESTRICTED_ACCESS.includes(poi?.access)
    || poi?.disused === 'yes'
    || poi?.['disused:amenity'] != null
    || ['closed', 'off'].includes(poi?.opening_hours)
);

const isPoiCustomers = (poi) => poi?.access === 'customers';

const isPoiPaid = (poi) => (
    poi?.category === 'toilets'
        ? poi?.toilet_fee === 'paid'
        : (poi?.fee != null && poi.fee !== 'no' && poi.fee !== '')
);

const poiStateSuffix = (poi) => (
    isPoiUnavailable(poi) ? '-off'
        : isPoiPaid(poi) ? '-paid'
            : isPoiCustomers(poi) ? '-customers'
                : ''
);

const poiAccentColor = (poi, base) => (isPoiUnavailable(poi) ? OFF_COLOR : isPoiCustomers(poi) ? CUSTOMERS_COLOR : base);

const poiIconSrc = (poi) => {
    let key;
    switch (poi?.category) {
        case 'toilets':
            key = ['free', 'paid'].includes(poi.toilet_fee) ? `poi-toilets-${poi.toilet_fee}` : 'poi-toilets-unknown';
            break;
        case 'parking': {
            const ptype = ['stands', 'racks', 'shelter'].includes(poi.parking_type) ? poi.parking_type : 'other';
            key = `poi-parking-${ptype}`;
            if (ptype !== 'shelter' && poi.covered === 'yes') key += '-covered';
            break;
        }
        case 'repair':
            key = poi.repair_kind === 'shop' ? 'poi-repair-shop' : 'poi-repair-selfservice';
            break;
        default:
            key = 'poi-water';
    }
    return IMAGE_SRC_BY_KEY[key + poiStateSuffix(poi)];
};

const POI_LAYER_ID = 'pois-symbol';
const REPORT_LAYER_ID = 'reports-symbol';
const ACCIDENT_HEAT_LAYER_ID = 'accidents-heat';
const ACCIDENT_POINT_LAYER_ID = 'accidents-point';

const ACCIDENT_SWITCH_ZOOM = 13.5;

const ACCIDENT_SEVERITY_COLOR = [
    'match', ['get', 'severity'],
    10, '#7f1d1d',
    3, '#dc2626',
    1, '#f97316',
    '#fbbf24',
];

const ACCIDENT_LEGEND = [
    { label: 'Accident mortel', color: '#7f1d1d' },
    { label: 'Blessé hospitalisé', color: '#dc2626' },
    { label: 'Blessé léger', color: '#f97316' },
];

const formatAccidentDate = (properties) => {
    if (!properties?.date) return null;
    const parsed = new Date(properties.date);
    if (Number.isNaN(parsed.getTime())) return properties.date;
    const options = properties.date_precision === 'month'
        ? { month: 'long', year: 'numeric' }
        : { day: 'numeric', month: 'long', year: 'numeric' };
    return parsed.toLocaleDateString('fr-FR', options);
};

const ACCIDENT_DETAIL_FIELDS = [
    { key: 'light', label: 'Luminosité' },
    { key: 'weather', label: 'Météo' },
    { key: 'collision', label: 'Type de collision' },
    { key: 'road_type', label: 'Type de voie' },
    { key: 'intersection', label: 'Intersection' },
];

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
    const [enabledSubTypes, setEnabledSubTypes] = useState(DEFAULT_SUB_TYPES);
    const poiCacheRef = useRef({});
    const [poiData, setPoiData] = useState({});
    const [activePoi, setActivePoi] = useState(null);
    const [arePoiImagesReady, setArePoiImagesReady] = useState(false);
    const [showAccidents, setShowAccidents] = useState(false);
    const [accidentData, setAccidentData] = useState(null);
    const [activeAccident, setActiveAccident] = useState(null);
    const accidentCacheRef = useRef(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [contextAddress, setContextAddress] = useState(null);
    const [isContextAddressLoading, setIsContextAddressLoading] = useState(false);
    const contextGeocodeRef = useRef(null);
    const didAutoCenterRef = useRef(false);

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

        setShowAccidents(localStorage.getItem('userMapAccidents') === 'true');

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

    useEffect(() => {
        if (littleMap || !showAccidents || accidentCacheRef.current) return;
        accidentCacheRef.current = true;
        getAccidents()
            .then(collection => {
                setAccidentData(collection);
                if (!collection?.features?.length) accidentCacheRef.current = false;
            })
            .catch(error => {
                accidentCacheRef.current = false;  // autorise une nouvelle tentative
                console.error("Erreur chargement des accidents :", error);
            });
    }, [showAccidents, littleMap]);

    const handleAccidentsToggle = () => {
        const next = !showAccidents;
        setShowAccidents(next);
        if (!next) setActiveAccident(null);
        localStorage.setItem('userMapAccidents', String(next));
    };

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

    const reportsGeoJSON = useMemo(() => ({
        type: 'FeatureCollection',
        features: (reports || []).map((report) => ({
            type: 'Feature',
            properties: { id: report.id, report_type: report.report_type },
            geometry: { type: 'Point', coordinates: [report.longitude, report.latitude] },
        })),
    }), [reports]);

    const showAccidentLayers = !littleMap && showAccidents && !!accidentData;

    const showPois = !littleMap && arePoiImagesReady && poisGeoJSON.features.length > 0;
    const showReports = !littleMap && arePoiImagesReady && reportsGeoJSON.features.length > 0;

    const poiImagesRef = useRef({});

    useEffect(() => {
        if (littleMap || !isMapLoaded || !mapRef.current) return;
        const map = mapRef.current.getMap();

        const registerImages = () => {
            MAP_IMAGE_ASSETS.forEach(({ key }) => {
                const image = poiImagesRef.current[key];
                if (image && !map.hasImage(key)) {
                    map.addImage(key, image, { pixelRatio: 2 });
                }
            });
        };

        let cancelled = false;
        Promise.all(MAP_IMAGE_ASSETS.map(({ key, src }) => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => { poiImagesRef.current[key] = img; resolve(); };
            img.onerror = reject;
            img.src = src;
        }))).then(() => {
            if (cancelled) return;
            registerImages();
            map.on('styledata', registerImages);
            setArePoiImagesReady(true);
        }).catch(error => console.error("Erreur chargement des icônes de la carte:", error));

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

    useEffect(() => {
        if (littleMap || !isMapLoaded || didAutoCenterRef.current) return;
        if (start || end || itineraires?.[0]?.path?.length) return; // un cadrage explicite a priorité
        didAutoCenterRef.current = true;

        (async () => {
            if (navigator.geolocation && navigator.permissions?.query) {
                try {
                    const perm = await navigator.permissions.query({ name: 'geolocation' });
                    if (perm.state === 'granted') {
                        navigator.geolocation.getCurrentPosition(
                            (pos) => {
                                const { latitude, longitude } = pos.coords;
                                setUserPosition({ lat: latitude, lon: longitude });
                                mapRef.current?.getMap().flyTo({ center: [longitude, latitude], zoom: 16, duration: 1500 });
                            },
                            () => {},
                            { enableHighAccuracy: true, timeout: 10000 }
                        );
                        return;
                    }
                } catch {
                }
            }

            if (localStorage.getItem('userMapLastView')) return;

            const loc = await getApproxLocationFromIp();
            if (loc) {
                mapRef.current?.getMap().flyTo({ center: [loc.lon, loc.lat], zoom: 11, duration: 1000 });
            }
        })();
    }, [isMapLoaded, start, end, itineraires, littleMap]);

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

        const reportFeature = features.find(f => f.layer?.id === REPORT_LAYER_ID);
        if (reportFeature) {
            const report = reports?.find((r) => r.id === reportFeature.properties.id);
            if (report) {
                setActivePoi(null);
                setActiveTraffic(null);
                setActiveAccident(null);
                setActiveReport(report);
            }
            return;
        }

        const poiFeature = features.find(f => f.layer?.id === POI_LAYER_ID);
        if (poiFeature) {
            const [lon, lat] = poiFeature.geometry.coordinates;
            setActiveReport(null);
            setActiveTraffic(null);
            setActiveAccident(null);
            setActivePoi({ ...poiFeature.properties, lat, lon });
            return;
        }

        const accidentFeature = features.find(f => f.layer?.id === ACCIDENT_POINT_LAYER_ID);
        if (accidentFeature) {
            const [lon, lat] = accidentFeature.geometry.coordinates;
            setActivePoi(null);
            setActiveReport(null);
            setActiveTraffic(null);
            setActiveAccident({ ...accidentFeature.properties, lat, lon });
            return;
        }

        const routeFeature = features.find(isRouteFeature);
        if (routeFeature) {
            setSelectedItineraire(routeFeature.properties.id);
            return;
        }

        setActivePoi(null);
        setActiveReport(null);
        setActiveTraffic(null);
        setActiveAccident(null);
        if (onMapClick) {
            onMapClick({ lat: event.lngLat.lat, lon: event.lngLat.lng });
        }
    };

    const onHover = (event) => {
        const features = event.features || [];
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
        if (!littleMap) {
            try {
                const saved = JSON.parse(localStorage.getItem('userMapLastView'));
                if (saved && Number.isFinite(saved.longitude) && Number.isFinite(saved.latitude)) {
                    return { longitude: saved.longitude, latitude: saved.latitude, zoom: saved.zoom ?? 13 };
                }
            } catch {
            }
        }
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

                            <div className="map-style-menu-title map-poi-section">Accidentologie</div>
                            <label className="map-poi-item">
                                <span className="map-poi-badge" style={{ backgroundColor: '#dc2626' }} />
                                <span className="map-poi-label">Accidents à vélo</span>
                                <input
                                    type="checkbox"
                                    checked={showAccidents}
                                    onChange={handleAccidentsToggle}
                                />
                            </label>
                            {showAccidents && (
                                <>
                                    {ACCIDENT_LEGEND.map(item => (
                                        <span key={item.label} className="map-poi-item map-poi-subitem">
                                            <span className="map-poi-dot" style={{ backgroundColor: item.color }} />
                                            <span className="map-poi-label">{item.label}</span>
                                        </span>
                                    ))}
                                    <div className="map-poi-hint">
                                        Accidents déclarés aux forces de l'ordre : l'absence de point
                                        ne signifie pas l'absence de danger.
                                    </div>
                                    {accidentData?.attributions?.length > 0 && (
                                        <div className="map-poi-hint map-poi-source">
                                            {accidentData.attributions.join(' · ')}
                                        </div>
                                    )}
                                </>
                            )}
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
                    ...(showReports ? [REPORT_LAYER_ID] : []),
                    ...(showPois ? [POI_LAYER_ID] : []),
                    ...(showAccidentLayers ? [ACCIDENT_POINT_LAYER_ID] : []),
                ]}
                onClick={onClick}
                onMouseMove={onHover}
                onContextMenu={littleMap ? undefined : onContextMenu}
                onMoveStart={closeContextMenu}
                onMoveEnd={littleMap ? undefined : (e) => {
                    const c = e.viewState;
                    try {
                        localStorage.setItem('userMapLastView', JSON.stringify({
                            longitude: c.longitude, latitude: c.latitude, zoom: c.zoom
                        }));
                    } catch {
                    }
                }}
                onLoad={() => setIsMapLoaded(true)}
                style={{ width: '100%', height: '100%' }}
            >
                <NavigationControl position="top-right" />

                {userPosition && (
                    <Marker longitude={userPosition.lon} latitude={userPosition.lat} anchor="center">
                        <div className="user-position-dot" />
                    </Marker>
                )}

                {showAccidentLayers && (
                    <Source id="accidents" type="geojson" data={accidentData}>
                        <Layer
                            id={ACCIDENT_HEAT_LAYER_ID}
                            type="heatmap"
                            maxzoom={ACCIDENT_SWITCH_ZOOM + 1}
                            paint={{
                                'heatmap-weight': ['interpolate', ['linear'], ['get', 'severity'],
                                    0, 0.3, 1, 0.5, 3, 0.8, 10, 1],
                                'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 8, 1, 14, 3],
                                'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'],
                                    0, 'rgba(0,0,0,0)',
                                    0.2, 'rgba(254,240,138,0.5)',
                                    0.4, 'rgba(251,146,60,0.6)',
                                    0.7, 'rgba(220,38,38,0.75)',
                                    1, 'rgba(127,29,29,0.9)'],
                                'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 8, 10, 14, 28],
                                'heatmap-opacity': ['interpolate', ['linear'], ['zoom'],
                                    ACCIDENT_SWITCH_ZOOM, 0.85, ACCIDENT_SWITCH_ZOOM + 1, 0],
                            }}
                        />
                        <Layer
                            id={ACCIDENT_POINT_LAYER_ID}
                            type="circle"
                            minzoom={ACCIDENT_SWITCH_ZOOM}
                            paint={{
                                'circle-radius': ['interpolate', ['linear'], ['zoom'],
                                    ACCIDENT_SWITCH_ZOOM, 4, 17, 10],
                                'circle-color': ACCIDENT_SEVERITY_COLOR,
                                'circle-stroke-width': 1.5,
                                'circle-stroke-color': '#ffffff',
                                'circle-opacity': ['interpolate', ['linear'], ['zoom'],
                                    ACCIDENT_SWITCH_ZOOM, 0, ACCIDENT_SWITCH_ZOOM + 1, 0.9],
                                'circle-stroke-opacity': ['interpolate', ['linear'], ['zoom'],
                                    ACCIDENT_SWITCH_ZOOM, 0, ACCIDENT_SWITCH_ZOOM + 1, 1],
                            }}
                        />
                    </Source>
                )}

                {showPois && (
                    <Source id="pois" type="geojson" data={poisGeoJSON}>
                        <Layer
                            id={POI_LAYER_ID}
                            type="symbol"
                            minzoom={10}
                            layout={{
                                'icon-image': ['concat',
                                    ['match', ['get', 'category'],
                                        'water', 'poi-water',
                                        'toilets', ['match', ['get', 'toilet_fee'],
                                            'free', 'poi-toilets-free',
                                            'paid', 'poi-toilets-paid',
                                            'poi-toilets-unknown'],
                                        'parking', ['concat',
                                            ['match', ['get', 'parking_type'],
                                                'stands', 'poi-parking-stands',
                                                'racks', 'poi-parking-racks',
                                                'shelter', 'poi-parking-shelter',
                                                'poi-parking-other'],
                                            ['case',
                                                ['all',
                                                    ['!=', ['get', 'parking_type'], 'shelter'],
                                                    ['==', ['get', 'covered'], 'yes']],
                                                '-covered', '']],
                                        'repair', ['match', ['get', 'repair_kind'],
                                            'shop', 'poi-repair-shop',
                                            'poi-repair-selfservice'],
                                        'poi-water'],
                                    ['case',
                                        ['any',
                                            ['in', ['get', 'access'], ['literal', RESTRICTED_ACCESS]],
                                            ['==', ['get', 'disused'], 'yes'],
                                            ['has', 'disused:amenity'],
                                            ['in', ['get', 'opening_hours'], ['literal', ['closed', 'off']]]],
                                        '-off',
                                        ['any',
                                            ['all', ['==', ['get', 'category'], 'toilets'], ['==', ['get', 'toilet_fee'], 'paid']],
                                            ['all', ['!=', ['get', 'category'], 'toilets'], ['has', 'fee'], ['!=', ['get', 'fee'], 'no']]],
                                        '-paid',
                                        ['==', ['get', 'access'], 'customers'], '-customers',
                                        '']],
                                'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.3, 13, 0.6, 17, 1.1],
                                'icon-allow-overlap': false,
                                'symbol-sort-key': ['match', ['get', 'category'], 'parking', 1, 0],
                                'text-field': ['step', ['zoom'], '', 16, ['coalesce', ['get', 'name'], '']],
                                'text-size': 11,
                                'text-anchor': 'top',
                                'text-offset': [0, 1.7],
                                'text-allow-overlap': false,
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

                {showReports && (
                    <Source id="reports" type="geojson" data={reportsGeoJSON}>
                        <Layer
                            id={REPORT_LAYER_ID}
                            type="symbol"
                            minzoom={9}
                            layout={{
                                'icon-image': ['match', ['get', 'report_type'],
                                    'accident', 'report-accident',
                                    'travaux', 'report-travaux',
                                    'danger', 'report-danger',
                                    'obstacle', 'report-obstacle',
                                    'report-danger'],
                                'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.42, 13, 0.84, 17, 1.5],
                                'icon-allow-overlap': true,
                            }}
                            paint={{
                                'icon-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0, 10.5, 1],
                            }}
                        />
                    </Source>
                )}

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
                                <img className="map-popup-icon map-popup-icon-img" src={reportIconSrc(activeReport.report_type)} alt="" />
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
                                    <div className="map-popup-header" style={{ backgroundColor: poiAccentColor(activePoi, category?.color || '#6b7280') }}>
                                        <img className="map-popup-icon map-popup-icon-img" src={poiIconSrc(activePoi)} alt="" />
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

                {activeAccident && (
                    <Popup
                        longitude={activeAccident.lon}
                        latitude={activeAccident.lat}
                        onClose={() => setActiveAccident(null)}
                        closeOnClick={false}
                        anchor="bottom"
                        offset={[0, -12]}
                    >
                        {(() => {
                            const details = ACCIDENT_DETAIL_FIELDS.filter(
                                field => activeAccident[field.key]);
                            const date = formatAccidentDate(activeAccident);
                            return (
                                <div className="map-popup">
                                    <div
                                        className="map-popup-header"
                                        style={{ backgroundColor: activeAccident.severity >= 10 ? '#7f1d1d'
                                            : activeAccident.severity >= 3 ? '#dc2626' : '#f97316' }}
                                    >
                                        <span className="map-popup-header-text">
                                            <span className="map-popup-title">Accident à vélo</span>
                                            {date && <span className="map-popup-subtitle">{date}</span>}
                                        </span>
                                    </div>
                                    <div className="map-popup-body">
                                        {activeAccident.severity_label && (
                                            <p className="map-popup-detail">
                                                Gravité : <strong>{activeAccident.severity_label}</strong>
                                            </p>
                                        )}
                                        {details.map(field => (
                                            <p key={field.key} className="map-popup-detail">
                                                {field.label} : <strong>{activeAccident[field.key]}</strong>
                                            </p>
                                        ))}
                                    </div>
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
