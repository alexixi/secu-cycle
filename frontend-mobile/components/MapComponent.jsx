import { useRef, useState, useEffect, useMemo, use } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, Text, Image, Animated, Dimensions, Alert, KeyboardAvoidingView, Platform, TextInput, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Map, Camera, ViewAnnotation, GeoJSONSource, Layer, Images, NativeUserLocation } from '@maplibre/maplibre-react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { getReports, getPois, getAccidents, createReport, deleteReport, voteReport } from '../services/apiBack';
import { useAuth } from '../context/AuthContext';
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
    { id: 'water', label: "Points d'eau", icon: 'water', color: '#0EA5E9' },
    { id: 'toilets', label: 'Toilettes', icon: 'toilet', color: '#8B5CF6', subTypes: TOILET_TYPES, subTypeProp: 'toilet_fee' },
    { id: 'parking', label: 'Parkings vélo', icon: 'bicycle', color: '#22C55E', subTypes: PARKING_TYPES, subTypeProp: 'parking_type' },
    { id: 'repair', label: 'Réparation', icon: 'wrench', color: '#F97316', subTypes: REPAIR_TYPES, subTypeProp: 'repair_kind' },
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
    { label: 'Accident mortel', color: '#7f1d1d' },
    { label: 'Blessé hospitalisé', color: '#dc2626' },
    { label: 'Blessé léger', color: '#f97316' },
];

