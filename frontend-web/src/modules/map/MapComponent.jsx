import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import Button from '../../components/ui/Button';
import ThemeToggle from '../../components/ui/ThemeToggle';
import MapContextMenu, { formatCoords } from './MapContextMenu';
import LightingInfoModal from './LightingInfoModal';
import AirQualityInfoModal from './AirQualityInfoModal';
import { useTheme } from '../../context/ThemeContext';
import { getPois, getAccidents, getStreetlights, getLitRoads, getStreetlightSources, getAirQuality, getBikeshareStations } from '../../services/apiBack';
import { getAddressFromCoordinates, getApproxLocationFromIp } from '../../services/geocodingService';
import { trackEvent } from '../../services/analytics';

import { IoMdPin } from "react-icons/io";
import { FaLayerGroup, FaBicycle } from "react-icons/fa";
import { MdOutlineReportProblem, MdOutlineTraffic, MdMyLocation, MdOutlinePlace, MdOutlineLightbulb, MdInfoOutline, MdOutlineAir, MdElectricBike, MdLocalParking } from "react-icons/md";
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

const bikeshareImageModules = import.meta.glob('../../assets/bikeshare/*.png', { eager: true, import: 'default' });
const BIKESHARE_IMAGE_ASSETS = Object.entries(bikeshareImageModules).map(([filePath, src]) => ({
    key: filePath.split('/').pop().replace('.png', ''),
    src,
}));

const MAP_IMAGE_ASSETS = [...POI_IMAGE_ASSETS, ...REPORT_IMAGE_ASSETS, ...BIKESHARE_IMAGE_ASSETS];

const bikeshareLogoModules = import.meta.glob('../../assets/bikeshare/logos/*.png', { eager: true, import: 'default' });
const BIKESHARE_LOGOS = Object.fromEntries(
    Object.entries(bikeshareLogoModules)
        .map(([filePath, src]) => [filePath.split('/').pop().replace('.png', ''), src])
);

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
const LIGHTING_HEAT_LAYER_ID = 'lighting-heat';
const LIT_ROADS_GLOW_LAYER_ID = 'lit-roads-glow';
const LIT_ROADS_LINE_LAYER_ID = 'lit-roads-line';

const LIT_ROADS_COLORS = { osm: '#ffcf3d', inferred: '#ffe39a' };
const LIGHTING_LAMP_COLOR = '#ffc12d';

const LIT_ROADS_COLOR = ['match', ['get', 'lit_source'],
    'inferred', LIT_ROADS_COLORS.inferred,
    LIT_ROADS_COLORS.osm];

const LIGHTING_HEATMAP_PAINT = {
    'heatmap-weight': 0.7,
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 13, 1.1, 19, 1.4],
    'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(0,0,0,0)',
        0.1, 'rgba(255,247,204,0.35)',
        0.3, 'rgba(255,236,150,0.55)',
        0.6, 'rgba(255,214,90,0.72)',
        1, 'rgba(255,193,45,0.88)'],
    'heatmap-radius': ['interpolate', ['exponential', 2], ['zoom'], 11, 8, 15, 10, 19, 160, 22, 1280],
    'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 12, 0.55, 19, 0.5],
};

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

const TRAFFIC_LAYER_ID = 'traffic-line';
const TRAFFIC_HITBOX_LAYER_ID = 'traffic-hitbox';

const TRAFFIC_LABELS = {
    green: 'Circulation fluide',
    orange: 'Circulation dense',
    red: 'Axe embouteillé',
    gray: 'État inconnu',
};

const TRAFFIC_CYCLIST_HINT = {
    orange: '🚲 Trafic ralenti : dépassements serrés et portières, restez visible.',
    red: '🚲 Axe évité par nos itinéraires sécurisés dès que possible.',
};

const AIR_LAYER_ID = 'air-quality-fill';
const AIR_OUTLINE_LAYER_ID = 'air-quality-outline';

// Couleurs officielles de l'indice européen (EAQI, barème EEA).
const AIR_BAND_COLORS = {
    good: '#50f0e6',
    fair: '#50ccaa',
    moderate: '#f0e641',
    poor: '#ff5050',
    very_poor: '#960032',
    extreme: '#7d2181',
};

const AIR_FILL_COLOR = ['match', ['get', 'band'],
    'good', AIR_BAND_COLORS.good,
    'fair', AIR_BAND_COLORS.fair,
    'moderate', AIR_BAND_COLORS.moderate,
    'poor', AIR_BAND_COLORS.poor,
    'very_poor', AIR_BAND_COLORS.very_poor,
    'extreme', AIR_BAND_COLORS.extreme,
    '#9ca3af'];

// Capteurs sol WAQI : pastilles en échelle AQI US (couleur fournie par le backend
// via la propriété `color`).
const AIR_STATION_CIRCLE_LAYER_ID = 'air-stations-circle';

// Résumé de la zone regardée.
function airForCenter(airData, center) {
    const zones = airData?.zones;
    if (!Array.isArray(zones) || zones.length === 0) return airData || null;
    if (zones.length === 1 || !center) return zones[0];

    const inside = zones.find(({ bbox }) => Array.isArray(bbox)
        && center.lon >= bbox[0] && center.lon <= bbox[2]
        && center.lat >= bbox[1] && center.lat <= bbox[3]);
    if (inside) return inside;

    let best = zones[0];
    let bestDistance = Infinity;
    for (const zone of zones) {
        if (!Array.isArray(zone.bbox)) continue;
        const [w, s, e, n] = zone.bbox;
        const dLon = Math.max(w - center.lon, 0, center.lon - e)
            * Math.cos((center.lat * Math.PI) / 180);
        const dLat = Math.max(s - center.lat, 0, center.lat - n);
        const distance = Math.hypot(dLon, dLat);
        if (distance < bestDistance) {
            best = zone;
            bestDistance = distance;
        }
    }
    return best;
}

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

