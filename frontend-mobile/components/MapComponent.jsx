import { useRef, useState, useEffect, useMemo, use } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, Text, Image, Animated, Dimensions, Alert, KeyboardAvoidingView, Platform, TextInput, Switch, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Map, Camera, ViewAnnotation, GeoJSONSource, Layer, Images, NativeUserLocation } from '@maplibre/maplibre-react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import ReportAbuseModal from './ReportAbuseModal';
import { getReports, getPois, getAccidents, getTraffic, getAirQuality, getWeather, getBikeshareStations, getLitRoads, getStreetlightSources, createReport, deleteReport, voteReport, reportAbuse, blockReportAuthor } from '../services/apiBack';
import {
    pointForCenter, weatherSummary, rainBanner,
    snapshotAgeMin, isHintUsable, freshSteps, STALE_AGE_MIN,
} from '../services/weather';
import WeatherPill from './WeatherPill';
import WeatherDetailModal from './WeatherDetailModal';
import useWeatherAlerts from '../hooks/useWeatherAlerts';
import WeatherAlert from './WeatherAlert';
import { useAuth } from '../context/AuthContext';
import { useFormat } from '../hooks/useFormat';
import { useTheme } from '../hooks/useTheme';
import { withAlpha } from '../constants/theme';
import { useDragToDismiss } from '../hooks/useDragToDismiss';
import useHazardAlerts from '../hooks/useHazardAlerts';
import HazardAlert from './HazardAlert';
import { GrabHandle } from './ui/GrabHandle';
import { GestureHandlerRootView, GestureDetector } from 'react-native-gesture-handler';
import Reanimated from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { trackEvent } from '../services/analytics';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Trans, useTranslation } from 'react-i18next';

// Les tables ne portent plus que leur identifiant : un libellé posé au niveau
// module serait figé à la langue du chargement du bundle. Les mots vivent dans
// i18n/locales/*/carte.json, sous les mêmes identifiants que le web et que
// l'API — un grep sur « stands » traverse les trois.
const PARKING_TYPES = [
    { id: 'stands', color: '#22C55E' },
    { id: 'racks', color: '#0D9488' },
    { id: 'shelter', color: '#15803D' },
    { id: 'other', color: '#9CA3AF' },
];

const TOILET_TYPES = [
    { id: 'free', color: '#EC4899' },
    { id: 'paid', color: '#9F1239' },
    { id: 'unknown', color: '#8B5CF6' },
];

const REPAIR_TYPES = [
    { id: 'selfservice', color: '#F97316' },
    { id: 'shop', color: '#C2410C' },
];

const POI_CATEGORIES = [
    { id: 'water', icon: 'water', color: '#0EA5E9' },
    { id: 'toilets', icon: 'toilet', color: '#8B5CF6', subTypes: TOILET_TYPES, subTypeProp: 'toilet_fee', sousCle: 'toilettes' },
    { id: 'parking', icon: 'bicycle', color: '#22C55E', subTypes: PARKING_TYPES, subTypeProp: 'parking_type', sousCle: 'parking' },
    { id: 'repair', icon: 'wrench', color: '#F97316', subTypes: REPAIR_TYPES, subTypeProp: 'repair_kind', sousCle: 'reparation' },
];

const DEFAULT_SUB_TYPES = Object.fromEntries(
    POI_CATEGORIES.filter(c => c.subTypes).map(c => [c.id, Object.fromEntries(c.subTypes.map(t => [t.id, true]))])
);

const mergeSubTypes = (saved) => Object.fromEntries(
    Object.entries(DEFAULT_SUB_TYPES).map(([cat, defaults]) => [cat, { ...defaults, ...(saved?.[cat] || {}) }])
);

const POI_IMAGES = {
    'poi-water': require('../assets/poi/water.png'),
    'poi-toilets-free': require('../assets/poi/toilets-free.png'),
    'poi-toilets-paid': require('../assets/poi/toilets-paid.png'),
    'poi-toilets-unknown': require('../assets/poi/toilets-unknown.png'),
    'poi-parking-stands': require('../assets/poi/parking-stands.png'),
    'poi-parking-racks': require('../assets/poi/parking-racks.png'),
    'poi-parking-shelter': require('../assets/poi/parking-shelter.png'),
    'poi-parking-other': require('../assets/poi/parking-other.png'),
    'poi-repair-selfservice': require('../assets/poi/repair-selfservice.png'),
    'poi-repair-shop': require('../assets/poi/repair-shop.png'),
    'poi-water-off': require('../assets/poi/water-off.png'),
    'poi-toilets-free-off': require('../assets/poi/toilets-free-off.png'),
    'poi-toilets-paid-off': require('../assets/poi/toilets-paid-off.png'),
    'poi-toilets-unknown-off': require('../assets/poi/toilets-unknown-off.png'),
    'poi-parking-stands-off': require('../assets/poi/parking-stands-off.png'),
    'poi-parking-racks-off': require('../assets/poi/parking-racks-off.png'),
    'poi-parking-shelter-off': require('../assets/poi/parking-shelter-off.png'),
    'poi-parking-other-off': require('../assets/poi/parking-other-off.png'),
    'poi-repair-selfservice-off': require('../assets/poi/repair-selfservice-off.png'),
    'poi-repair-shop-off': require('../assets/poi/repair-shop-off.png'),
    'poi-water-customers': require('../assets/poi/water-customers.png'),
    'poi-toilets-free-customers': require('../assets/poi/toilets-free-customers.png'),
    'poi-toilets-paid-customers': require('../assets/poi/toilets-paid-customers.png'),
    'poi-toilets-unknown-customers': require('../assets/poi/toilets-unknown-customers.png'),
    'poi-parking-stands-customers': require('../assets/poi/parking-stands-customers.png'),
    'poi-parking-racks-customers': require('../assets/poi/parking-racks-customers.png'),
    'poi-parking-shelter-customers': require('../assets/poi/parking-shelter-customers.png'),
    'poi-parking-other-customers': require('../assets/poi/parking-other-customers.png'),
    'poi-repair-selfservice-customers': require('../assets/poi/repair-selfservice-customers.png'),
    'poi-repair-shop-customers': require('../assets/poi/repair-shop-customers.png'),
    'poi-parking-stands-covered': require('../assets/poi/parking-stands-covered.png'),
    'poi-parking-racks-covered': require('../assets/poi/parking-racks-covered.png'),
    'poi-parking-other-covered': require('../assets/poi/parking-other-covered.png'),
    'poi-parking-stands-covered-off': require('../assets/poi/parking-stands-covered-off.png'),
    'poi-parking-racks-covered-off': require('../assets/poi/parking-racks-covered-off.png'),
    'poi-parking-other-covered-off': require('../assets/poi/parking-other-covered-off.png'),
    'poi-parking-stands-covered-customers': require('../assets/poi/parking-stands-covered-customers.png'),
    'poi-parking-racks-covered-customers': require('../assets/poi/parking-racks-covered-customers.png'),
    'poi-parking-other-covered-customers': require('../assets/poi/parking-other-covered-customers.png'),
    'poi-toilets-paid-paid': require('../assets/poi/toilets-paid-paid.png'),
    'poi-water-paid': require('../assets/poi/water-paid.png'),
    'poi-parking-stands-paid': require('../assets/poi/parking-stands-paid.png'),
    'poi-parking-racks-paid': require('../assets/poi/parking-racks-paid.png'),
    'poi-parking-shelter-paid': require('../assets/poi/parking-shelter-paid.png'),
    'poi-parking-other-paid': require('../assets/poi/parking-other-paid.png'),
    'poi-parking-stands-covered-paid': require('../assets/poi/parking-stands-covered-paid.png'),
    'poi-parking-racks-covered-paid': require('../assets/poi/parking-racks-covered-paid.png'),
    'poi-parking-other-covered-paid': require('../assets/poi/parking-other-covered-paid.png'),
    'poi-repair-selfservice-paid': require('../assets/poi/repair-selfservice-paid.png'),
    'poi-repair-shop-paid': require('../assets/poi/repair-shop-paid.png'),
};

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
const poiAccentColor = (poi, base) => (isPoiUnavailable(poi) ? OFF_COLOR : isPoiCustomers(poi) ? CUSTOMERS_COLOR : base);

const REPORT_IMAGES = {
    'report-accident': require('../assets/reports/accident.png'),
    'report-travaux': require('../assets/reports/travaux.png'),
    'report-danger': require('../assets/reports/danger.png'),
    'report-obstacle': require('../assets/reports/obstacle.png'),
};

// Générées par `Documentation/gen-bikeshare-icons.js`, mêmes fichiers que le web.
const BIKESHARE_IMAGES = {
    'bikeshare-unknown': require('../assets/bikeshare/bikeshare-unknown.png'),
    'bikeshare-off': require('../assets/bikeshare/bikeshare-off.png'),
    'bikeshare-0': require('../assets/bikeshare/bikeshare-0.png'),
    'bikeshare-1': require('../assets/bikeshare/bikeshare-1.png'),
    'bikeshare-2': require('../assets/bikeshare/bikeshare-2.png'),
    'bikeshare-3': require('../assets/bikeshare/bikeshare-3.png'),
    'bikeshare-badge-empty': require('../assets/bikeshare/bikeshare-badge-empty.png'),
    'bikeshare-badge-low': require('../assets/bikeshare/bikeshare-badge-low.png'),
    'bikeshare-badge-ok': require('../assets/bikeshare/bikeshare-badge-ok.png'),
    'bikeshare-badge-full': require('../assets/bikeshare/bikeshare-badge-full.png'),
};

const BIKESHARE_LOGOS = {
    'bordeaux-tbm': require('../assets/bikeshare/logos/bordeaux-tbm.png'),
    'paris-velib': require('../assets/bikeshare/logos/paris-velib.png'),
    'lille-vlille': require('../assets/bikeshare/logos/lille-vlille.png'),
    'rennes-velostar': require('../assets/bikeshare/logos/rennes-velostar.png'),
    'nantes-naolib': require('../assets/bikeshare/logos/nantes-naolib.png'),
    'lyon-velov': require('../assets/bikeshare/logos/lyon-velov.png'),
    'strasbourg-velhop': require('../assets/bikeshare/logos/strasbourg-velhop.png'),
    'bruxelles-villo': require('../assets/bikeshare/logos/bruxelles-villo.png'),
    'be-bluebike': require('../assets/bikeshare/logos/be-bluebike.png'),
};

// `format` rend une CLÉ de catalogue quand la valeur est un identifiant connu,
// et la valeur brute sinon : la traduction se fait au rendu, où t() existe.
const POI_DETAIL_FIELDS = [
    {
        key: 'parking_type',
        format: (value) => (PARKING_TYPES.some(p => p.id === value) ? `carte.parking.${value}` : value),
    },
    {
        key: 'toilet_fee',
        format: (value) => (['free', 'paid', 'unknown'].includes(value) ? `carte.tarif.${value}` : value),
    },
    {
        key: 'repair_kind',
        format: (value) => (REPAIR_TYPES.some(r => r.id === value) ? `carte.reparation.${value}` : value),
    },
    { key: 'opening_hours' },
    { key: 'fee', except: 'toilets' },
    { key: 'capacity' },
    { key: 'covered' },
    { key: 'access' },
    { key: 'wheelchair' },
    { key: 'seasonal' },
];

// Rend une clé pour les deux valeurs booléennes d'OpenStreetMap, la valeur
// brute sinon (horaires, capacité : ce sont des données, pas des mots).
const formatPoiTag = (value) => {
    if (value === 'yes') return 'carte.ui.carte.oui';
    if (value === 'no') return 'carte.ui.carte.non';
    return String(value);
};

const EMPTY_FEATURE_COLLECTION = { type: 'FeatureCollection', features: [] };

const ACCIDENT_SWITCH_ZOOM = 13.5;

const ACCIDENT_SEVERITY_COLOR = [
    'match', ['get', 'severity'],
    10, '#7f1d1d',
    3, '#dc2626',
    1, '#f97316',
    '#fbbf24',
];

const ACCIDENT_LEGEND = [
    { id: 'mortel', color: '#7f1d1d' },
    { id: 'hospitalise', color: '#dc2626' },
    { id: 'leger', color: '#f97316' },
];