const ACCIDENT_DETAIL_FIELDS = [
    { key: 'light', label: 'Luminosité' },
    { key: 'weather', label: 'Météo' },
    { key: 'collision', label: 'Type de collision' },
    { key: 'road_type', label: 'Type de voie' },
    { key: 'intersection', label: 'Intersection' },
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

    const androidButtonBg = Platform.OS === 'android'
        ? { backgroundColor: withAlpha(colors.bgSurface, 0.9) }
        : null;
    const { token, user } = useAuth();

    const MAP_STYLES = [
        { id: "base", lightId: "base-v4", darkId: "base-v4-dark", label: "Basic", icon: "🍃" },
        { id: "streets", lightId: "streets-v4", darkId: "streets-v4-dark", label: "Rues", icon: "🛣️" },
        { id: "outdoor", lightId: "outdoor-v4", darkId: "outdoor-v4-dark", label: "Outdoor", icon: "🚴" },
        { id: "topo", lightId: "topo-v4", darkId: "topo-v4-dark", label: "Relief", icon: "⛰️" },
        { id: "hybrid", lightId: "hybrid-v4", darkId: "hybrid-v4", label: "Satellite", icon: "🛰️" },
        { id: "openstreetmap", lightId: "openstreetmap", darkId: "openstreetmap", label: "Détaillée", icon: "🗺️" },
    ];

    const REPORT_TYPES = [
        { id: 'accident', label: 'Accident' },
        { id: 'travaux', label: 'Travaux' },
        { id: 'danger', label: 'Danger' },
        { id: 'obstacle', label: 'Obstacle' },
    ];

    const [activeBaseStyle, setActiveBaseStyle] = useState("base");
    const [mapThemeMode, setMapThemeMode] = useState("auto");
    const [isLayerMenuVisible, setLayerMenuVisible] = useState(false);
    const [isReportMenuVisible, setIsReportMenuVisible] = useState(false);
    const [selectedReportType, setSelectedReportType] = useState(null);
    const [reportDescription, setReportDescription] = useState("");
    const [reports, setReports] = useState([]);
    const [activeReport, setActiveReport] = useState(null);
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
        getReports().then(setReports).catch(console.error);
    }, []);

    const activeRoute = useMemo(
        () => itineraires?.find(it => it.id === selectedItineraire) || null,
        [itineraires, selectedItineraire],
    );

    const { activeAlert, dismissAlert } = useHazardAlerts(
        reports, currentPosition, activeRoute, isNavigating,
    );

    useEffect(() => {
        const loadSavedPreferences = async () => {
            const savedBase = await AsyncStorage.getItem('userMapBaseStyle');
            const savedTheme = await AsyncStorage.getItem('userMapThemeMode');
            const savedPois = await AsyncStorage.getItem('userMapPois');
            const savedSubTypes = await AsyncStorage.getItem('userMapSubTypes');
            const savedAccidents = await AsyncStorage.getItem('userMapAccidents');
            if (savedBase) setActiveBaseStyle(savedBase);
            if (savedTheme) setMapThemeMode(savedTheme);
            setShowAccidents(savedAccidents === 'true');
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
                // Une collection vide n'est pas un succès à mémoriser : c'est le cas
                // d'un profil pas encore synchronisé. Sans cette remise à zéro, il
                // faudrait relancer l'appli pour revoir la couche après la synchro.
                if (!collection?.features?.length) accidentCacheRef.current = false;
            })
            .catch(error => {
                accidentCacheRef.current = false;  // autorise une nouvelle tentative
                console.error("Erreur chargement des accidents :", error);
            });
    }, [showAccidents, miniMap]);

    const handleAccidentsToggle = () => {
        const next = !showAccidents;
        setShowAccidents(next);
        if (!next) setActiveAccident(null);
        AsyncStorage.setItem('userMapAccidents', String(next));
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
            name: activePoi.name || POI_CATEGORIES.find(c => c.id === activePoi.category)?.label,
        });
        setActivePoi(null);
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
                compassPosition={{ bottom: 80 + bottomInset, right: 20 }}
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

                {!miniMap && showAccidents && !!accidentData && (
                    <GeoJSONSource id="accidents" data={accidentData} onPress={onAccidentPress}>
                        {/* Densité aux zooms larges : plusieurs centaines de points
                            se recouvrent et ne disent plus rien un par un. */}
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
                    <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }], backgroundColor: colors.bgMain }]}>

                        <Text style={[styles.modalTitle, typography.h1, { fontSize: 20, color: colors.textMain }]}>Apparence</Text>

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
                                    {style.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
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
                    <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }], backgroundColor: colors.bgMain }]}>

                        <Text style={[styles.modalTitle, typography.h1, { fontSize: 20, color: colors.textMain }]}>{"Points d'intérêt"}</Text>

                        {POI_CATEGORIES.map((category) => (
                            <View key={category.id} style={{ width: '100%' }}>
                                <View style={styles.poiOption}>
                                    <View style={[styles.poiBadge, { backgroundColor: category.color }]}>
                                        <MaterialCommunityIcons name={category.icon} size={18} color="#FFF" />
                                    </View>
                                    <Text style={[styles.layerText, typography.body, { flex: 1, color: colors.textMain }]}>
                                        {category.label}
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
                                            {subType.label}
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

                        {/* Séparé des POI : ce ne sont ni des équipements, ni des
                            signalements d'utilisateurs, mais des accidents
                            officiellement recensés. Les confondre induirait en erreur. */}
                        <View style={[styles.divider, { marginTop: 14 }]} />

                        <Text style={[styles.modalTitle, typography.h1, { fontSize: 20, color: colors.textMain }]}>
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
                                    <View key={item.label} style={styles.poiSubOption}>
                                        <View style={[styles.poiSubDot, { backgroundColor: item.color }]} />
                                        <Text style={[typography.body, { flex: 1, fontSize: 14, color: colors.textSecondary }]}>
                                            {item.label}
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
                                <Text style={[typography.h1, { fontSize: 20, color: colors.textMain }]}>Signaler un incident</Text>
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
                                        {type.label}
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
                    <View style={[styles.modalContent, { backgroundColor: colors.bgMain, width: '90%' }]}>

                        <View style={styles.header}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                                {activeReport && (
                                    <Image
                                        source={REPORT_IMAGES[`report-${activeReport.report_type}`] || REPORT_IMAGES['report-danger']}
                                        style={{ width: 30, height: 30 }}
                                        resizeMode="contain"
                                    />
                                )}
                                <Text style={[typography.h1, { fontSize: 20, color: colors.textMain, textTransform: 'capitalize', flex: 1 }]}>
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
                    <View style={[styles.modalContent, { backgroundColor: colors.bgMain, width: '90%' }]}>
                        {activePoi && (() => {
                            const category = POI_CATEGORIES.find(c => c.id === activePoi.category);
                            const details = POI_DETAIL_FIELDS
                                .filter(field => field.except !== activePoi.category
                                    && activePoi[field.key] !== undefined && activePoi[field.key] !== null)
                                .map(field => `${field.label} : ${(field.format || formatPoiTag)(activePoi[field.key])}`);
                            return (
                                <>
                                    <View style={styles.header}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                                            <View style={[styles.poiBadge, { backgroundColor: poiAccentColor(activePoi, category?.color) }]}>
                                                <MaterialCommunityIcons name={category?.icon} size={18} color="#FFF" />
                                            </View>
                                            <Text style={[typography.h1, { fontSize: 18, color: colors.textMain, flex: 1 }]} numberOfLines={2}>
                                                {activePoi.name || category?.label}
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setActivePoi(null)}>
                                            <Ionicons name="close" size={28} color={colors.textMain} />
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={[typography.body, { color: colors.textSecondary, marginBottom: details.length ? 8 : 20 }]}>
                                        {category?.label}
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
                    <View style={[styles.modalContent, { backgroundColor: colors.bgMain, width: '90%' }]}>
                        {activeAccident && (() => {
                            const date = formatAccidentDate(activeAccident);
                            const details = ACCIDENT_DETAIL_FIELDS
                                .filter(field => activeAccident[field.key])
                                .map(field => `${field.label} : ${activeAccident[field.key]}`);
                            const color = activeAccident.severity >= 10 ? '#7f1d1d'
                                : activeAccident.severity >= 3 ? '#dc2626' : '#f97316';
                            return (
                                <>
                                    <View style={styles.header}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                                            <View style={[styles.poiBadge, { backgroundColor: color }]}>
                                                <MaterialCommunityIcons name="alert-octagon" size={18} color="#FFF" />
                                            </View>
                                            <Text style={[typography.h1, { fontSize: 18, color: colors.textMain, flex: 1 }]} numberOfLines={2}>
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
        </View>
    );
}

const styles = StyleSheet.create({
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