const BIKESHARE_ICON_LAYER_ID = 'bikeshare-icon';
const BIKESHARE_HITBOX_LAYER_ID = 'bikeshare-hitbox';
const BIKESHARE_BADGE_LAYER_ID = 'bikeshare-badge';

const BIKESHARE_NAVY = '#312E81';

const BIKESHARE_COLORS = {
    ok: '#16A34A',
    low: '#F97316',
    empty: '#EF4444',
    off: OFF_COLOR,
    full: '#166534',
};

const BIKESHARE_IS_OFF = ['any',
    ['==', ['get', 'is_renting'], false],
    ['==', ['get', 'is_installed'], false]];

const BIKESHARE_BIKES = ['coalesce', ['get', 'bikes_available'], -1];
const BIKESHARE_DOCKS = ['coalesce', ['get', 'docks_available'], -1];

const BIKESHARE_STATE = (unknown, off, empty, full, low, ok) => ['case',
    BIKESHARE_IS_OFF, off,
    ['<', BIKESHARE_BIKES, 0], unknown,
    ['==', BIKESHARE_BIKES, 0], empty,
    ['==', BIKESHARE_DOCKS, 0], full,
    ['<=', BIKESHARE_BIKES, 2], low,
    ok];

const BIKESHARE_ICON_IMAGE = BIKESHARE_STATE(
    'bikeshare-unknown', 'bikeshare-off', 'bikeshare-0',
    'bikeshare-3', 'bikeshare-1', 'bikeshare-2');

const BIKESHARE_BADGE_IMAGE = BIKESHARE_STATE(
    '', '', 'bikeshare-badge-empty',
    'bikeshare-badge-full', 'bikeshare-badge-low', 'bikeshare-badge-ok');

const BIKESHARE_HAS_BADGE = ['all',
    ['!', BIKESHARE_IS_OFF],
    ['>=', BIKESHARE_BIKES, 0]];

const BIKESHARE_BADGE_TRANSLATE = ['interpolate', ['linear'], ['zoom'],
    10, ['literal', [4, -4]],
    12, ['literal', [7, -7]],
    14, ['literal', [10, -10]],
    16, ['literal', [12, -12]],
    18, ['literal', [14, -14]]];

const BIKESHARE_COUNT_FIELDS = [
    { key: 'bikes_mechanical', label: 'Mécaniques', Icon: FaBicycle, tone: 'mechanical' },
    { key: 'bikes_electric', label: 'Électriques', Icon: MdElectricBike, tone: 'electric' },
    { key: 'docks_available', label: 'Places libres', Icon: MdLocalParking, tone: 'docks' },
];

const BIKESHARE_TOTAL_FIELD = {
    key: 'bikes_available', label: 'Vélos', Icon: FaBicycle, tone: 'mechanical',
};


function bikeshareShare(station, ventile) {
    const nombre = (key) => (typeof station[key] === 'number' ? station[key] : 0);
    const bikes = nombre('bikes_available');
    const docks = nombre('docks_available');
    const mecha = ventile ? nombre('bikes_mechanical') : bikes;
    const elec = ventile ? nombre('bikes_electric') : 0;

    const autres = Math.max(0, bikes - mecha - elec);
    const capacity = typeof station.capacity === 'number' ? station.capacity : 0;
    const indispo = Math.max(0, capacity - bikes - docks);
    const total = mecha + elec + autres + docks + indispo;
    if (total <= 0) return null;
    return {
        mecha, elec, autres, docks, indispo, total,
        indispoNotable: indispo >= 3 && indispo / total >= 0.25,
    };
}


const POPUP_VIEWPORT_MARGIN = 14;

function panPopupIntoView(map, margin = POPUP_VIEWPORT_MARGIN) {
    const container = map.getContainer();
    const popup = container.querySelector('.maplibregl-popup:not(.custom-map-tooltip)');
    if (!popup) return;

    const cadre = container.getBoundingClientRect();
    const bulle = popup.getBoundingClientRect();
    if (!bulle.width || !bulle.height) return;

    const gauche = (cadre.left + margin) - bulle.left;
    const droite = bulle.right - (cadre.right - margin);
    const haut = (cadre.top + margin) - bulle.top;
    const bas = bulle.bottom - (cadre.bottom - margin);

    const dx = bulle.width + 2 * margin > cadre.width
        ? Math.max(0, gauche)
        : Math.max(0, gauche) - Math.max(0, droite);
    const dy = bulle.height + 2 * margin > cadre.height
        ? Math.max(0, haut)
        : Math.max(0, haut) - Math.max(0, bas);

    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

    map.panBy([-dx, -dy], { duration: 220 });
}

const BIKESHARE_DETAIL_FIELDS = [
    { key: 'capacity', label: 'Capacité', format: (value) => `${value} points d'attache` },
    { key: 'system_name', label: 'Réseau' },
    { key: 'address', label: 'Adresse' },
];

const formatStationFreshness = (lastReported) => {
    if (!lastReported) return null;
    const then = new Date(lastReported).getTime();
    if (Number.isNaN(then)) return null;
    const minutes = Math.round((Date.now() - then) / 60000);
    if (minutes < 1) return 'Données à jour';
    if (minutes < 60) return `Relevé ${REPORT_AGE_RTF.format(-minutes, 'minute')}`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `Relevé ${REPORT_AGE_RTF.format(-hours, 'hour')}`;
    return 'Relevé ancien, fiabilité incertaine';
};

const formatPoiTag = (value) => {
    if (value === 'yes') return 'Oui';
    if (value === 'no') return 'Non';
    return String(value);
};

const isRouteFeature = (feature) => feature?.layer?.id?.startsWith('route-hitbox-');