const LIT_ROADS_COLOR = ['match', ['get', 'lit_source'],
    'inferred', '#ffe39a',
    '#ffcf3d'];

const ACCIDENT_DETAIL_FIELDS = [
    { key: 'light' },
    { key: 'weather' },
    { key: 'collision' },
    { key: 'road_type' },
    { key: 'intersection' },
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

const TRAFFIC_COLORS = { green: '#22c55e', orange: '#f97316', red: '#ef4444', gray: '#9ca3af' };

// Résumé de la zone où se trouve l'utilisateur.
function airForPoint(airData, point) {
    const zones = airData?.zones;
    if (!Array.isArray(zones) || zones.length === 0) return airData || null;
    if (zones.length === 1 || !point) return zones[0];

    const inside = zones.find(({ bbox }) => Array.isArray(bbox)
        && point.lon >= bbox[0] && point.lon <= bbox[2]
        && point.lat >= bbox[1] && point.lat <= bbox[3]);
    if (inside) return inside;

    let best = zones[0];
    let bestDistance = Infinity;
    for (const zone of zones) {
        if (!Array.isArray(zone.bbox)) continue;
        const [w, s, e, n] = zone.bbox;
        const dLon = Math.max(w - point.lon, 0, point.lon - e)
            * Math.cos((point.lat * Math.PI) / 180);
        const dLat = Math.max(s - point.lat, 0, point.lat - n);
        const distance = Math.hypot(dLon, dLat);
        if (distance < bestDistance) {
            best = zone;
            bestDistance = distance;
        }
    }
    return best;
}

const AIR_BAND_COLORS = {
    good: '#50f0e6', fair: '#50ccaa', moderate: '#f0e641',
    poor: '#ff5050', very_poor: '#960032', extreme: '#7d2181',
};

const AIR_FILL_COLOR = ['match', ['get', 'band'],
    'good', AIR_BAND_COLORS.good,
    'fair', AIR_BAND_COLORS.fair,
    'moderate', AIR_BAND_COLORS.moderate,
    'poor', AIR_BAND_COLORS.poor,
    'very_poor', AIR_BAND_COLORS.very_poor,
    'extreme', AIR_BAND_COLORS.extreme,
    '#9ca3af'];

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

const bikeshareAccentColor = (station) => {
    if (!station) return BIKESHARE_COLORS.off;
    if (station.is_renting === false || station.is_installed === false) return BIKESHARE_COLORS.off;
    const bikes = station.bikes_available;
    if (bikes == null) return BIKESHARE_COLORS.off;
    if (bikes === 0) return BIKESHARE_COLORS.empty;
    if (station.docks_available === 0) return BIKESHARE_COLORS.full;
    return bikes <= 2 ? BIKESHARE_COLORS.low : BIKESHARE_COLORS.ok;
};

const BIKESHARE_TONES = {
    light: { mechanical: '#312E81', electric: '#0E7490', docks: '#475569', indispo: '#CBD5E1' },
    dark: { mechanical: '#A5B4FC', electric: '#67E8F9', docks: '#CBD5E1', indispo: '#4B5563' },
};

const BIKESHARE_COUNT_FIELDS = [
    { key: 'bikes_mechanical', icon: 'bicycle', tone: 'mechanical' },
    { key: 'bikes_electric', icon: 'bicycle-electric', tone: 'electric' },
    { key: 'docks_available', icon: 'parking', tone: 'docks' },
];

const BIKESHARE_TOTAL_FIELD = {
    key: 'bikes_available', icon: 'bicycle', tone: 'mechanical',
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

function MapButtonFrost() {
    const { colors, isDark } = useTheme();
    if (Platform.OS !== 'ios') return null;
    return (
        <View style={styles.mapButtonFrost}>
            <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bgSurface, opacity: 0.22 }]} />
        </View>
    );
}

export default function MapComponent({
    start, end, itineraires, selectedItineraire,
    setSelectedItineraire, currentPosition, isNavigating,
    canReport, onNavigateToPoi, miniMap = false, bottomInset = 0, hideControls = false,
    cameraPadding = { top: 200, right: 80, bottom: 200, left: 80 }
}) {
    const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY;
    if (!MAPTILER_KEY) {
        console.warn("⚠️ EXPO_PUBLIC_MAPTILER_KEY n'est pas défini ! Assurez-vous de l'avoir dans votre .env");
    }

    const { colors, typography, isDark } = useTheme();
    const { t } = useTranslation();
    const f = useFormat();

    const androidButtonBg = Platform.OS === 'android'
        ? { backgroundColor: withAlpha(colors.bgSurface, 0.9) }
        : null;
    const { token, user } = useAuth();

    const MAP_STYLES = [
        { id: "streets", lightId: "streets-v4", darkId: "streets-v4-dark", icon: "🛣️" },
        { id: "base", lightId: "base-v4", darkId: "base-v4-dark", icon: "🍃" },
        { id: "outdoor", lightId: "outdoor-v4", darkId: "outdoor-v4-dark", icon: "🚴" },
        { id: "hybrid", lightId: "hybrid-v4", darkId: "hybrid-v4", icon: "🛰️" },
    ];

    const REPORT_TYPES = [
        { id: 'accident' },
        { id: 'travaux' },
        { id: 'danger' },
        { id: 'obstacle' },
    ];

    const [activeBaseStyle, setActiveBaseStyle] = useState(MAP_STYLES[0].id);
    const [mapThemeMode, setMapThemeMode] = useState("auto");
    const [isLayerMenuVisible, setLayerMenuVisible] = useState(false);
    const [isReportMenuVisible, setIsReportMenuVisible] = useState(false);
    const [selectedReportType, setSelectedReportType] = useState(null);
    const [reportDescription, setReportDescription] = useState("");
    const [reports, setReports] = useState([]);
    const [activeReport, setActiveReport] = useState(null);
    const [abuseTarget, setAbuseTarget] = useState(null);
    const [abuseStatus, setAbuseStatus] = useState(null);
    const [isPoiSheetVisible, setPoiSheetVisible] = useState(false);
    const [enabledPoiCats, setEnabledPoiCats] = useState({});
    const [enabledSubTypes, setEnabledSubTypes] = useState(DEFAULT_SUB_TYPES);
    const poiCacheRef = useRef({});
    const [poiData, setPoiData] = useState({});
    const [activePoi, setActivePoi] = useState(null);
    const [showAccidents, setShowAccidents] = useState(false);
    const [accidentData, setAccidentData] = useState(null);
    const [activeAccident, setActiveAccident] = useState(null);
    const accidentCacheRef = useRef(false);
    const [showTraffic, setShowTraffic] = useState(false);
    const [traffic, setTraffic] = useState(null);
    const [showAir, setShowAir] = useState(false);
    const [airData, setAirData] = useState(null);
    const [isAirInfoVisible, setAirInfoVisible] = useState(false);
    const [weatherData, setWeatherData] = useState(null);
    const [isWeatherInfoVisible, setWeatherInfoVisible] = useState(false);
    const [isWeatherDetailVisible, setWeatherDetailVisible] = useState(false);
    const [activeAirStation, setActiveAirStation] = useState(null);
    const [showBikeshare, setShowBikeshare] = useState(false);
    const [bikeshareData, setBikeshareData] = useState(null);
    const [activeStation, setActiveStation] = useState(null);
    const [showLitRoads, setShowLitRoads] = useState(false);
    const [litRoadsData, setLitRoadsData] = useState(null);
    const litRoadsCacheRef = useRef(false);
    const [isLightingInfoVisible, setLightingInfoVisible] = useState(false);
    const [lightingSources, setLightingSources] = useState(null);
    const lightingSourcesRef = useRef(false);
    const [mapHeight, setMapHeight] = useState(0);
    const [recenterTrigger, setRecenterTrigger] = useState(0);
    const [hasCenteredOnce, setHasCenteredOnce] = useState(false);
    const SPEED_THRESHOLD = 1.5; const lastHeadingRef = useRef(0);
    const bearingRef = useRef(0);
    const isNavigatingRef = useRef(isNavigating);
    const lastUpdateRef = useRef(0);
    const speedRef = useRef(0);
    const navigationStartTimeRef = useRef(null);

    const mapStyleUrl = useMemo(() => {
        const resolvedTheme = mapThemeMode === "auto" ? (isDark ? "dark" : "light") : mapThemeMode;
        const styleConfig = MAP_STYLES.find(s => s.id === activeBaseStyle) || MAP_STYLES[0];
        const styleIdToUse = resolvedTheme === "dark" ? styleConfig.darkId : styleConfig.lightId;
        return `https://api.maptiler.com/maps/${styleIdToUse}/style.json?key=${MAPTILER_KEY}`;
    }, [activeBaseStyle, mapThemeMode, isDark, MAPTILER_KEY]);

    useEffect(() => {
        isNavigatingRef.current = isNavigating;
    }, [isNavigating]);

    useEffect(() => {
        isNavigatingRef.current = isNavigating;
        if (isNavigating) {
            navigationStartTimeRef.current = Date.now();
        }
    }, [isNavigating]);

    useEffect(() => {
        let headingSubscription;
        let locationSubscription;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            headingSubscription = await Location.watchHeadingAsync((headingObj) => {
                if (!headingObj?.magHeading) return;
                if (!isNavigatingRef.current) return;
                if (speedRef.current >= SPEED_THRESHOLD) return;
                const timeSinceStart = Date.now() - (navigationStartTimeRef.current || 0);
                if (timeSinceStart < 800) return;

                const newHeading = Math.round(headingObj.magHeading);
                const diff = Math.abs(newHeading - lastHeadingRef.current);
                const normalizedDiff = diff > 180 ? 360 - diff : diff;

                if (normalizedDiff < 3) return;

                lastHeadingRef.current = newHeading;
                bearingRef.current = newHeading;

                cameraRef.current?.easeTo({
                    bearing: newHeading,
                    duration: 200,
                    easing: "linear",
                });
            });
            locationSubscription = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.Highest, timeInterval: 1000, distanceInterval: 2 },
                (location) => {
                    const speed = location.coords.speed || 0;
                    const gpsHeading = location.coords.heading;
                    speedRef.current = speed;

                    if (speed >= SPEED_THRESHOLD && gpsHeading >= 0 && isNavigatingRef.current) {
                        const timeSinceStart = Date.now() - (navigationStartTimeRef.current || 0);
                        if (timeSinceStart < 800) return;
                        const newBearing = Math.round(gpsHeading);
                        const diff = Math.abs(newBearing - bearingRef.current);
                        const normalizedDiff = diff > 180 ? 360 - diff : diff;

                        if (normalizedDiff < 5) return;

                        bearingRef.current = newBearing;
                        cameraRef.current?.easeTo({
                            bearing: newBearing,
                            duration: 500,
                            easing: "linear",
                        });
                    }
                }
            );
        })();

        return () => {
            if (headingSubscription) headingSubscription.remove();
            if (locationSubscription) locationSubscription.remove();
        };
    }, []);

    useEffect(() => {
        if (currentPosition && !hasCenteredOnce && cameraRef.current) {
            cameraRef.current.flyTo({
                center: [currentPosition.lon, currentPosition.lat],
                zoom: 15,
                duration: 600,
                padding: { top: 100, bottom: 0, left: 0, right: 0 }
            });
            setHasCenteredOnce(true);
        }
    }, [currentPosition, hasCenteredOnce]);

    useEffect(() => {
        getReports(token).then(setReports).catch(console.error);
    }, [token]);

    const activeRoute = useMemo(
        () => itineraires?.find(it => it.id === selectedItineraire) || null,
        [itineraires, selectedItineraire],
    );

    const { activeAlert, dismissAlert } = useHazardAlerts(
        reports, currentPosition, activeRoute, isNavigating,
    );

    const { activeAlert: weatherAlert, dismissAlert: dismissWeatherAlert } = useWeatherAlerts(
        weatherData, currentPosition, isNavigating,
    );

    useEffect(() => {
        const loadSavedPreferences = async () => {
            const savedBase = await AsyncStorage.getItem('userMapBaseStyle');
            const savedTheme = await AsyncStorage.getItem('userMapThemeMode');
            const savedPois = await AsyncStorage.getItem('userMapPois');
            const savedSubTypes = await AsyncStorage.getItem('userMapSubTypes');
            const savedAccidents = await AsyncStorage.getItem('userMapAccidents');
            const savedLitRoads = await AsyncStorage.getItem('userMapLitRoads');
            const savedAir = await AsyncStorage.getItem('userMapAir');
            const savedBikeshare = await AsyncStorage.getItem('userMapBikeshare');
            if (savedBase) setActiveBaseStyle(savedBase);
            if (savedTheme) setMapThemeMode(savedTheme);
            setShowAccidents(savedAccidents === 'true');
            setShowLitRoads(savedLitRoads === 'true');
            setShowAir(savedAir === 'true');
            setShowBikeshare(savedBikeshare === 'true');
            if (savedPois) {
                try {
                    setEnabledPoiCats(JSON.parse(savedPois));
                } catch {
                }
            }
            if (savedSubTypes) {
                try {
                    setEnabledSubTypes(mergeSubTypes(JSON.parse(savedSubTypes)));
                } catch {
                }
            }
        };
        loadSavedPreferences();
    }, []);

    useEffect(() => {
        if (miniMap) return;
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
    }, [enabledPoiCats, miniMap]);

    useEffect(() => {
        if (miniMap || !showAccidents || accidentCacheRef.current) return;
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
    }, [showAccidents, miniMap]);

    const handleAccidentsToggle = () => {
        const next = !showAccidents;
        setShowAccidents(next);
        if (!next) setActiveAccident(null);
        AsyncStorage.setItem('userMapAccidents', String(next));
    };

    useEffect(() => {
        if (miniMap || !showLitRoads || litRoadsCacheRef.current) return;
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
    }, [showLitRoads, miniMap]);

    const handleLitRoadsToggle = () => {
        const next = !showLitRoads;
        setShowLitRoads(next);
        AsyncStorage.setItem('userMapLitRoads', String(next));
    };

    const handleAirToggle = () => {
        const next = !showAir;
        setShowAir(next);
        AsyncStorage.setItem('userMapAir', String(next));
    };

    const handleBikeshareToggle = () => {
        const next = !showBikeshare;
        setShowBikeshare(next);
        if (!next) setActiveStation(null);
        AsyncStorage.setItem('userMapBikeshare', String(next));
    };

    const openLightingInfo = () => {
        setLightingInfoVisible(true);
        if (lightingSourcesRef.current) return;
        lightingSourcesRef.current = true;
        getStreetlightSources()
            .then(data => setLightingSources(data?.sources || []))
            .catch(error => {
                lightingSourcesRef.current = false;
                console.error("Erreur chargement des sources d'éclairage :", error);
            });
    };

    const handleRecenter = () => {
        if (!currentPosition || !cameraRef.current) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                "Position introuvable",
                "Veuillez patienter pendant la recherche de votre position GPS."
            );
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });

        cameraRef.current.flyTo({
            center: [currentPosition.lon, currentPosition.lat],
            zoom: 16,
            duration: 1500,
        });

    };

    const handleStyleChange = async (id) => {
        setActiveBaseStyle(id);
        setLayerMenuVisible(false);
        await AsyncStorage.setItem('userMapBaseStyle', id);
    };

    const handleThemeChange = async (theme) => {
        setMapThemeMode(theme);
        await AsyncStorage.setItem('userMapThemeMode', theme);
    };

    const handlePoiCategoryToggle = async (id) => {
        const next = { ...enabledPoiCats, [id]: !enabledPoiCats[id] };
        setEnabledPoiCats(next);
        await AsyncStorage.setItem('userMapPois', JSON.stringify(next));
    };

    const handleSubTypeToggle = async (catId, subId) => {
        const next = {
            ...enabledSubTypes,
            [catId]: { ...enabledSubTypes[catId], [subId]: !enabledSubTypes[catId]?.[subId] },
        };
        setEnabledSubTypes(next);
        await AsyncStorage.setItem('userMapSubTypes', JSON.stringify(next));
    };

    const poisGeoJSON = useMemo(() => {
        const features = POI_CATEGORIES
            .filter(({ id }) => enabledPoiCats[id] && poiData[id])
            .flatMap((cat) => (
                cat.subTypes
                    ? poiData[cat.id].features.filter(f => enabledSubTypes[cat.id]?.[f.properties[cat.subTypeProp]])
                    : poiData[cat.id].features
            ));
        return features.length ? { type: 'FeatureCollection', features } : EMPTY_FEATURE_COLLECTION;
    }, [enabledPoiCats, enabledSubTypes, poiData]);

    const trafficGeoJSON = useMemo(
        () => traffic?.geojson?.features?.length ? traffic.geojson : EMPTY_FEATURE_COLLECTION,
        [traffic]
    );

    useEffect(() => {
        if (miniMap) return;

        let cancelled = false;
        let timer = null;

        const load = async () => {
            try {
                const data = await getTraffic();
                if (cancelled) return;
                setTraffic(data);
                if (showTraffic) timer = setTimeout(load, (data?.refresh_interval_s || 300) * 1000);
            } catch (error) {
                if (cancelled || !showTraffic) return;
                timer = setTimeout(load, 60000);
            }
        };
        load();

        return () => { cancelled = true; if (timer) clearTimeout(timer); };
    }, [showTraffic, miniMap]);

    const airGeoJSON = useMemo(
        () => airData?.geojson?.features?.length ? airData.geojson : EMPTY_FEATURE_COLLECTION,
        [airData]
    );

    const airStationsGeoJSON = useMemo(
        () => airData?.stations?.features?.length ? airData.stations : EMPTY_FEATURE_COLLECTION,
        [airData]
    );

    const activeAir = useMemo(() => {
        const point = (currentPosition?.lat != null && currentPosition?.lon != null)
            ? { lat: currentPosition.lat, lon: currentPosition.lon }
            : (start?.lat != null && start?.lon != null)
                ? { lat: parseFloat(start.lat), lon: parseFloat(start.lon) }
                : null;
        return airForPoint(airData, point);
    }, [airData, currentPosition, start]);

    useEffect(() => {
        if (miniMap) return;

        let cancelled = false;
        let timer = null;

        const load = async () => {
            try {
                const data = await getAirQuality();
                if (cancelled) return;
                setAirData(data);
                if (showAir) timer = setTimeout(load, (data?.refresh_interval_s || 900) * 1000);
            } catch (error) {
                if (cancelled || !showAir) return;
                timer = setTimeout(load, 60000);
            }
        };
        load();

        return () => { cancelled = true; if (timer) clearTimeout(timer); };
    }, [showAir, miniMap]);

    const activeWeather = useMemo(() => {
        const point = (currentPosition?.lat != null && currentPosition?.lon != null)
            ? { lat: currentPosition.lat, lon: currentPosition.lon }
            : (start?.lat != null && start?.lon != null)
                ? { lat: parseFloat(start.lat), lon: parseFloat(start.lon) }
                : null;
        return pointForCenter(weatherData, point);
    }, [weatherData, currentPosition, start]);

    const [nowMs, setNowMs] = useState(() => Date.now());
    useEffect(() => {
        if (miniMap) return;
        const timer = setInterval(() => setNowMs(Date.now()), 60000);
        return () => clearInterval(timer);
    }, [miniMap]);

    const weatherAgeMin = useMemo(
        () => snapshotAgeMin(weatherData?.updated_at, nowMs),
        [weatherData, nowMs],
    );

    const weatherStale = (weatherData?.stale === true)
        || (weatherAgeMin != null && weatherAgeMin >= STALE_AGE_MIN);

    const weatherRain = useMemo(() => {
        if (!isHintUsable(activeWeather?.summary?.departure_hint, weatherAgeMin)) return null;
        return rainBanner(activeWeather);
    }, [activeWeather, weatherAgeMin]);

    const weatherNowcast = useMemo(
        () => freshSteps(activeWeather?.minutely_15, activeWeather?.utc_offset_seconds, undefined, nowMs),
        [activeWeather, nowMs],
    );
    const weatherNowcastOutdated = (activeWeather?.minutely_15?.length > 0)
        && weatherNowcast.length === 0;

    const weatherUpdatedAt = useMemo(() => {
        if (!weatherData?.updated_at) return null;
        const date = new Date(weatherData.updated_at);
        if (Number.isNaN(date.getTime())) return null;
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }, [weatherData]);

    useEffect(() => {
        if (miniMap) return;

        let cancelled = false;
        let timer = null;

        const load = async () => {
            try {
                const data = await getWeather();
                if (cancelled) return;
                setWeatherData(data);
                timer = setTimeout(load, (data?.refresh_interval_s || 600) * 1000);
            } catch {
                if (cancelled) return;
                timer = setTimeout(load, 60000);
            }
        };
        load();

        return () => { cancelled = true; if (timer) clearTimeout(timer); };
    }, [miniMap]);

    const bikeshareGeoJSON = useMemo(
        () => bikeshareData?.geojson?.features?.length ? bikeshareData.geojson : EMPTY_FEATURE_COLLECTION,
        [bikeshareData]
    );

    useEffect(() => {
        if (miniMap || !showBikeshare) return;

        let cancelled = false;
        let timer = null;

        const schedule = (delayMs) => {
            clearTimeout(timer);
            timer = setTimeout(load, delayMs);
        };

        const load = async () => {
            if (cancelled || AppState.currentState !== 'active') return;
            try {
                const data = await getBikeshareStations();
                if (cancelled) return;
                setBikeshareData(data);
                schedule((data?.refresh_interval_s || 60) * 1000);
            } catch (error) {
                if (cancelled) return;
                schedule(60000);
            }
        };

        load();
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') load();
            else clearTimeout(timer);
        });

        return () => { cancelled = true; clearTimeout(timer); subscription.remove(); };
    }, [showBikeshare, miniMap]);

    useEffect(() => {
        setActiveStation(prev => {
            if (!prev) return prev;
            const fresh = bikeshareGeoJSON.features.find(
                f => f.properties.station_id === prev.station_id
            );
            return fresh ? { ...prev, ...fresh.properties } : prev;
        });
    }, [bikeshareGeoJSON]);

    const reportsGeoJSON = useMemo(() => {
        const features = (reports || []).map((report) => ({
            type: 'Feature',
            properties: { id: report.id, report_type: report.report_type },
            geometry: {
                type: 'Point',
                coordinates: [parseFloat(report.longitude), parseFloat(report.latitude)],
            },
        }));
        return features.length ? { type: 'FeatureCollection', features } : EMPTY_FEATURE_COLLECTION;
    }, [reports]);

    const routesGeoJSON = useMemo(() => {
        if (!itineraires) return null;
        return {
            type: 'FeatureCollection',
            features: itineraires.map(it => ({
                type: 'Feature',
                id: it.id,
                properties: { id: it.id, isSelected: selectedItineraire === it.id },
                geometry: {
                    type: 'LineString',
                    coordinates: it.path.map(p => [parseFloat(p[1]), parseFloat(p[0])])
                }
            }))
        };
    }, [itineraires, selectedItineraire]);

    const cameraRef = useRef(null);

    const cameraSettings = useMemo(() => {
        if (isNavigating && currentPosition) {
            const screenHeight = Dimensions.get('window').height;
            return {
                center: [currentPosition.lon, currentPosition.lat],
                pitch: 45,
                bearing: bearingRef.current || 0,
                zoom: 18,
                duration: 600,
                easing: "fly",
                padding: { top: mapHeight * 0.5, bottom: 0, left: 0, right: 0 }
            };
        }

        const points = [];
        if (start?.lat && start?.lon) points.push([parseFloat(start.lon), parseFloat(start.lat)]);
        if (end?.lat && end?.lon) points.push([parseFloat(end.lon), parseFloat(end.lat)]);
        if (selectedItineraire && itineraires) {
            const activeRoute = itineraires.find(it => it.id === selectedItineraire);
            if (activeRoute?.path) {
                activeRoute.path.forEach(p => points.push([parseFloat(p[1]), parseFloat(p[0])]));
            }
        }

        if (points.length === 1) {
            return {
                center: points[0],
                zoom: 14,
                duration: 1000,
                easing: "fly",
                pitch: 0,
                bearing: 0,
                padding: { top: 100, bottom: 0, left: 0, right: 0 }
            };
        } else if (points.length >= 2) {
            const lons = points.map(p => p[0]);
            const lats = points.map(p => p[1]);
            return {
                bounds: [
                    Math.min(...lons),
                    Math.min(...lats),
                    Math.max(...lons),
                    Math.max(...lats),
                ],
                padding: miniMap ? { top: 40, right: 40, bottom: 40, left: 40 } : cameraPadding,
                duration: 1000,
                easing: "fly",
                pitch: 0,
                bearing: 0,
            };
        }
        if (!currentPosition && !hasCenteredOnce) {
            return {
                center: [-0.5795, 44.8378],
                zoom: 12,
                pitch: 0,
                bearing: 0,
                animationDuration: 0
            };
        }
        return {};
    }, [start, end, selectedItineraire, itineraires, isNavigating, currentPosition, recenterTrigger, mapHeight, hasCenteredOnce, cameraPadding]);

    const onRoutePress = (event) => {
        Haptics.selectionAsync().catch(() => { });
        const native = event?.nativeEvent || {};
        const features = native?.features || [];
        const id = features?.[0]?.properties?.id;
        if (id) { setSelectedItineraire(id); }
    };

    const onPoiPress = (event) => {
        Haptics.selectionAsync().catch(() => { });
        const feature = event?.nativeEvent?.features?.[0];
        if (!feature) return;
        const [lon, lat] = feature.geometry.coordinates;
        setActivePoi({ ...feature.properties, lat, lon });
    };

    const onAccidentPress = (event) => {
        Haptics.selectionAsync().catch(() => { });
        const feature = event?.nativeEvent?.features?.[0];
        if (!feature) return;
        setActiveAccident(feature.properties);
    };

    const onAirStationPress = (event) => {
        Haptics.selectionAsync().catch(() => { });
        const feature = event?.nativeEvent?.features?.[0];
        if (!feature) return;
        setActiveAirStation(feature.properties);
    };

    const onBikesharePress = (event) => {
        Haptics.selectionAsync().catch(() => { });
        const feature = event?.nativeEvent?.features?.[0];
        if (!feature) return;
        const [lon, lat] = feature.geometry.coordinates;
        setActiveStation({ ...feature.properties, lat, lon });
    };

    const onReportPress = (event) => {
        Haptics.selectionAsync().catch(() => { });
        const feature = event?.nativeEvent?.features?.[0];
        if (!feature) return;
        const report = reports.find((r) => r.id === feature.properties.id);
        if (report) setActiveReport(report);
    };

    const screenHeight = Dimensions.get('window').height;
    const slideAnim = useRef(new Animated.Value(screenHeight)).current;

    useEffect(() => {
        if (isLayerMenuVisible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 7
            }).start();
        }
    }, [isLayerMenuVisible]);

    useEffect(() => {
        if (isPoiSheetVisible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 7
            }).start();
        }
    }, [isPoiSheetVisible]);

    const closeMenu = (handleClose) => {
        Animated.timing(slideAnim, {
            toValue: screenHeight,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            handleClose(false);
        });
    };

    const closeLayerMenu = () => closeMenu(setLayerMenuVisible);
    const closePoiSheet = () => closeMenu(setPoiSheetVisible);

    const { gesture: reportGesture, sheetStyle: reportSheetStyle, close: closeReport } =
        useDragToDismiss({ visible: isReportMenuVisible, onClose: () => setIsReportMenuVisible(false) });

    const handleNavigateToPoi = () => {
        if (!activePoi || !onNavigateToPoi) return;
        Haptics.selectionAsync().catch(() => { });
        onNavigateToPoi({
            lat: activePoi.lat,
            lon: activePoi.lon,
            name: activePoi.name || t(`carte.poi.${activePoi.category}`),
        });
        setActivePoi(null);
    };

    const handleNavigateToStation = () => {
        if (!activeStation || !onNavigateToPoi) return;
        Haptics.selectionAsync().catch(() => { });
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

    const handleDeleteReport = async (reportId) => {
        try {
            await deleteReport(token, reportId);
            setReports(prev => prev.filter(r => r.id !== reportId));
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            console.error("Erreur suppression signalement:", error);
        }
    };

    const _dropReport = (reportId) => {
        setReports(prev => prev.filter(r => r.id !== reportId));
        setActiveReport(prev => (prev?.id === reportId ? null : prev));
    };

    const closeAbuseModal = () => {
        setAbuseTarget(null);
        setAbuseStatus(null);
        setActiveReport(null);
    };

    const handleReportAbuse = async (reason) => {
        const target = abuseTarget;
        if (!target) return;
        setAbuseStatus('sending');
        try {
            const res = await reportAbuse(token, target.id, reason);
            trackEvent('report_abuse_reported', { reason });
            if (res?.is_hidden) _dropReport(target.id);
            setAbuseStatus('reported');
        } catch (error) {
            console.error('Erreur dénonciation:', error);
            setAbuseStatus('error');
        }
    };

    const handleBlockAuthor = async () => {
        const target = abuseTarget;
        if (!target) return;
        setAbuseStatus('sending');
        try {
            await blockReportAuthor(token, target.id);
            trackEvent('report_author_blocked');
            setReports(prev => prev.filter(r => r.user_id !== target.user_id));
            setAbuseStatus('blocked');
        } catch (error) {
            console.error('Erreur blocage:', error);
            setAbuseStatus('error');
        }
    };

    const handleVoteReport = async (reportId, isPresent) => {
        try {
            const res = await voteReport(token, reportId, isPresent);
            trackEvent(isPresent ? 'report_confirmed' : 'report_denied', {
                report_id: reportId,
            });
            if (res?.is_disabled) {
                setReports(prev => prev.filter(r => r.id !== reportId));
                setActiveReport(prev => (prev?.id === reportId ? null : prev));
            } else if (res) {
                const patch = {
                    confirmations_count: res.confirmations_count,
                    denials_count: res.denials_count,
                };
                setReports(prev => prev.map(r => (r.id === reportId ? { ...r, ...patch } : r)));
                setActiveReport(prev => (prev?.id === reportId ? { ...prev, ...patch } : prev));
            }
            return res;
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            console.error("Erreur vote signalement:", error);
            return null;
        }
    };

    const handleReportSubmit = async ({ reportType, description, lat, lon }) => {
        try {
            const newReport = await createReport(token, reportType, description, lat, lon);
            setReports(prev => [...prev, newReport]);
            setSelectedReportType(null);
            setReportDescription("");
            closeReport();
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            console.error("Erreur signalement:", error);
        }
    };

    return (
        <View style={styles.container} onLayout={(e) => setMapHeight(e.nativeEvent.layout.height)}>
            <Map
                style={styles.map}
                mapStyle={mapStyleUrl}
                logo={false}
                attribution={true}
                attributionPosition={{ bottom: 5, right: 5 }}
                compass={!miniMap}
                compassPosition={{ bottom: 115 + bottomInset, right: 20 }}
                compassHiddenFacingNorth={false}
            >
                <Camera
                    ref={cameraRef}
                    {...cameraSettings}
                />

                {start?.lat && (
                    <ViewAnnotation id="start" lngLat={[parseFloat(start.lon), parseFloat(start.lat)]} anchor="center">
                        <View style={{ width: 30, height: 30, justifyContent: 'center', alignItems: 'center' }}>
                            <MaterialCommunityIcons name="circle-slice-8" size={20} color={colors.primary} />
                        </View>
                    </ViewAnnotation>
                )}

                {end?.lat && (
                    <ViewAnnotation id="end" lngLat={[parseFloat(end.lon), parseFloat(end.lat)]} anchor="center">
                        <View style={{ width: 30, height: 30, justifyContent: 'center', alignItems: 'center' }}>
                            <MaterialCommunityIcons name="circle-slice-8" size={20} color={colors.error} />
                        </View>
                    </ViewAnnotation>
                )}

                {isNavigating && currentPosition && (
                    <ViewAnnotation
                        id="nav-puck"
                        lngLat={[currentPosition.lon, currentPosition.lat]}
                        anchor="center"
                        style={{ zIndex: 100 }}
                    >
                        <View style={styles.navPuck}>
                            <MaterialCommunityIcons name="navigation" size={50} color={colors.primary} />
                        </View>
                    </ViewAnnotation>
                )}

                {!isNavigating && (
                    <NativeUserLocation
                        mode="heading"
                        androidPreferredFramesPerSecond={30}
                    />
                )}

                {!miniMap && showAir && airGeoJSON.features.length > 0 && (
                    <GeoJSONSource id="air-quality" data={airGeoJSON}>
                        <Layer
                            id="air-quality-fill"
                            type="fill"
                            paint={{
                                fillColor: AIR_FILL_COLOR,
                                fillOpacity: ['interpolate', ['linear'], ['zoom'], 8, 0.32, 13, 0.22, 16, 0.14],
                            }}
                        />
                        <Layer
                            id="air-quality-outline"
                            type="line"
                            paint={{ lineColor: AIR_FILL_COLOR, lineWidth: 1, lineOpacity: 0.4 }}
                        />
                    </GeoJSONSource>
                )}

                {!miniMap && showAir && airStationsGeoJSON.features.length > 0 && (
                    <GeoJSONSource id="air-stations" data={airStationsGeoJSON} onPress={onAirStationPress}>
                        <Layer
                            id="air-stations-circle"
                            type="circle"
                            paint={{
                                circleColor: ['get', 'color'],
                                circleRadius: ['interpolate', ['linear'], ['zoom'], 8, 6, 14, 9, 18, 13],
                                circleStrokeColor: '#ffffff',
                                circleStrokeWidth: 2,
                                circleOpacity: 0.95,
                            }}
                        />
                    </GeoJSONSource>
                )}

                {!miniMap && showBikeshare && bikeshareGeoJSON.features.length > 0 && (
                    <>
                        <Images images={BIKESHARE_IMAGES} />
                        <GeoJSONSource
                            id="bikeshare"
                            data={bikeshareGeoJSON}
                            onPress={onBikesharePress}
                        >
                            <Layer
                                id="bikeshare-icon"
                                type="symbol"
                                minzoom={10}
                                layout={{
                                    iconImage: BIKESHARE_ICON_IMAGE,
                                    iconSize: ['interpolate', ['linear'], ['zoom'], 10, 0.175, 12, 0.28, 14, 0.4, 16, 0.5, 18, 0.6],
                                    iconAllowOverlap: true,
                                    iconIgnorePlacement: true,
                                }}
                                paint={{
                                    iconOpacity: ['interpolate', ['linear'], ['zoom'], 10, 0.5, 13, 0.85, 15, 1],
                                }}
                            />
                            <Layer
                                id="bikeshare-badge"
                                type="symbol"
                                minzoom={10}
                                filter={BIKESHARE_HAS_BADGE}
                                layout={{
                                    iconImage: BIKESHARE_BADGE_IMAGE,
                                    iconSize: ['interpolate', ['linear'], ['zoom'], 10, 0.095, 12.99, 0.19, 13, 0.32, 16, 0.43, 18, 0.5],
                                    textField: ['step', ['zoom'], '', 13, ['to-string', BIKESHARE_BIKES]],
                                    textSize: ['interpolate', ['linear'], ['zoom'], 13, 9, 16, 11, 18, 12],
                                    iconAllowOverlap: ['step', ['zoom'], true, 13, false],
                                    iconIgnorePlacement: ['step', ['zoom'], true, 13, false],
                                }}
                                paint={{
                                    iconTranslate: BIKESHARE_BADGE_TRANSLATE,
                                    textTranslate: BIKESHARE_BADGE_TRANSLATE,
                                    textColor: '#ffffff',
                                }}
                            />
                        </GeoJSONSource>
                    </>
                )}

                {!miniMap && showTraffic && trafficGeoJSON.features.length > 0 && (
                    <GeoJSONSource id="traffic" data={trafficGeoJSON}>
                        <Layer
                            id="traffic-line"
                            type="line"
                            minzoom={9}
                            layout={{ lineJoin: 'round', lineCap: 'round' }}
                            paint={{
                                lineColor: ['match', ['get', 'level'],
                                    'red', TRAFFIC_COLORS.red,
                                    'orange', TRAFFIC_COLORS.orange,
                                    'green', TRAFFIC_COLORS.green,
                                    TRAFFIC_COLORS.gray],
                                lineWidth: ['interpolate', ['linear'], ['zoom'],
                                    9, ['match', ['get', 'level'], 'red', 2, 'orange', 1.8, 1],
                                    11, ['match', ['get', 'level'], 'red', 3, 'orange', 2.5, 1.5],
                                    16, ['match', ['get', 'level'], 'red', 8, 'orange', 7, 4]],
                                lineOpacity: ['interpolate', ['linear'], ['zoom'],
                                    9, ['match', ['get', 'level'], 'red', 0.9, 'orange', 0.9, 'gray', 0.12, 0.3],
                                    12, ['match', ['get', 'level'], 'gray', 0.35, 0.85]],
                            }}
                        />
                    </GeoJSONSource>
                )}

                {!miniMap && showLitRoads && !!litRoadsData && (
                    <GeoJSONSource id="lit-roads" data={litRoadsData}>
                        <Layer
                            id="lit-roads-glow"
                            type="line"
                            layout={{ lineCap: 'round', lineJoin: 'round' }}
                            paint={{
                                lineColor: LIT_ROADS_COLOR,
                                lineWidth: ['interpolate', ['exponential', 2], ['zoom'], 11, 4, 15, 5.3, 19, 85, 22, 680],
                                lineBlur: ['interpolate', ['exponential', 2], ['zoom'], 11, 2, 15, 3, 19, 48, 22, 384],
                                lineOpacity: ['interpolate', ['linear'], ['zoom'], 11, 0.12, 14, 0.3],
                            }}
                        />
                        <Layer
                            id="lit-roads-line"
                            type="line"
                            layout={{ lineCap: 'round', lineJoin: 'round' }}
                            paint={{
                                lineColor: LIT_ROADS_COLOR,
                                lineWidth: ['interpolate', ['exponential', 2], ['zoom'], 11, 1.5, 15, 2.7, 19, 43, 22, 344],
                                lineOpacity: ['interpolate', ['linear'], ['zoom'], 11, 0.5, 14, 0.85],
                            }}
                        />
                    </GeoJSONSource>
                )}

                {!miniMap && showAccidents && !!accidentData && (
                    <GeoJSONSource id="accidents" data={accidentData} onPress={onAccidentPress}>
                        <Layer
                            id="accidents-heat"
                            type="heatmap"
                            maxzoom={ACCIDENT_SWITCH_ZOOM + 1}
                            paint={{
                                heatmapWeight: ['interpolate', ['linear'], ['get', 'severity'],
                                    0, 0.3, 1, 0.5, 3, 0.8, 10, 1],
                                heatmapIntensity: ['interpolate', ['linear'], ['zoom'], 8, 1, 14, 3],
                                heatmapColor: ['interpolate', ['linear'], ['heatmap-density'],
                                    0, 'rgba(0,0,0,0)',
                                    0.2, 'rgba(254,240,138,0.5)',
                                    0.4, 'rgba(251,146,60,0.6)',
                                    0.7, 'rgba(220,38,38,0.75)',
                                    1, 'rgba(127,29,29,0.9)'],
                                heatmapRadius: ['interpolate', ['linear'], ['zoom'], 8, 10, 14, 28],
                                // Disparaît quand les points prennent le relais.
                                heatmapOpacity: ['interpolate', ['linear'], ['zoom'],
                                    ACCIDENT_SWITCH_ZOOM, 0.85, ACCIDENT_SWITCH_ZOOM + 1, 0],
                            }}
                        />
                        <Layer
                            id="accidents-point"
                            type="circle"
                            minzoom={ACCIDENT_SWITCH_ZOOM}
                            paint={{
                                circleRadius: ['interpolate', ['linear'], ['zoom'],
                                    ACCIDENT_SWITCH_ZOOM, 4, 17, 10],
                                circleColor: ACCIDENT_SEVERITY_COLOR,
                                circleStrokeWidth: 1.5,
                                circleStrokeColor: '#ffffff',
                                circleOpacity: ['interpolate', ['linear'], ['zoom'],
                                    ACCIDENT_SWITCH_ZOOM, 0, ACCIDENT_SWITCH_ZOOM + 1, 0.9],
                                circleStrokeOpacity: ['interpolate', ['linear'], ['zoom'],
                                    ACCIDENT_SWITCH_ZOOM, 0, ACCIDENT_SWITCH_ZOOM + 1, 1],
                            }}
                            hitbox={{ width: 44, height: 44 }}
                        />
                    </GeoJSONSource>
                )}

                {!miniMap && poisGeoJSON.features.length > 0 && (
                    <>
                        <Images images={POI_IMAGES} />
                        <GeoJSONSource id="pois" data={poisGeoJSON} onPress={onPoiPress}>
                            <Layer
                                id="pois-symbol"
                                type="symbol"
                                minzoom={10}
                                layout={{
                                    iconImage: ['concat',
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
                                    iconSize: ['interpolate', ['linear'], ['zoom'], 10, 0.16, 13, 0.3, 17, 0.58],
                                    iconAllowOverlap: false,
                                    symbolSortKey: ['match', ['get', 'category'], 'parking', 1, 0],
                                    textField: ['step', ['zoom'], '', 16, ['coalesce', ['get', 'name'], '']],
                                    textSize: 11,
                                    textAnchor: 'top',
                                    textOffset: [0, 1.7],
                                    textAllowOverlap: false,
                                    textOptional: true,
                                }}
                                paint={{
                                    iconOpacity: ['interpolate', ['linear'], ['zoom'], 10, 0.45, 13, 0.7, 15, 1],
                                    textColor: colors.textMain,
                                    textHaloColor: colors.bgMain,
                                    textHaloWidth: 1.2,
                                }}
                            />
                        </GeoJSONSource>
                    </>
                )}

                {routesGeoJSON && (
                    <GeoJSONSource
                        id="routes"
                        data={routesGeoJSON}
                        onPress={onRoutePress}
                    >
                        <Layer
                            id="inactive-routes"
                            type="line"
                            filter={['!=', ['get', 'isSelected'], true]}
                            paint={{ lineColor: colors.inactiveRoute, lineWidth: 4 }}
                            layout={{ lineJoin: 'round', lineCap: 'round' }}
                            hitbox={{ width: 44, height: 44 }}
                        />
                        <Layer
                            id="active-route"
                            type="line"
                            filter={['==', ['get', 'isSelected'], true]}
                            paint={{ lineColor: colors.activeRoute, lineWidth: 6 }}
                            layout={{ lineJoin: 'round', lineCap: 'round' }}
                            hitbox={{ width: 44, height: 44 }}
                        />
                    </GeoJSONSource>
                )}

                {!miniMap && reportsGeoJSON.features.length > 0 && (
                    <>
                        <Images images={REPORT_IMAGES} />
                        <GeoJSONSource id="reports" data={reportsGeoJSON} onPress={onReportPress}>
                            <Layer
                                id="reports-symbol"
                                type="symbol"
                                minzoom={9}
                                layout={{
                                    iconImage: ['match', ['get', 'report_type'],
                                        'accident', 'report-accident',
                                        'travaux', 'report-travaux',
                                        'danger', 'report-danger',
                                        'obstacle', 'report-obstacle',
                                        'report-danger'],
                                    iconSize: ['interpolate', ['linear'], ['zoom'], 10, 0.18, 13, 0.34, 17, 0.66],
                                    iconAllowOverlap: true,
                                }}
                                paint={{
                                    iconOpacity: ['interpolate', ['linear'], ['zoom'], 9, 0, 10.5, 1],
                                }}
                            />
                        </GeoJSONSource>
                    </>
                )}
            </Map>

            {!miniMap && !hideControls && (
                <View style={[styles.weatherPill, { bottom: 80 + bottomInset }]} pointerEvents="box-none">
                    <WeatherPill
                        zone={activeWeather}
                        stale={weatherStale}
                        rain={weatherRain}
                        onPress={() => { Haptics.selectionAsync(); setWeatherDetailVisible(true); }}
                        buttonStyle={[styles.mapButton, androidButtonBg]}
                        frost={<MapButtonFrost />}
                    />
                </View>
            )}

            {!miniMap && isNavigating && activeAlert && (
                <HazardAlert
                    report={activeAlert.report}
                    distance={activeAlert.distance}
                    canVote={!!token && activeAlert.report.user_id !== user?.id}
                    onVote={(isPresent) => handleVoteReport(activeAlert.report.id, isPresent)}
                    onDismiss={dismissAlert}
                    bottomOffset={bottomInset}
                />
            )}

            {weatherAlert && (
                <WeatherAlert
                    alert={weatherAlert}
                    onDismiss={dismissWeatherAlert}
                    bottomOffset={bottomInset + (activeAlert ? 110 : 0)}
                />
            )}

            {!miniMap && !hideControls && currentPosition && (
                <TouchableOpacity
                    style={[styles.mapButton, styles.recenterButton, androidButtonBg, { bottom: 20 + bottomInset }]}
                    onPress={handleRecenter}
                >
                    <MapButtonFrost />
                    <MaterialCommunityIcons name="crosshairs-gps" size={26} color={colors.textMain} />
                </TouchableOpacity>
            )}

            {!hideControls && (
            <TouchableOpacity
                style={[styles.mapButton, styles.layerButton, androidButtonBg, { bottom: 20 + bottomInset }]}
                onPress={() => {
                    Haptics.selectionAsync();
                    setLayerMenuVisible(true);
                }}
            >
                <MapButtonFrost />
                <MaterialCommunityIcons name="layers-outline" size={26} color={colors.textMain} />
            </TouchableOpacity>
            )}

            <Modal
                visible={isLayerMenuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => closeMenu(setLayerMenuVisible)}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => closeMenu(setLayerMenuVisible)}>
                    <Animated.View onStartShouldSetResponder={() => true} style={[styles.modalContent, { transform: [{ translateY: slideAnim }], backgroundColor: colors.bgMain }]}>

                        <Text style={[styles.modalTitle, typography.h1, { fontSize: 20, lineHeight: 24, color: colors.textMain }]}>Fond de carte</Text>

                        <View style={[styles.themeSelector, { backgroundColor: colors.bgSurface }]}>
                            <TouchableOpacity style={[styles.themeBtn, mapThemeMode === 'light' && [styles.themeBtnActive, { backgroundColor: colors.bgMain }]]} onPress={() => { Haptics.selectionAsync(); handleThemeChange('light'); }}>
                                <Ionicons name="sunny" size={20} color={mapThemeMode === 'light' ? colors.primary : colors.textSecondary} />
                                <Text style={[styles.themeBtnText, { color: mapThemeMode === 'light' ? colors.primary : colors.textSecondary }]}>Clair</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.themeBtn, mapThemeMode === 'auto' && [styles.themeBtnActive, { backgroundColor: colors.bgMain }]]} onPress={() => { Haptics.selectionAsync(); handleThemeChange('auto'); }}>
                                <Ionicons name="settings-outline" size={20} color={mapThemeMode === 'auto' ? colors.primary : colors.textSecondary} />
                                <Text style={[styles.themeBtnText, { color: mapThemeMode === 'auto' ? colors.primary : colors.textSecondary }]}>Auto</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.themeBtn, mapThemeMode === 'dark' && [styles.themeBtnActive, { backgroundColor: colors.bgMain }]]} onPress={() => { Haptics.selectionAsync(); handleThemeChange('dark'); }}>
                                <Ionicons name="moon" size={20} color={mapThemeMode === 'dark' ? colors.primary : colors.textSecondary} />
                                <Text style={[styles.themeBtnText, { color: mapThemeMode === 'dark' ? colors.primary : colors.textSecondary }]}>Sombre</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.divider} />

                        {MAP_STYLES.map((style) => (
                            <TouchableOpacity
                                key={style.id}
                                style={styles.layerOption}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    handleStyleChange(style.id);
                                }}>
                                <Text style={styles.layerEmoji}>{style.icon}</Text>
                                <Text style={[styles.layerText, typography.body, { color: activeBaseStyle === style.id ? colors.primary : colors.textSecondary, fontWeight: activeBaseStyle === style.id ? 'bold' : 'normal' }]}>
                                    {t(`carte.fond.${style.id}`)}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <View style={styles.divider} />
                        <Text style={[styles.modalTitle, typography.h1, { fontSize: 20, lineHeight: 24, color: colors.textMain }]}>Calques</Text>

                        {traffic?.available && (
                            <View style={styles.poiOption}>
                                <View style={[styles.poiBadge, { backgroundColor: '#f97316' }]}>
                                    <MaterialCommunityIcons name="traffic-light" size={18} color="#FFF" />
                                </View>
                                <Text style={[styles.layerText, typography.body, { flex: 1, color: colors.textMain }]}>
                                    Trafic automobile
                                </Text>
                                <Switch
                                    value={showTraffic}
                                    onValueChange={(value) => { Haptics.selectionAsync(); setShowTraffic(value); }}
                                    trackColor={{ true: colors.primary }}
                                />
                            </View>
                        )}

                        {airData?.available && (
                            <View style={styles.poiOption}>
                                <View style={[styles.poiBadge, { backgroundColor: '#0d9488' }]}>
                                    <MaterialCommunityIcons name="weather-windy" size={18} color="#FFF" />
                                </View>
                                <TouchableOpacity
                                    style={{ flex: 1 }}
                                    activeOpacity={0.6}
                                    onPress={() => { Haptics.selectionAsync(); setAirInfoVisible(true); }}
                                    accessibilityLabel="Informations sur la qualité de l'air"
                                >
                                    <View style={styles.layerNameRow}>
                                        <Text style={[typography.body, { fontSize: 16, color: colors.textMain }]}>
                                            Qualité de l'air
                                        </Text>
                                        <Ionicons name="information-circle-outline" size={15} color={colors.textSecondary} />
                                    </View>
                                    {activeAir?.summary?.aqi != null && (
                                        <Text style={[typography.body, { marginLeft: 15, fontSize: 12, color: colors.textSecondary }]}>
                                            {`Indice ${activeAir.summary.aqi} · ${activeAir.summary.label}`}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                                <Switch
                                    value={showAir}
                                    onValueChange={() => { Haptics.selectionAsync(); handleAirToggle(); }}
                                    trackColor={{ true: colors.primary }}
                                />
                            </View>
                        )}

                        <View style={styles.poiOption}>
                            {/* Bleu nuit comme le disque sur la carte : la pastille
                                du menu doit désigner la couche, pas l'un de ses états. */}
                            <View style={[styles.poiBadge, { backgroundColor: BIKESHARE_NAVY }]}>
                                <MaterialCommunityIcons name="bicycle" size={18} color="#FFF" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[typography.body, { fontSize: 16, color: colors.textMain }]}>
                                    Stations de vélos
                                </Text>
                                {showBikeshare && bikeshareData?.counts?.stations > 0 && (
                                    <Text style={[typography.body, { marginLeft: 15, fontSize: 12, color: colors.textSecondary }]}>
                                        {`${bikeshareData.counts.stations} stations · ${bikeshareData.counts.bikes} vélos`}
                                    </Text>
                                )}
                            </View>
                            <Switch
                                value={showBikeshare}
                                onValueChange={() => { Haptics.selectionAsync(); handleBikeshareToggle(); }}
                                trackColor={{ true: colors.primary }}
                            />
                        </View>

                        <View style={styles.poiOption}>
                            <View style={[styles.poiBadge, { backgroundColor: '#f59e0b' }]}>
                                <MaterialCommunityIcons name="lightbulb-on" size={18} color="#FFF" />
                            </View>
                            <TouchableOpacity
                                style={{ flex: 1 }}
                                activeOpacity={0.6}
                                onPress={() => { Haptics.selectionAsync(); openLightingInfo(); }}
                                accessibilityLabel="Informations sur l'éclairage"
                            >
                                <View style={styles.layerNameRow}>
                                    <Text style={[typography.body, { fontSize: 16, color: colors.textMain }]}>
                                        Éclairage public
                                    </Text>
                                    <Ionicons name="information-circle-outline" size={15} color={colors.textSecondary} />
                                </View>
                            </TouchableOpacity>
                            <Switch
                                value={showLitRoads}
                                onValueChange={() => { Haptics.selectionAsync(); handleLitRoadsToggle(); }}
                                trackColor={{ true: colors.primary }}
                            />
                        </View>
                    </Animated.View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={isLightingInfoVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setLightingInfoVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setLightingInfoVisible(false)}
                >
                    <View
                        style={[styles.lightingInfoCard, { backgroundColor: colors.bgMain }]}
                        onStartShouldSetResponder={() => true}
                    >
                        <Text style={[styles.modalTitle, typography.h1, { fontSize: 20, lineHeight: 24, color: colors.textMain }]}>
                            {t('carte.ui.eclairage.h2')}
                        </Text>

                        <Text style={[typography.body, styles.lightingInfoText, { color: colors.textSecondary }]}>
                            {/* Le gras est porté par la phrase elle-même : la découper en
                                morceaux figerait l'ordre des mots du français. */}
                            <Trans
                                i18nKey="carte.ui.eclairage.ruesEclairees"
                                components={{ b: <Text style={{ fontWeight: 'bold', color: colors.textMain }} /> }}
                            />
                        </Text>

                        <Text style={[typography.body, styles.lightingInfoText, { color: colors.textSecondary }]}>
                            {t('carte.ui.eclairage.lampadairesMobile')}
                        </Text>

                        <Text style={[typography.body, styles.lightingInfoText, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                            {t('carte.ui.eclairage.avertissementMobile')}
                        </Text>

                        <Text style={[typography.body, styles.lightingInfoText, { color: colors.textMain, fontWeight: 'bold' }]}>
                            {t('carte.ui.eclairage.sourcesZone')}
                        </Text>

                        {lightingSources === null ? (
                            <Text style={[typography.body, styles.lightingInfoText, { color: colors.textSecondary }]}>
                                {t('carte.ui.eclairage.chargement')}
                            </Text>
                        ) : lightingSources.length === 0 ? (
                            <Text style={[typography.body, styles.lightingInfoText, { color: colors.textSecondary }]}>
                                {t('carte.ui.eclairage.aucunLampadaire')}
                            </Text>
                        ) : (
                            lightingSources.map((s) => (
                                <Text
                                    key={s.source}
                                    style={[typography.body, styles.lightingInfoSource, { color: colors.textSecondary }]}
                                >
                                    {s.count
                                        ? t('carte.ui.eclairage.sourcePointsCompte', { attribution: s.attribution, n: f.nombre(s.count) })
                                        : t('carte.ui.eclairage.sourcePoints', { attribution: s.attribution })}
                                </Text>
                            ))
                        )}

                        <TouchableOpacity
                            style={[styles.lightingInfoClose, { backgroundColor: colors.primary }]}
                            onPress={() => setLightingInfoVisible(false)}
                        >
                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{t('carte.ui.fermer')}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <WeatherDetailModal
                visible={isWeatherDetailVisible}
                zone={activeWeather}
                stale={weatherStale}
                updatedAt={weatherUpdatedAt}
                minutely={weatherNowcast}
                outdated={weatherNowcastOutdated}
                rain={weatherRain}
                onClose={() => setWeatherDetailVisible(false)}
                onOpenInfo={() => {
                    setWeatherDetailVisible(false);
                    setWeatherInfoVisible(true);
                }}
            />

            <Modal
                visible={isWeatherInfoVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setWeatherInfoVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setWeatherInfoVisible(false)}
                >
                    <View
                        style={[styles.lightingInfoCard, { backgroundColor: colors.bgMain }]}
                        onStartShouldSetResponder={() => true}
                    >
                        <Text style={[styles.modalTitle, typography.h1, { fontSize: 20, lineHeight: 24, color: colors.textMain }]}>
                            {t('carte.ui.meteoModal.h2')}
                        </Text>

                        <Text style={[typography.body, styles.lightingInfoText, { color: colors.textSecondary }]}>
                            {t('carte.ui.meteoModal.releve')}
                        </Text>

                        <Text style={[typography.body, styles.lightingInfoText, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                            {t('carte.ui.meteoModal.avertissement')}
                        </Text>

                        <Text style={[typography.body, styles.lightingInfoText, { color: colors.textMain, fontWeight: 'bold' }]}>
                            {t('carte.ui.meteoModal.pluie30')}
                        </Text>
                        <Text style={[typography.body, styles.lightingInfoText, { color: colors.textSecondary }]}>
                            {t('carte.ui.meteoModal.pluie30Texte')}
                        </Text>

                        <Text style={[typography.body, styles.lightingInfoText, { color: colors.textMain, fontWeight: 'bold' }]}>
                            {t('carte.ui.meteoModal.ventPontsTitre')}
                        </Text>
                        <Text style={[typography.body, styles.lightingInfoText, { color: colors.textSecondary }]}>
                            {t('carte.ui.meteoModal.ventPonts')}
                        </Text>

                        <Text style={[typography.body, styles.lightingInfoText, { color: colors.textMain, fontWeight: 'bold' }]}>
                            {t('carte.ui.meteoModal.sources')}
                        </Text>
                        <Text style={[typography.body, styles.lightingInfoText, { color: colors.textSecondary }]}>
                            {t('carte.ui.meteoModal.sourcesTexte')}
                        </Text>

                        <TouchableOpacity
                            style={[styles.lightingInfoClose, { backgroundColor: colors.primary }]}
                            onPress={() => setWeatherInfoVisible(false)}
                        >
                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{t('carte.ui.fermer')}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={isAirInfoVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setAirInfoVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setAirInfoVisible(false)}
                >
                    <View
                        style={[styles.lightingInfoCard, { backgroundColor: colors.bgMain }]}
                        onStartShouldSetResponder={() => true}
                    >
                        <Text style={[styles.modalTitle, typography.h1, { fontSize: 20, lineHeight: 24, color: colors.textMain }]}>
                            {t('carte.ui.airModal.h2')}
                        </Text>

                        <Text style={[typography.body, styles.lightingInfoText, { color: colors.textSecondary }]}>
                            {t('carte.ui.airModal.cellulesTexte', { resolution: airData?.resolution_km || 11 })}
                        </Text>

                        <Text style={[typography.body, styles.lightingInfoText, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                            {t('carte.ui.airModal.cellulesAvertissement')}
                        </Text>

                        <Text style={[typography.body, styles.lightingInfoText, { color: colors.textMain, fontWeight: 'bold' }]}>
                            {t('carte.ui.airModal.pastilles')}
                        </Text>
                        <Text style={[typography.body, styles.lightingInfoText, { color: colors.textSecondary }]}>
                            {t('carte.ui.airModal.pastillesTexte')}
                        </Text>

                        <Text style={[typography.body, styles.lightingInfoText, { color: colors.textMain, fontWeight: 'bold' }]}>
                            {t('carte.ui.airModal.sources')}
                        </Text>
                        <Text style={[typography.body, styles.lightingInfoText, { color: colors.textSecondary }]}>
                            {t('carte.ui.airModal.sourcesTexte')}
                        </Text>

                        <TouchableOpacity
                            style={[styles.lightingInfoClose, { backgroundColor: colors.primary }]}
                            onPress={() => setAirInfoVisible(false)}
                        >
                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{t('carte.ui.fermer')}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {!miniMap && !hideControls && (
                <TouchableOpacity
                    style={[styles.mapButton, styles.poiButton, androidButtonBg, { bottom: 80 + bottomInset }]}
                    onPress={() => {
                        Haptics.selectionAsync();
                        setPoiSheetVisible(true);
                    }}
                >
                    <MapButtonFrost />
                    <MaterialCommunityIcons name="map-marker-multiple-outline" size={26} color={colors.textMain} />
                </TouchableOpacity>
            )}

            <Modal
                visible={isPoiSheetVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closePoiSheet}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closePoiSheet}>
                    <Animated.View onStartShouldSetResponder={() => true} style={[styles.modalContent, { transform: [{ translateY: slideAnim }], backgroundColor: colors.bgMain }]}>

                        <Text style={[styles.modalTitle, typography.h1, { fontSize: 20, lineHeight: 24, color: colors.textMain }]}>{"Points d'intérêt"}</Text>

                        {POI_CATEGORIES.map((category) => (
                            <View key={category.id} style={{ width: '100%' }}>
                                <View style={styles.poiOption}>
                                    <View style={[styles.poiBadge, { backgroundColor: category.color }]}>
                                        <MaterialCommunityIcons name={category.icon} size={18} color="#FFF" />
                                    </View>
                                    <Text style={[styles.layerText, typography.body, { flex: 1, color: colors.textMain }]}>
                                        {t(`carte.poi.${category.id}`)}
                                    </Text>
                                    <Switch
                                        value={!!enabledPoiCats[category.id]}
                                        onValueChange={() => {
                                            Haptics.selectionAsync();
                                            handlePoiCategoryToggle(category.id);
                                        }}
                                        trackColor={{ true: colors.primary }}
                                    />
                                </View>

                                {category.subTypes && enabledPoiCats[category.id] && category.subTypes.map((subType) => (
                                    <View key={subType.id} style={styles.poiSubOption}>
                                        <View style={[styles.poiSubDot, { backgroundColor: subType.color }]} />
                                        <Text style={[typography.body, { flex: 1, fontSize: 14, color: colors.textSecondary }]}>
                                            {t(`carte.${category.sousCle}.${subType.id}`)}
                                        </Text>
                                        <Switch
                                            value={!!enabledSubTypes[category.id]?.[subType.id]}
                                            onValueChange={() => {
                                                Haptics.selectionAsync();
                                                handleSubTypeToggle(category.id, subType.id);
                                            }}
                                            trackColor={{ true: colors.primary }}
                                            style={{ transform: [{ scale: 0.8 }] }}
                                        />
                                    </View>
                                ))}
                            </View>
                        ))}

                        <Text style={[typography.body, { fontSize: 12, color: colors.textSecondary, marginTop: 10 }]}>
                            {"Zoomez pour faire apparaître les points d'intérêt."}
                        </Text>

                        <View style={[styles.divider, { marginTop: 14 }]} />

                        <Text style={[styles.modalTitle, typography.h1, { fontSize: 20, lineHeight: 24, color: colors.textMain }]}>
                            Accidentologie
                        </Text>

                        <View style={styles.poiOption}>
                            <View style={[styles.poiBadge, { backgroundColor: '#dc2626' }]}>
                                <MaterialCommunityIcons name="alert-octagon" size={18} color="#FFF" />
                            </View>
                            <Text style={[styles.layerText, typography.body, { flex: 1, color: colors.textMain }]}>
                                Accidents à vélo
                            </Text>
                            <Switch
                                value={showAccidents}
                                onValueChange={() => {
                                    Haptics.selectionAsync();
                                    handleAccidentsToggle();
                                }}
                                trackColor={{ true: colors.primary }}
                            />
                        </View>

                        {showAccidents && (
                            <>
                                {ACCIDENT_LEGEND.map((item) => (
                                    <View key={item.id} style={styles.poiSubOption}>
                                        <View style={[styles.poiSubDot, { backgroundColor: item.color }]} />
                                        <Text style={[typography.body, { flex: 1, fontSize: 14, color: colors.textSecondary }]}>
                                            {t(`carte.graviteAccident.${item.id}`)}
                                        </Text>
                                    </View>
                                ))}
                                <Text style={[typography.body, { fontSize: 12, color: colors.textSecondary, marginTop: 10 }]}>
                                    {"Accidents déclarés aux forces de l'ordre : l'absence de point ne signifie pas l'absence de danger."}
                                </Text>
                                {accidentData?.attributions?.length > 0 && (
                                    <Text style={[typography.body, { fontSize: 11, color: colors.textSecondary, marginTop: 6, opacity: 0.75 }]}>
                                        {accidentData.attributions.join(' · ')}
                                    </Text>
                                )}
                            </>
                        )}

                    </Animated.View>
                </TouchableOpacity>
            </Modal>

            {canReport && !miniMap && !hideControls && currentPosition && (
                <TouchableOpacity
                    style={[styles.mapButton, styles.reportButton, androidButtonBg, { bottom: 140 + bottomInset }]}
                    onPress={() => {
                        if (!currentPosition) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                            Alert.alert(
                                "Position introuvable",
                                "Veuillez patienter pendant la recherche de votre position GPS."
                            );
                            return;
                        }
                        setIsReportMenuVisible(true);
                        Haptics.selectionAsync();
                    }}
                >
                    <MapButtonFrost />
                    <Ionicons name="warning-outline" size={26} color={colors.textMain} />
                </TouchableOpacity>
            )}

            <Modal
                visible={isReportMenuVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={closeReport}
            >
                <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.reportOverlay}>

                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={closeReport}
                    />

                    <Reanimated.View style={[styles.modalContainer, { backgroundColor: colors.bgSurface }, reportSheetStyle]}>

                        <GestureDetector gesture={reportGesture}>
                        <View>
                            <GrabHandle />
                            <View style={styles.header}>
                                <Text style={[typography.h1, { fontSize: 20, lineHeight: 24, color: colors.textMain }]}>Signaler un incident</Text>
                                <TouchableOpacity onPress={closeReport}>
                                    <Ionicons name="close" size={28} color={colors.textMain} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        </GestureDetector>

                        <Text style={[typography.body, { color: colors.textSecondary, marginBottom: 15 }]}>
                            {"Quel type d'incident rencontrez-vous ?"}
                        </Text>

                        <View style={styles.grid}>
                            {REPORT_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[
                                        styles.typeCard,
                                        { backgroundColor: colors.bgMain, borderColor: colors.borderLight },
                                        selectedReportType === type.id && { borderColor: colors.primary, backgroundColor: colors.primaryLight }
                                    ]}
                                    onPress={() => {
                                        setSelectedReportType(type.id);
                                        Haptics.selectionAsync();
                                    }}
                                >
                                    <Image
                                        source={REPORT_IMAGES[`report-${type.id}`]}
                                        style={styles.typeIcon}
                                        resizeMode="contain"
                                    />
                                    <Text style={[typography.body, { fontSize: 14, fontWeight: selectedReportType === type.id ? 'bold' : 'normal', color: colors.textMain }]}>
                                        {t(`carte.signalement.${type.id}`)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={[styles.input, typography.body, { backgroundColor: colors.bgMain, color: colors.textMain, borderColor: colors.borderLight }]}
                            placeholder="Description (optionnel)..."
                            placeholderTextColor={colors.textSecondary}
                            value={reportDescription}
                            onChangeText={setReportDescription}
                            multiline
                            maxLength={100}
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: selectedReportType ? colors.primary : colors.borderStrong }]}
                            disabled={!selectedReportType}
                            onPress={() => {
                                handleReportSubmit({
                                    reportType: selectedReportType,
                                    description: reportDescription,
                                    lat: currentPosition.lat,
                                    lon: currentPosition.lon
                                });
                                Haptics.selectionAsync();
                            }}
                        >
                            <Text style={[typography.body, { color: '#FFF', fontWeight: 'bold' }]}>
                                Envoyer le signalement
                            </Text>
                        </TouchableOpacity>

                    </Reanimated.View>
                </KeyboardAvoidingView>
                </GestureHandlerRootView>
            </Modal>

            <Modal
                visible={!!activeReport}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setActiveReport(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setActiveReport(null)}
                >
                    <View onStartShouldSetResponder={() => true} style={[styles.modalContent, { backgroundColor: colors.bgMain, width: '90%' }]}>

                        <View style={styles.header}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                                {activeReport && (
                                    <Image
                                        source={REPORT_IMAGES[`report-${activeReport.report_type}`] || REPORT_IMAGES['report-danger']}
                                        style={{ width: 30, height: 30 }}
                                        resizeMode="contain"
                                    />
                                )}
                                <Text style={[typography.h1, { fontSize: 20, lineHeight: 24, color: colors.textMain, textTransform: 'capitalize', flex: 1 }]}>
                                    {activeReport?.report_type}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setActiveReport(null)}>
                                <Ionicons name="close" size={28} color={colors.textMain} />
                            </TouchableOpacity>
                        </View>

                        {activeReport?.report_description ? (
                            <Text style={[typography.body, { color: colors.textSecondary, marginBottom: 12 }]}>
                                {activeReport.report_description}
                            </Text>
                        ) : null}

                        <View style={{ flexDirection: 'row', gap: 20, marginBottom: 16 }}>
                            <Text style={[typography.body, { color: colors.textSecondary }]}>
                                👍 {activeReport?.confirmations_count ?? 0} là
                            </Text>
                            <Text style={[typography.body, { color: colors.textSecondary }]}>
                                👎 {activeReport?.denials_count ?? 0} pas là
                            </Text>
                        </View>

                        {token && activeReport && activeReport.user_id !== user?.id && (
                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                                <TouchableOpacity
                                    style={[styles.submitButton, { flex: 1, backgroundColor: '#2f9e44' }]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        handleVoteReport(activeReport.id, true);
                                    }}
                                >
                                    <Text style={[typography.body, { color: '#FFF', fontWeight: 'bold' }]}>Confirmer</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.submitButton, { flex: 1, backgroundColor: colors.bgSurface, borderWidth: 2, borderColor: colors.error }]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        handleVoteReport(activeReport.id, false);
                                    }}
                                >
                                    <Text style={[typography.body, { color: colors.error, fontWeight: 'bold' }]}>Pas là</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {token && activeReport && activeReport.user_id !== user?.id && (
                            <TouchableOpacity
                                style={styles.abuseLink}
                                onPress={() => setAbuseTarget(activeReport)}
                                accessibilityRole="button"
                                accessibilityLabel="Signaler ce contenu"
                            >
                                <Ionicons name="flag-outline" size={15} color={colors.textSecondary} />
                                <Text style={[styles.abuseLinkText, { color: colors.textSecondary }]}>
                                    Signaler ce contenu
                                </Text>
                            </TouchableOpacity>
                        )}

                        {activeReport && activeReport.user_id === user?.id && (
                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: colors.error }]}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    handleDeleteReport(activeReport.id);
                                    setActiveReport(null);
                                }}
                            >
                                <Text style={[typography.body, { color: '#FFF', fontWeight: 'bold' }]}>
                                    Supprimer ce signalement
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

            <ReportAbuseModal
                visible={!!abuseTarget}
                status={abuseStatus}
                onClose={closeAbuseModal}
                onReport={handleReportAbuse}
                onBlock={handleBlockAuthor}
            />

            <Modal
                visible={!!activePoi}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setActivePoi(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setActivePoi(null)}
                >
                    <View onStartShouldSetResponder={() => true} style={[styles.modalContent, { backgroundColor: colors.bgMain, width: '90%' }]}>
                        {activePoi && (() => {
                            const category = POI_CATEGORIES.find(c => c.id === activePoi.category);
                            const details = POI_DETAIL_FIELDS
                                .filter(field => field.except !== activePoi.category
                                    && activePoi[field.key] !== undefined && activePoi[field.key] !== null)
                                .map((field) => {
                                    const brut = (field.format || formatPoiTag)(activePoi[field.key]);
                                    // `format` rend une clé quand la valeur est un identifiant connu,
                                    // la donnée elle-même sinon (horaires, capacité).
                                    // i18n-exempt: `brut` est une clé de catalogue produite juste au-dessus
                                    const valeur = typeof brut === 'string' && brut.startsWith('carte.') ? t(brut) : brut;
                                    return `${t(`carte.champPoi.${field.key}`)} : ${valeur}`;
                                });
                            return (
                                <>
                                    <View style={styles.header}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                                            <View style={[styles.poiBadge, { backgroundColor: poiAccentColor(activePoi, category?.color) }]}>
                                                <MaterialCommunityIcons name={category?.icon} size={18} color="#FFF" />
                                            </View>
                                            <Text style={[typography.h1, { fontSize: 18, lineHeight: 22, color: colors.textMain, flex: 1 }]} numberOfLines={2}>
                                                {activePoi.name || (category && t(`carte.poi.${category.id}`))}
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setActivePoi(null)}>
                                            <Ionicons name="close" size={28} color={colors.textMain} />
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={[typography.body, { color: colors.textSecondary, marginBottom: details.length ? 8 : 20 }]}>
                                        {category && t(`carte.poi.${category.id}`)}
                                    </Text>

                                    {details.map(detail => (
                                        <Text key={detail} style={[typography.body, { fontSize: 13, color: colors.textSecondary, marginBottom: 4 }]}>
                                            {detail}
                                        </Text>
                                    ))}

                                    {onNavigateToPoi && (
                                        <TouchableOpacity
                                            style={[styles.submitButton, { backgroundColor: colors.primary, marginTop: 16 }]}
                                            onPress={handleNavigateToPoi}
                                        >
                                            <Text style={[typography.body, { color: '#FFF', fontWeight: 'bold' }]}>
                                                Y aller
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            );
                        })()}
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={!!activeAccident}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setActiveAccident(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setActiveAccident(null)}
                >
                    <View onStartShouldSetResponder={() => true} style={[styles.modalContent, { backgroundColor: colors.bgMain, width: '90%' }]}>
                        {activeAccident && (() => {
                            const date = formatAccidentDate(activeAccident);
                            const details = ACCIDENT_DETAIL_FIELDS
                                .filter(field => activeAccident[field.key])
                                .map(field => `${t(`carte.champAccident.${field.key}`)} : ${activeAccident[field.key]}`);
                            const color = activeAccident.severity >= 10 ? '#7f1d1d'
                                : activeAccident.severity >= 3 ? '#dc2626' : '#f97316';
                            return (
                                <>
                                    <View style={styles.header}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                                            <View style={[styles.poiBadge, { backgroundColor: color }]}>
                                                <MaterialCommunityIcons name="alert-octagon" size={18} color="#FFF" />
                                            </View>
                                            <Text style={[typography.h1, { fontSize: 18, lineHeight: 22, color: colors.textMain, flex: 1 }]} numberOfLines={2}>
                                                Accident à vélo
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setActiveAccident(null)}>
                                            <Ionicons name="close" size={28} color={colors.textMain} />
                                        </TouchableOpacity>
                                    </View>

                                    {date && (
                                        <Text style={[typography.body, { color: colors.textSecondary, marginBottom: 8 }]}>
                                            {date}
                                        </Text>
                                    )}

                                    {activeAccident.severity_label && (
                                        <Text style={[typography.body, { fontSize: 13, color: colors.textSecondary, marginBottom: 4 }]}>
                                            {`Gravité : ${activeAccident.severity_label}`}
                                        </Text>
                                    )}

                                    {details.map(detail => (
                                        <Text key={detail} style={[typography.body, { fontSize: 13, color: colors.textSecondary, marginBottom: 4 }]}>
                                            {detail}
                                        </Text>
                                    ))}
                                </>
                            );
                        })()}
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={!!activeStation}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setActiveStation(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setActiveStation(null)}
                >
                    <View onStartShouldSetResponder={() => true} style={[styles.modalContent, { backgroundColor: colors.bgMain, width: '90%' }]}>
                        {activeStation && (() => {
                            const isOff = activeStation.is_renting === false || activeStation.is_installed === false;
                            const bikes = activeStation.bikes_available;
                            const color = bikeshareAccentColor(activeStation);
                            const present = (key) => activeStation[key] !== undefined
                                && activeStation[key] !== null;
                            const ventile = present('bikes_mechanical') || present('bikes_electric');
                            const counts = (ventile
                                ? BIKESHARE_COUNT_FIELDS
                                : [BIKESHARE_TOTAL_FIELD, BIKESHARE_COUNT_FIELDS[2]]
                            ).filter(f => present(f.key));
                            const parts = bikeshareShare(activeStation, ventile);
                            const tones = BIKESHARE_TONES[isDark ? 'dark' : 'light'];
                            return (
                                <>
                                    <View style={styles.header}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                                            {BIKESHARE_LOGOS[activeStation.system] ? (
                                                <View style={styles.bikeshareLogo}>
                                                    <Image
                                                        source={BIKESHARE_LOGOS[activeStation.system]}
                                                        style={{ width: 48, height: 20 }}
                                                        resizeMode="contain"
                                                    />
                                                </View>
                                            ) : (
                                                <View style={[styles.poiBadge, { backgroundColor: color }]}>
                                                    <MaterialCommunityIcons name="bicycle" size={18} color="#FFF" />
                                                </View>
                                            )}
                                            <Text style={[typography.h1, { fontSize: 18, lineHeight: 22, color: colors.textMain, flex: 1 }]} numberOfLines={2}>
                                                {activeStation.name || 'Station de vélos'}
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setActiveStation(null)}>
                                            <Ionicons name="close" size={28} color={colors.textMain} />
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={[typography.body, { color: colors.textSecondary, marginBottom: 8 }]}>
                                        {isOff
                                            ? 'Station hors service'
                                            : bikes == null
                                                ? 'Disponibilité inconnue'
                                                : `${bikes} vélo${bikes > 1 ? 's' : ''} disponible${bikes > 1 ? 's' : ''}`}
                                    </Text>

                                    {counts.length > 0 && (
                                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, opacity: isOff ? 0.45 : 1 }}>
                                            {counts.map(field => (
                                                <View
                                                    key={field.key}
                                                    style={[styles.bikeshareCount, { backgroundColor: withAlpha(tones[field.tone], 0.14) }]}
                                                >
                                                    <View style={styles.bikeshareCountTop}>
                                                        <MaterialCommunityIcons
                                                            name={field.icon}
                                                            size={15}
                                                            color={tones[field.tone]}
                                                        />
                                                        <Text style={[typography.h1, { fontSize: 20, color: tones[field.tone] }]}>
                                                            {String(activeStation[field.key])}
                                                        </Text>
                                                    </View>
                                                    <Text style={[typography.body, { fontSize: 11, color: colors.textSecondary, textAlign: 'center' }]}>
                                                        {t(`carte.vls.${field.key}`)}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {parts && !isOff && (
                                        <View style={styles.bikeshareBar}>
                                            {[
                                                ['mechanical', parts.mecha],
                                                ['electric', parts.elec],
                                                ['mechanical', parts.autres],
                                                ['docks', parts.docks],
                                                ['indispo', parts.indispo],
                                            ].map(([tone, part], index) => part > 0 && (
                                                <View
                                                    key={index}
                                                    style={[styles.bikeshareBarPart, { flexGrow: part, backgroundColor: tones[tone] }]}
                                                />
                                            ))}
                                        </View>
                                    )}
                                    {parts && !isOff && parts.indispoNotable && (
                                        <Text style={[typography.body, { fontSize: 13, color: '#b45309', fontWeight: 'bold', marginBottom: 4 }]}>
                                            {`${parts.indispo} points d'attache indisponibles.`}
                                        </Text>
                                    )}

                                    {isOff && (
                                        <Text style={[typography.body, { fontSize: 13, color: '#b45309', fontWeight: 'bold', marginBottom: 4 }]}>
                                            Ni retrait ni retour possible.
                                        </Text>
                                    )}
                                    {!isOff && activeStation.is_returning === false && (
                                        <Text style={[typography.body, { fontSize: 13, color: '#b45309', fontWeight: 'bold', marginBottom: 4 }]}>
                                            Retour de vélo impossible.
                                        </Text>
                                    )}
                                    {!isOff && activeStation.is_returning !== false && activeStation.docks_available === 0 && (
                                        <Text style={[typography.body, { fontSize: 13, color: '#b45309', fontWeight: 'bold', marginBottom: 4 }]}>
                                            Station pleine : aucun retour possible.
                                        </Text>
                                    )}

                                    {activeStation.capacity != null && (
                                        <Text style={[typography.body, { fontSize: 13, color: colors.textSecondary, marginBottom: 4 }]}>
                                            {`Capacité : ${activeStation.capacity} points d'attache`}
                                        </Text>
                                    )}
                                    {activeStation.system_name ? (
                                        <Text style={[typography.body, { fontSize: 13, color: colors.textSecondary, marginBottom: 4 }]}>
                                            {`Réseau : ${activeStation.system_name}`}
                                        </Text>
                                    ) : null}
                                    {activeStation.stale && (
                                        <Text style={[typography.body, { fontSize: 12, color: colors.textSecondary }]}>
                                            Dernier relevé disponible, données non rafraîchies.
                                        </Text>
                                    )}

                                    {onNavigateToPoi && (
                                        <TouchableOpacity
                                            style={[styles.submitButton, { backgroundColor: colors.primary, marginTop: 16 }]}
                                            onPress={handleNavigateToStation}
                                        >
                                            <Text style={[typography.body, { color: '#FFF', fontWeight: 'bold' }]}>
                                                Y aller
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            );
                        })()}
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={!!activeAirStation}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setActiveAirStation(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setActiveAirStation(null)}
                >
                    <View onStartShouldSetResponder={() => true} style={[styles.modalContent, { backgroundColor: colors.bgMain, width: '90%' }]}>
                        {activeAirStation && (
                            <>
                                <View style={styles.header}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                                        <View style={[styles.poiBadge, { backgroundColor: activeAirStation.color || '#9ca3af' }]}>
                                            <MaterialCommunityIcons name="weather-windy" size={18} color="#FFF" />
                                        </View>
                                        <Text style={[typography.h1, { fontSize: 18, lineHeight: 22, color: colors.textMain, flex: 1 }]} numberOfLines={2}>
                                            {`AQI ${activeAirStation.aqi} · ${activeAirStation.label}`}
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setActiveAirStation(null)}>
                                        <Ionicons name="close" size={28} color={colors.textMain} />
                                    </TouchableOpacity>
                                </View>

                                {activeAirStation.name ? (
                                    <Text style={[typography.body, { color: colors.textMain, marginBottom: 8 }]}>
                                        {activeAirStation.name}
                                    </Text>
                                ) : null}

                                <Text style={[typography.body, { fontSize: 13, color: colors.textSecondary, marginBottom: 4 }]}>
                                    Capteur au sol · échelle AQI US
                                </Text>

                                {activeAirStation.time ? (
                                    <Text style={[typography.body, { fontSize: 13, color: colors.textSecondary }]}>
                                        {`Relevé : ${activeAirStation.time}`}
                                    </Text>
                                ) : null}
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    abuseLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    abuseLinkText: { fontSize: 13, textDecorationLine: 'underline' },
    container: { flex: 1 },
    map: { flex: 1 },
    mapButton: {
        height: 50,
        width: 50,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapButtonFrost: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 25,
        overflow: 'hidden',
    },
    layerButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
    },
    weatherPill: {
        position: 'absolute',
        right: 20,
        alignItems: 'flex-end',
        zIndex: 9,
    },
    recenterButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
    },
    poiButton: {
        position: 'absolute',
        bottom: 80,
        left: 20,
    },
    reportButton: {
        position: 'absolute',
        bottom: 140,
        left: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        borderRadius: 20,
        padding: 20,
        width: '80%',
        alignItems: 'flex-start',
    },
    lightingInfoCard: {
        borderRadius: 20,
        padding: 20,
        width: '88%',
        maxHeight: '80%',
        alignItems: 'flex-start',
    },
    lightingInfoText: {
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 10,
    },
    lightingInfoSource: {
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 4,
    },
    lightingInfoClose: {
        alignSelf: 'stretch',
        alignItems: 'center',
        paddingVertical: 11,
        borderRadius: 12,
        marginTop: 6,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    themeSelector: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
        width: '100%',
    },
    themeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    themeBtnActive: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    themeBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginBottom: 10,
    },
    layerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        width: '100%',
    },
    layerEmoji: {
        fontSize: 22,
    },
    poiOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        width: '100%',
        gap: 4,
    },
    layerNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 15,
        gap: 6,
    },
    poiSubOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 2,
        paddingLeft: 46,
        width: '100%',
    },
    poiSubDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    poiBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bikeshareLogo: {
        width: 52,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bikeshareCount: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderRadius: 8,
    },
    bikeshareCountTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    bikeshareBar: {
        flexDirection: 'row',
        gap: 3,
        height: 7,
        marginBottom: 12,
    },
    bikeshareBarPart: {
        flexBasis: 0,
        minWidth: 4,
        borderRadius: 3.5,
    },
    layerText: {
        fontSize: 16,
        marginLeft: 15,
    },
    activeLayerText: {
        fontWeight: 'bold',
    },
    reportOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 25,
        paddingBottom: 40
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20
    },
    typeCard: {
        width: '48%',
        padding: 15,
        borderRadius: 15,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeIcon: {
        width: 40,
        height: 40,
        marginBottom: 5
    },
    input: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 15,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    submitButton: {
        padding: 16,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center'
    },
    reportDetailCard: {
        borderRadius: 24,
        padding: 20,
        width: '88%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
    },
    reportDetailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 15,
        borderBottomWidth: 1,
        marginBottom: 15,
    },
    closeButton: {
        padding: 6,
        borderRadius: 20,
    },
    reportDescription: {
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
    },
    deleteButton: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navPuck: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [
            { rotateX: '55deg' }
        ],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
    }
});