export default function MapComponent({ start, end, pointilles, itineraires, selectedItineraire, setSelectedItineraire, reports, onMapClick, onDeleteReport, onVote, canVote, currentUserId, isReportMode, onToggleReportMode, canReport, traffic = null, trafficError = null, showTraffic = false, onToggleTraffic, onNavigateToPoi, onSetStart, onSetEnd, onReportAt, littleMap = false }) {

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
    const [activeAirStation, setActiveAirStation] = useState(null);
    const [isMapSelectOpen, setIsMapSelectOpen] = useState(false);
    const [selectedMapStyle, setSelectedMapStyle] = useState("base");
    const [mapThemeMode, setMapThemeMode] = useState("auto");
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [userPosition, setUserPosition] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const [isPoiMenuOpen, setIsPoiMenuOpen] = useState(false);
    const [isLightingMenuOpen, setIsLightingMenuOpen] = useState(false);
    const [isLightingInfoOpen, setIsLightingInfoOpen] = useState(false);
    const [lightingSources, setLightingSources] = useState(null);
    const lightingSourcesRef = useRef(false);
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
    const [showLighting, setShowLighting] = useState(false);
    const [lightingData, setLightingData] = useState(null);
    const lightingCacheRef = useRef(false);
    const [showLitRoads, setShowLitRoads] = useState(false);
    const [litRoadsData, setLitRoadsData] = useState(null);
    const litRoadsCacheRef = useRef(false);
    const [showAir, setShowAir] = useState(false);
    const [airData, setAirData] = useState(null);
    const [airError, setAirError] = useState(null);
    const [mapCenter, setMapCenter] = useState(null);
    const [isAirInfoOpen, setIsAirInfoOpen] = useState(false);
    const [showBikeshare, setShowBikeshare] = useState(false);
    const [bikeshareData, setBikeshareData] = useState(null);
    const [bikeshareError, setBikeshareError] = useState(null);
    const [activeStation, setActiveStation] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [contextAddress, setContextAddress] = useState(null);
    const [isContextAddressLoading, setIsContextAddressLoading] = useState(false);
    const contextGeocodeRef = useRef(null);
    const didAutoCenterRef = useRef(false);

    const popupAncre = activeTraffic ? `trafic:${activeTraffic.lon},${activeTraffic.lat}`
        : activeAirStation ? `air:${activeAirStation.lon},${activeAirStation.lat}`
            : activeReport ? `signalement:${activeReport.longitude},${activeReport.latitude}`
                : activePoi ? `poi:${activePoi.lon},${activePoi.lat}`
                    : activeStation ? `vls:${activeStation.station_id}`
                        : activeAccident ? `accident:${activeAccident.lon},${activeAccident.lat}`
                            : null;

    useEffect(() => {
        const map = mapRef.current?.getMap?.();
        if (!map || !isMapLoaded || !popupAncre) return undefined;

        let seconde;
        let observateur;
        const premiere = requestAnimationFrame(() => {
            seconde = requestAnimationFrame(() => {
                panPopupIntoView(map);

                const bulle = map.getContainer()
                    .querySelector('.maplibregl-popup:not(.custom-map-tooltip)');
                if (!bulle) return;
                observateur = new ResizeObserver(() => panPopupIntoView(map));
                observateur.observe(bulle);
            });
        });
        return () => {
            cancelAnimationFrame(premiere);
            if (seconde) cancelAnimationFrame(seconde);
            observateur?.disconnect();
        };
    }, [isMapLoaded, popupAncre]);

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
        setShowLighting(localStorage.getItem('userMapLighting') === 'true');
        setShowLitRoads(localStorage.getItem('userMapLitRoads') === 'true');
        setShowAir(localStorage.getItem('userMapAir') === 'true');
        setShowBikeshare(localStorage.getItem('userMapBikeshare') === 'true');

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
                    poiCacheRef.current[id] = false;
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
                accidentCacheRef.current = false;
                console.error("Erreur chargement des accidents :", error);
            });
    }, [showAccidents, littleMap]);

    const handleAccidentsToggle = () => {
        const next = !showAccidents;
        setShowAccidents(next);
        if (!next) setActiveAccident(null);
        localStorage.setItem('userMapAccidents', String(next));
    };

    useEffect(() => {
        if (littleMap || !showLighting || lightingCacheRef.current) return;
        lightingCacheRef.current = true;
        getStreetlights()
            .then(collection => {
                setLightingData(collection);
                if (!collection?.features?.length) lightingCacheRef.current = false;
            })
            .catch(error => {
                lightingCacheRef.current = false;
                console.error("Erreur chargement de l'éclairage :", error);
            });
    }, [showLighting, littleMap]);

    const handleLightingToggle = () => {
        const next = !showLighting;
        setShowLighting(next);
        localStorage.setItem('userMapLighting', String(next));
    };

    useEffect(() => {
        if (littleMap || !showLitRoads || litRoadsCacheRef.current) return;
        litRoadsCacheRef.current = true;
        getLitRoads()
            .then(collection => {
                setLitRoadsData(collection);
                if (!collection?.features?.length) litRoadsCacheRef.current = false;
            })
            .catch(error => {
                litRoadsCacheRef.current = false;
                console.error("Erreur chargement des rues éclairées :", error);
            });
    }, [showLitRoads, littleMap]);

    const handleLitRoadsToggle = () => {
        const next = !showLitRoads;
        setShowLitRoads(next);
        localStorage.setItem('userMapLitRoads', String(next));
    };

    useEffect(() => {
        if (littleMap || !showAir) return;

        let cancelled = false;
        let timer = null;

        const load = async () => {
            try {
                const data = await getAirQuality();
                if (cancelled) return;
                setAirData(data);
                setAirError(null);
                timer = setTimeout(load, (data?.refresh_interval_s || 900) * 1000);
            } catch (error) {
                if (cancelled) return;
                setAirError("Qualité de l'air momentanément indisponible.");
                timer = setTimeout(load, 60000);
            }
        };
        load();

        return () => { cancelled = true; if (timer) clearTimeout(timer); };
    }, [showAir, littleMap]);

    const handleAirToggle = () => {
        const next = !showAir;
        setShowAir(next);
        localStorage.setItem('userMapAir', String(next));
    };

    const handleAirInfoToggle = () => setIsAirInfoOpen((open) => !open);

    useEffect(() => {
        if (littleMap || !showBikeshare) return;

        let cancelled = false;
        let timer = null;

        const schedule = (delayMs) => {
            clearTimeout(timer);
            timer = setTimeout(load, delayMs);
        };

        const load = async () => {
            if (cancelled) return;
            if (document.visibilityState === 'hidden') return;
            try {
                const data = await getBikeshareStations();
                if (cancelled) return;
                setBikeshareData(data);
                setBikeshareError(null);
                schedule((data?.refresh_interval_s || 60) * 1000);
            } catch (error) {
                if (cancelled) return;
                setBikeshareError("Stations momentanément indisponibles.");
                schedule(60000);
            }
        };

        const onVisibility = () => {
            if (document.visibilityState === 'visible') load();
            else clearTimeout(timer);
        };

        load();
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            cancelled = true;
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [showBikeshare, littleMap]);

    const handleBikeshareToggle = () => {
        const next = !showBikeshare;
        setShowBikeshare(next);
        if (!next) setActiveStation(null);
        localStorage.setItem('userMapBikeshare', String(next));
    };

    const lightingShown = showLighting || showLitRoads;

    const handleLightingButton = () => {
        if (lightingShown) {
            setShowLighting(false);
            setShowLitRoads(false);
            localStorage.setItem('userMapLighting', 'false');
            localStorage.setItem('userMapLitRoads', 'false');
            setIsLightingMenuOpen(false);
            return;
        }

        setShowLighting(true);
        setShowLitRoads(true);
        localStorage.setItem('userMapLighting', 'true');
        localStorage.setItem('userMapLitRoads', 'true');
        setIsLightingMenuOpen(true);
    };

    const handleLightingInfoToggle = () => {
        const next = !isLightingInfoOpen;
        setIsLightingInfoOpen(next);
        if (!next || lightingSourcesRef.current) return;
        lightingSourcesRef.current = true;
        getStreetlightSources()
            .then(data => setLightingSources(data?.sources || []))
            .catch(error => {
                lightingSourcesRef.current = false;  // autorise une nouvelle tentative
                console.error("Erreur chargement des sources d'éclairage :", error);
            });
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
    const showLightingLayer = !littleMap && showLighting && !!lightingData;
    const showLitRoadsLayer = !littleMap && showLitRoads && !!litRoadsData;
    const trafficShown = !littleMap && !!onToggleTraffic && traffic?.available !== false;
    const showAirLayer = !littleMap && showAir && (airData?.geojson?.features?.length > 0);
    const showAirStations = !littleMap && showAir && (airData?.stations?.features?.length > 0);
    const showBikeshareLayer = !littleMap && arePoiImagesReady && showBikeshare
        && (bikeshareData?.geojson?.features?.length > 0);

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

    const trafficGeoJSON = useMemo(
        () => traffic?.geojson || { type: 'FeatureCollection', features: [] },
        [traffic]
    );

    const trafficUpdatedAt = useMemo(() => {
        if (!traffic?.updated_at) return null;
        const date = new Date(traffic.updated_at);
        if (Number.isNaN(date.getTime())) return null;
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }, [traffic]);

    const airGeoJSON = useMemo(
        () => airData?.geojson || { type: 'FeatureCollection', features: [] },
        [airData]
    );

    const airStationsGeoJSON = useMemo(
        () => airData?.stations || { type: 'FeatureCollection', features: [] },
        [airData]
    );

    const airUpdatedAt = useMemo(() => {
        if (!airData?.updated_at) return null;
        const date = new Date(airData.updated_at);
        if (Number.isNaN(date.getTime())) return null;
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }, [airData]);

    const activeAir = useMemo(() => airForCenter(airData, mapCenter), [airData, mapCenter]);

    // Première heure de la prévision où l'indice bascule dans une bande plus
    // dégradée que l'actuelle : « dégradation prévue vers 19 h ».
    const airForecastWarning = useMemo(() => {
        const current = activeAir?.summary?.aqi;
        const forecast = activeAir?.forecast;
        if (current == null || !Array.isArray(forecast)) return null;
        const worse = forecast.find((f) => f.aqi >= current + 20);
        if (!worse) return null;
        const date = new Date(worse.time);
        if (Number.isNaN(date.getTime())) return null;
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }, [activeAir]);

    const bikeshareGeoJSON = useMemo(
        () => bikeshareData?.geojson || { type: 'FeatureCollection', features: [] },
        [bikeshareData]
    );

    const bikeshareUpdatedAt = useMemo(() => {
        if (!bikeshareData?.updated_at) return null;
        const date = new Date(bikeshareData.updated_at);
        if (Number.isNaN(date.getTime())) return null;
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }, [bikeshareData]);

    const bikeshareSources = useMemo(
        () => (bikeshareData?.systems || []).map(s => s.attribution || s.name).filter(Boolean).join(' · ') || null,
        [bikeshareData]
    );

    useEffect(() => {
        setActiveStation(prev => {
            if (!prev) return prev;
            const fresh = bikeshareGeoJSON.features.find(
                f => f.properties.station_id === prev.station_id
            );
            return fresh ? { ...prev, ...fresh.properties } : prev;
        });
    }, [bikeshareGeoJSON]);

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
        setActiveAirStation(null);
        setActiveStation(null);
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
                setActiveStation(null);
                setActiveReport(report);
            }
            return;
        }

        const trafficFeature = features.find(f => f.layer?.id === TRAFFIC_HITBOX_LAYER_ID);
        if (trafficFeature) {
            setActivePoi(null);
            setActiveReport(null);
            setActiveAccident(null);
            setActiveAirStation(null);
            setActiveStation(null);
            setActiveTraffic({
                ...trafficFeature.properties,
                lat: event.lngLat.lat,
                lon: event.lngLat.lng,
            });
            return;
        }

        const stationFeature = features.find(f => f.layer?.id === AIR_STATION_CIRCLE_LAYER_ID);
        if (stationFeature) {
            const [lon, lat] = stationFeature.geometry.coordinates;
            setActivePoi(null);
            setActiveReport(null);
            setActiveAccident(null);
            setActiveTraffic(null);
            setActiveStation(null);
            setActiveAirStation({ ...stationFeature.properties, lat, lon });
            return;
        }

        const bikeshareFeature = features.find(f => f.layer?.id === BIKESHARE_HITBOX_LAYER_ID);
        if (bikeshareFeature) {
            const [lon, lat] = bikeshareFeature.geometry.coordinates;
            setActivePoi(null);
            setActiveReport(null);
            setActiveAccident(null);
            setActiveTraffic(null);
            setActiveAirStation(null);
            setActiveStation({ ...bikeshareFeature.properties, lat, lon });
            return;
        }

        const poiFeature = features.find(f => f.layer?.id === POI_LAYER_ID);
        if (poiFeature) {
            const [lon, lat] = poiFeature.geometry.coordinates;
            setActiveReport(null);
            setActiveTraffic(null);
            setActiveAccident(null);
            setActiveAirStation(null);
            setActiveStation(null);
            setActivePoi({ ...poiFeature.properties, lat, lon });
            return;
        }

        const accidentFeature = features.find(f => f.layer?.id === ACCIDENT_POINT_LAYER_ID);
        if (accidentFeature) {
            const [lon, lat] = accidentFeature.geometry.coordinates;
            setActivePoi(null);
            setActiveReport(null);
            setActiveTraffic(null);
            setActiveAirStation(null);
            setActiveStation(null);
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
        setActiveAirStation(null);
        setActiveStation(null);
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

    const handleNavigateToStation = () => {
        if (!activeStation || !onNavigateToPoi) return;
        onNavigateToPoi({
            lat: activeStation.lat,
            lon: activeStation.lon,
            name: activeStation.name || 'Station de vélos',
        });
        trackEvent("bikeshare_navigated", {
            system: activeStation.system || 'inconnu',
            bikes: activeStation.bikes_available ?? 0,
        });
        setActiveStation(null);
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
            <div className="map-left-controls">
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

            {trafficShown && (
                <div className="map-traffic-control">
                    {showTraffic && (
                        <div className="traffic-legend">
                            <span className="traffic-legend-item"><span className="traffic-line-sample" style={{ backgroundColor: TRAFFIC_COLORS.green }} />Fluide</span>
                            <span className="traffic-legend-item"><span className="traffic-line-sample" style={{ backgroundColor: TRAFFIC_COLORS.orange }} />Dense</span>
                            <span className="traffic-legend-item"><span className="traffic-line-sample" style={{ backgroundColor: TRAFFIC_COLORS.red }} />Embouteillé</span>
                            <span className="traffic-legend-item"><span className="traffic-line-sample" style={{ backgroundColor: TRAFFIC_COLORS.gray }} />Inconnu</span>
                            {trafficError
                                ? <span className="traffic-legend-time">{trafficError}</span>
                                : trafficUpdatedAt && <span className="traffic-legend-time">Relevé de {trafficUpdatedAt}</span>}
                        </div>
                    )}
                    <Button
                        onClick={onToggleTraffic}
                        className="traffic-button"
                        title="Trafic en temps réel"
                    >
                        <MdOutlineTraffic size={18} />
                        <span className="map-btn-label">{showTraffic ? "Masquer le trafic" : "Trafic en temps réel"}</span>
                    </Button>
                </div>
            )}

            {!littleMap && (
                <div className="map-air-control">
                    {showAir && (
                        <div className="air-legend">
                            <div className="air-legend-head">
                                <span className="air-legend-title">Qualité de l'air</span>
                                <button
                                    type="button"
                                    className="air-info-btn"
                                    onClick={handleAirInfoToggle}
                                    title="Comment ça marche et d'où viennent les données"
                                    aria-label="Informations sur la qualité de l'air"
                                >
                                    <MdInfoOutline />
                                </button>
                            </div>
                            {airError ? (
                                <span className="air-legend-time">{airError}</span>
                            ) : activeAir?.summary?.aqi != null ? (
                                <>
                                    <span className="air-legend-index">
                                        <span
                                            className="air-legend-dot"
                                            style={{ backgroundColor: AIR_BAND_COLORS[activeAir.summary.band] || '#9ca3af' }}
                                        />
                                        Indice {activeAir.summary.aqi} · {activeAir.summary.label}
                                    </span>
                                    {activeAir.summary.dominant && (
                                        <span className="air-legend-sub">Polluant dominant : {activeAir.summary.dominant}</span>
                                    )}
                                    {airForecastWarning && (
                                        <span className="air-legend-sub">Dégradation prévue vers {airForecastWarning}</span>
                                    )}
                                    {airData.stale
                                        ? <span className="air-legend-time">Dernier relevé disponible{airUpdatedAt ? ` (${airUpdatedAt})` : ''}</span>
                                        : airUpdatedAt && <span className="air-legend-time">Relevé de {airUpdatedAt} · maille ~{airData.resolution_km || 11} km</span>}
                                </>
                            ) : (
                                <span className="air-legend-time">Chargement…</span>
                            )}
                        </div>
                    )}
                    <Button
                        onClick={handleAirToggle}
                        className="air-button"
                        title="Qualité de l'air"
                    >
                        <MdOutlineAir size={18} />
                        <span className="map-btn-label">{showAir ? "Masquer l'air" : "Qualité de l'air"}</span>
                    </Button>
                </div>
            )}

            {!littleMap && (
                <div className="map-lighting-control">
                    {isLightingMenuOpen && (
                        <div className="map-style-menu map-lighting-menu">
                            <div className="lighting-menu-head">
                                <div className="map-style-menu-title">Éclairage public</div>
                                <button
                                    type="button"
                                    className="lighting-info-btn"
                                    onClick={handleLightingInfoToggle}
                                    title="Comment ça marche et d'où viennent les données"
                                    aria-label="Informations sur l'éclairage"
                                >
                                    <MdInfoOutline />
                                </button>
                            </div>

                            <label className="map-poi-item">
                                <span className="map-poi-badge" style={{ backgroundColor: LIGHTING_LAMP_COLOR }} />
                                <span className="map-poi-label">Lampadaires</span>
                                <input
                                    type="checkbox"
                                    checked={showLighting}
                                    onChange={handleLightingToggle}
                                />
                            </label>

                            <label className="map-poi-item">
                                <span className="map-poi-badge" style={{ backgroundColor: LIT_ROADS_COLORS.osm }} />
                                <span className="map-poi-label">Rues éclairées</span>
                                <input
                                    type="checkbox"
                                    checked={showLitRoads}
                                    onChange={handleLitRoadsToggle}
                                />
                            </label>
                            {showLitRoads && (
                                <>
                                    <span className="lighting-legend-item">
                                        <span className="lighting-line-sample" style={{ backgroundColor: LIT_ROADS_COLORS.osm }} />
                                        Éclairage connu
                                    </span>
                                    <span className="lighting-legend-item">
                                        <span className="lighting-line-sample" style={{ backgroundColor: LIT_ROADS_COLORS.inferred }} />
                                        Éclairage déduit
                                    </span>
                                </>
                            )}
                        </div>
                    )}

                    <Button
                        type="button"
                        className="map-layer-toggle"
                        onClick={handleLightingButton}
                        title={lightingShown ? "Masquer l'éclairage" : "Éclairage public"}
                    >
                        <MdOutlineLightbulb size={18} />
                        <span className="map-btn-label">
                            {lightingShown ? "Masquer l'éclairage" : "Éclairage"}
                        </span>
                    </Button>
                </div>
            )}
            </div>

            <LightingInfoModal
                isOpen={isLightingInfoOpen}
                onClose={() => setIsLightingInfoOpen(false)}
                sources={lightingSources}
            />

            <AirQualityInfoModal
                isOpen={isAirInfoOpen}
                onClose={() => setIsAirInfoOpen(false)}
                resolutionKm={airData?.resolution_km || 11}
            />

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

                            <div className="map-style-menu-title map-poi-section">Vélos en libre-service</div>
                            <label className="map-poi-item">
                                {/* Bleu nuit comme le disque sur la carte : la
                                    pastille du menu doit désigner la couche, pas
                                    l'un de ses états. */}
                                <span className="map-poi-badge" style={{ backgroundColor: BIKESHARE_NAVY }} />
                                <span className="map-poi-label">Stations de vélos</span>
                                <input
                                    type="checkbox"
                                    checked={showBikeshare}
                                    onChange={handleBikeshareToggle}
                                />
                            </label>
                            {showBikeshare && (
                                <>
                                    {bikeshareError
                                        ? <div className="map-poi-hint">{bikeshareError}</div>
                                        : bikeshareData?.stale
                                            ? <div className="map-poi-hint">Dernier relevé disponible.</div>
                                            : bikeshareUpdatedAt && (
                                                <div className="map-poi-hint">Relevé de {bikeshareUpdatedAt}</div>
                                            )}
                                    {bikeshareSources && (
                                        <div className="map-poi-hint map-poi-source">{bikeshareSources}</div>
                                    )}
                                </>
                            )}

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
                    ...(showTraffic ? [TRAFFIC_HITBOX_LAYER_ID] : []),
                    ...(showAirStations ? [AIR_STATION_CIRCLE_LAYER_ID] : []),
                    ...(showBikeshareLayer ? [BIKESHARE_HITBOX_LAYER_ID] : []),
                ]}
                onClick={onClick}
                onMouseMove={onHover}
                onContextMenu={littleMap ? undefined : onContextMenu}
                onMoveStart={closeContextMenu}
                onMoveEnd={littleMap ? undefined : (e) => {
                    const c = e.viewState;
                    setMapCenter({ lat: c.latitude, lon: c.longitude });
                    try {
                        localStorage.setItem('userMapLastView', JSON.stringify({
                            longitude: c.longitude, latitude: c.latitude, zoom: c.zoom
                        }));
                    } catch {
                    }
                }}
                onLoad={(e) => {
                    setIsMapLoaded(true);
                    const c = e.target.getCenter();
                    setMapCenter({ lat: c.lat, lon: c.lng });
                }}
                style={{ width: '100%', height: '100%' }}
            >
                <NavigationControl position="top-right" />

                {showAirLayer && (
                    <Source id="air-quality" type="geojson" data={airGeoJSON}>
                        <Layer
                            id={AIR_LAYER_ID}
                            type="fill"
                            paint={{
                                'fill-color': AIR_FILL_COLOR,
                                'fill-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.32, 13, 0.22, 16, 0.14],
                            }}
                        />
                        <Layer
                            id={AIR_OUTLINE_LAYER_ID}
                            type="line"
                            paint={{
                                'line-color': AIR_FILL_COLOR,
                                'line-width': 1,
                                'line-opacity': 0.4,
                            }}
                        />
                    </Source>
                )}

                {showAirStations && (
                    <Source id="air-stations" type="geojson" data={airStationsGeoJSON}>
                        <Layer
                            id={AIR_STATION_CIRCLE_LAYER_ID}
                            type="circle"
                            paint={{
                                'circle-color': ['get', 'color'],
                                'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 6, 14, 9, 18, 13],
                                'circle-stroke-color': '#ffffff',
                                'circle-stroke-width': 2,
                                'circle-opacity': 0.95,
                            }}
                        />
                    </Source>
                )}

                {userPosition && (
                    <Marker longitude={userPosition.lon} latitude={userPosition.lat} anchor="center">
                        <div className="user-position-dot" />
                    </Marker>
                )}

                {showTraffic && trafficGeoJSON.features.length > 0 && (
                    <Source id="traffic" type="geojson" data={trafficGeoJSON}>
                        <Layer id={TRAFFIC_HITBOX_LAYER_ID} type="line" minzoom={9} paint={{ 'line-color': 'transparent', 'line-width': 14 }} />
                        <Layer
                            id={TRAFFIC_LAYER_ID}
                            type="line"
                            minzoom={9}
                            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                            paint={{
                                'line-color': ['match', ['get', 'level'],
                                    'red', TRAFFIC_COLORS.red,
                                    'orange', TRAFFIC_COLORS.orange,
                                    'green', TRAFFIC_COLORS.green,
                                    TRAFFIC_COLORS.gray],
                                'line-width': ['interpolate', ['linear'], ['zoom'],
                                    9, ['match', ['get', 'level'], 'red', 2, 'orange', 1.8, 1],
                                    11, ['match', ['get', 'level'], 'red', 3, 'orange', 2.5, 1.5],
                                    16, ['match', ['get', 'level'], 'red', 8, 'orange', 7, 4]],
                                'line-opacity': ['interpolate', ['linear'], ['zoom'],
                                    9, ['match', ['get', 'level'], 'red', 0.9, 'orange', 0.9, 'gray', 0.12, 0.3],
                                    12, ['match', ['get', 'level'], 'gray', 0.35, 0.85]],
                            }}
                        />
                    </Source>
                )}

                {showLightingLayer && (
                    <Source id="lighting" type="geojson" data={lightingData}>
                        <Layer
                            id={LIGHTING_HEAT_LAYER_ID}
                            type="heatmap"
                            paint={LIGHTING_HEATMAP_PAINT}
                        />
                    </Source>
                )}

                {showLitRoadsLayer && (
                    <Source id="lit-roads" type="geojson" data={litRoadsData}>
                        <Layer
                            id={LIT_ROADS_GLOW_LAYER_ID}
                            type="line"
                            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                            paint={{
                                'line-color': LIT_ROADS_COLOR,
                                'line-width': ['interpolate', ['exponential', 2], ['zoom'], 11, 4, 15, 5.3, 19, 85, 22, 680],
                                'line-blur': ['interpolate', ['exponential', 2], ['zoom'], 11, 2, 15, 3, 19, 48, 22, 384],
                                'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.12, 14, 0.3],
                            }}
                        />
                        <Layer
                            id={LIT_ROADS_LINE_LAYER_ID}
                            type="line"
                            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                            paint={{
                                'line-color': LIT_ROADS_COLOR,
                                'line-width': ['interpolate', ['exponential', 2], ['zoom'], 11, 1.5, 15, 2.7, 19, 43, 22, 344],
                                'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.5, 14, 0.85],
                            }}
                        />
                    </Source>
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

                {showBikeshareLayer && (
                    <Source id="bikeshare" type="geojson" data={bikeshareGeoJSON}>
                        <Layer
                            id={BIKESHARE_HITBOX_LAYER_ID}
                            type="circle"
                            minzoom={10}
                            paint={{
                                'circle-color': 'transparent',
                                'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 9, 12, 12, 14, 16, 16, 19, 18, 22],
                            }}
                        />
                        <Layer
                            id={BIKESHARE_ICON_LAYER_ID}
                            type="symbol"
                            minzoom={10}
                            layout={{
                                'icon-image': BIKESHARE_ICON_IMAGE,
                                'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.35, 12, 0.56, 14, 0.81, 16, 1, 18, 1.19],
                                'icon-allow-overlap': true,
                                'icon-ignore-placement': true,
                            }}
                            paint={{
                                'icon-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 13, 0.85, 15, 1],
                            }}
                        />
                        <Layer
                            id={BIKESHARE_BADGE_LAYER_ID}
                            type="symbol"
                            minzoom={10}
                            filter={BIKESHARE_HAS_BADGE}
                            layout={{
                                'icon-image': BIKESHARE_BADGE_IMAGE,
                                'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.19, 12.99, 0.38, 13, 0.64, 16, 0.86, 18, 1],
                                'text-field': ['step', ['zoom'], '', 13, ['to-string', BIKESHARE_BIKES]],
                                'text-size': ['interpolate', ['linear'], ['zoom'], 13, 9, 16, 11, 18, 12],
                                'icon-allow-overlap': ['step', ['zoom'], true, 13, false],
                                'icon-ignore-placement': ['step', ['zoom'], true, 13, false],
                            }}
                            paint={{
                                'icon-translate': BIKESHARE_BADGE_TRANSLATE,
                                'text-translate': BIKESHARE_BADGE_TRANSLATE,
                                'text-color': '#ffffff',
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
                                <span className="map-popup-title">{TRAFFIC_LABELS[activeTraffic.level] || "État inconnu"}</span>
                            </div>
                            <div className="map-popup-body">
                                {activeTraffic.commune && <p className="map-popup-line">📍 <strong>{activeTraffic.commune}</strong></p>}
                                {TRAFFIC_CYCLIST_HINT[activeTraffic.level] && (
                                    <p className="map-popup-line">{TRAFFIC_CYCLIST_HINT[activeTraffic.level]}</p>
                                )}
                                {trafficUpdatedAt && <p className="map-popup-line map-popup-muted">Relevé {trafficUpdatedAt}</p>}
                            </div>
                        </div>
                    </Popup>
                )}

                {activeAirStation && (
                    <Popup
                        longitude={activeAirStation.lon}
                        latitude={activeAirStation.lat}
                        onClose={() => setActiveAirStation(null)}
                        closeOnClick={false}
                        anchor="bottom"
                        offset={[0, -10]}
                    >
                        <div className="map-popup">
                            <div
                                className="map-popup-header"
                                style={{ backgroundColor: activeAirStation.color || '#9ca3af' }}
                            >
                                <span className="map-popup-icon">🌬️</span>
                                <span className="map-popup-title">AQI {activeAirStation.aqi} · {activeAirStation.label}</span>
                            </div>
                            <div className="map-popup-body">
                                {activeAirStation.name && <p className="map-popup-line">📍 <strong>{activeAirStation.name}</strong></p>}
                                <p className="map-popup-line map-popup-muted">Capteur au sol · échelle AQI US</p>
                                {activeAirStation.time && <p className="map-popup-line map-popup-muted">Relevé {activeAirStation.time}</p>}
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

                {activeStation && (
                    <Popup
                        longitude={activeStation.lon}
                        latitude={activeStation.lat}
                        onClose={() => setActiveStation(null)}
                        closeOnClick={false}
                        anchor="bottom"
                        offset={[0, -12]}
                    >
                        {(() => {
                            const isOff = activeStation.is_renting === false || activeStation.is_installed === false;
                            const bikes = activeStation.bikes_available;
                            const headerColor = isOff ? BIKESHARE_COLORS.off
                                : bikes == null ? BIKESHARE_COLORS.off
                                    : bikes === 0 ? BIKESHARE_COLORS.empty
                                        : activeStation.docks_available === 0 ? BIKESHARE_COLORS.full
                                            : bikes <= 2 ? BIKESHARE_COLORS.low
                                                : BIKESHARE_COLORS.ok;
                            const present = (key) => activeStation[key] !== undefined
                                && activeStation[key] !== null && activeStation[key] !== '';
                            const ventile = present('bikes_mechanical') || present('bikes_electric');
                            const counts = (ventile
                                ? BIKESHARE_COUNT_FIELDS
                                : [BIKESHARE_TOTAL_FIELD, BIKESHARE_COUNT_FIELDS[2]]
                            ).filter(f => present(f.key));
                            const parts = bikeshareShare(activeStation, ventile);
                            const details = BIKESHARE_DETAIL_FIELDS.filter(f => present(f.key));
                            const freshness = formatStationFreshness(activeStation.last_reported);
                            return (
                                <div className="map-popup">
                                    <div className="map-popup-header" style={{ backgroundColor: headerColor }}>
                                        {BIKESHARE_LOGOS[activeStation.system]
                                            ? (
                                                <span className="map-popup-logo">
                                                    <img
                                                        src={BIKESHARE_LOGOS[activeStation.system]}
                                                        alt={activeStation.system_name || 'Réseau'}
                                                    />
                                                </span>
                                            )
                                            : <FaBicycle className="map-popup-icon" aria-hidden="true" />}
                                        <span className="map-popup-header-text">
                                            <span className="map-popup-title">{activeStation.name || 'Station de vélos'}</span>
                                            <span className="map-popup-subtitle">
                                                {isOff
                                                    ? 'Station hors service'
                                                    : bikes == null
                                                        ? 'Disponibilité inconnue'
                                                        : `${bikes} vélo${bikes > 1 ? 's' : ''} disponible${bikes > 1 ? 's' : ''}`}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="map-popup-body">
                                        {counts.length > 0 && (
                                            <div className={`bikeshare-counts ${isOff ? 'bikeshare-counts-off' : ''}`}>
                                                {counts.map(field => (
                                                    <span
                                                        key={field.key}
                                                        className={`bikeshare-count bikeshare-tone-${field.tone}`}
                                                    >
                                                        <span className="bikeshare-count-top">
                                                            <field.Icon className="bikeshare-count-icon" aria-hidden="true" />
                                                            <span className="bikeshare-count-value">{activeStation[field.key]}</span>
                                                        </span>
                                                        <span className="bikeshare-count-label">{field.label}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {parts && !isOff && (
                                            <>
                                                <div
                                                    className="bikeshare-bar"
                                                    title={`${parts.mecha + parts.elec + parts.autres} vélo(s), `
                                                        + `${parts.docks} place(s) libre(s)`
                                                        + (parts.indispo ? `, ${parts.indispo} indisponible(s)` : '')
                                                        + ` — ${parts.total} points d'attache`}
                                                >
                                                    {[
                                                        ['mechanical', parts.mecha],
                                                        ['electric', parts.elec],
                                                        ['mechanical', parts.autres],
                                                        ['docks', parts.docks],
                                                        ['indispo', parts.indispo],
                                                    ].map(([tone, part], index) => part > 0 && (
                                                        <span
                                                            key={index}
                                                            className={`bikeshare-bar-part bikeshare-tone-${tone}`}
                                                            style={{ flexGrow: part }}
                                                        />
                                                    ))}
                                                </div>
                                                {parts.indispoNotable && (
                                                    <p className="map-popup-warning">
                                                        {`${parts.indispo} points d'attache indisponibles.`}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                        {isOff && <p className="map-popup-warning">Ni retrait ni retour possible.</p>}
                                        {!isOff && activeStation.is_returning === false && (
                                            <p className="map-popup-warning">Retour de vélo impossible.</p>
                                        )}
                                        {!isOff && activeStation.is_returning !== false && activeStation.docks_available === 0 && (
                                            <p className="map-popup-warning">Station pleine : aucun retour possible.</p>
                                        )}
                                        {details.map(field => (
                                            <p key={field.key} className="map-popup-detail">
                                                {field.label} : <strong>{(field.format || String)(activeStation[field.key])}</strong>
                                            </p>
                                        ))}
                                        {activeStation.stale && (
                                            <p className="map-popup-meta">Dernier relevé disponible, données non rafraîchies.</p>
                                        )}
                                        {freshness && <p className="map-popup-meta">{freshness}</p>}
                                    </div>
                                    {onNavigateToPoi && (
                                        <div className="map-popup-footer">
                                            <Button type="button" onClick={handleNavigateToStation}>
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
