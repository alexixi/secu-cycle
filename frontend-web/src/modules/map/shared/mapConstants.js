// Constantes, expressions de style MapLibre et helpers purs partagés entre la carte
// d'itinéraire (MapComponent) et les cartes thématiques SEO (ThematicMap).
//
// Règle : ce module ne contient que du code sans état — aucune référence à React, aucun
// accès au DOM. Toute constante utilisée par les deux cartes doit vivre ici et non être
// dupliquée, pour que les deux rendus restent visuellement identiques.

import { FaBicycle } from 'react-icons/fa';
import { MdElectricBike, MdLocalParking } from 'react-icons/md';

/* ------------------------------------------------------------------ fonds de carte */

export const MAP_STYLES = [
    { id: "base", lightId: "base-v4", darkId: "base-v4-dark", label: "Basic", icon: "🍃" },
    { id: "streets", lightId: "streets-v4", darkId: "streets-v4-dark", label: "Rues", icon: "🛣️" },
    { id: "outdoor", lightId: "outdoor-v4", darkId: "outdoor-v4-dark", label: "Outdoor", icon: "🚴" },
    { id: "topo", lightId: "topo-v4", darkId: "topo-v4-dark", label: "Relief", icon: "⛰️" },
    { id: "hybrid", lightId: "hybrid-v4", darkId: "hybrid-v4", label: "Satellite", icon: "🛰️" },
    { id: "openstreetmap", lightId: "openstreetmap", darkId: "openstreetmap", label: "Détaillée", icon: "🗺️" },
];

// Construit l'URL MapTiler du fond choisi. `theme` vaut 'dark' ou autre chose.
export function mapStyleUrl(styleId, theme) {
    const config = MAP_STYLES.find(s => s.id === styleId) || MAP_STYLES[0];
    const id = theme === 'dark' ? config.darkId : config.lightId;
    return `https://api.maptiler.com/maps/${id}/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`;
}

export const RELATIVE_TIME_FR = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });

/* ------------------------------------------------------------------------- POI */

export const PARKING_TYPES = [
    { id: 'stands', label: 'Arceaux', color: '#22C55E' },
    { id: 'racks', label: 'Râteliers, pince-roues', color: '#0D9488' },
    { id: 'shelter', label: 'Abris et consignes', color: '#15803D' },
    { id: 'other', label: 'Autres, non précisé', color: '#9CA3AF' },
];

export const TOILET_TYPES = [
    { id: 'free', label: 'Gratuites', color: '#EC4899' },
    { id: 'paid', label: 'Payantes', color: '#9F1239' },
    { id: 'unknown', label: 'Non précisé', color: '#8B5CF6' },
];

export const REPAIR_TYPES = [
    { id: 'selfservice', label: 'Libre-service', color: '#F97316' },
    { id: 'shop', label: 'Atelier / magasin', color: '#C2410C' },
];

export const POI_CATEGORIES = [
    { id: 'water', label: "Points d'eau", color: '#0EA5E9' },
    { id: 'toilets', label: 'Toilettes', color: '#8B5CF6', subTypes: TOILET_TYPES, subTypeProp: 'toilet_fee' },
    { id: 'parking', label: 'Parkings vélo', color: '#22C55E', subTypes: PARKING_TYPES, subTypeProp: 'parking_type' },
    { id: 'repair', label: 'Réparation', color: '#F97316', subTypes: REPAIR_TYPES, subTypeProp: 'repair_kind' },
];

export const DEFAULT_SUB_TYPES = Object.fromEntries(
    POI_CATEGORIES.filter(c => c.subTypes).map(c => [c.id, Object.fromEntries(c.subTypes.map(t => [t.id, true]))])
);

export const mergeSubTypes = (saved) => Object.fromEntries(
    Object.entries(DEFAULT_SUB_TYPES).map(([cat, defaults]) => [cat, { ...defaults, ...(saved?.[cat] || {}) }])
);

const poiImageModules = import.meta.glob('../../../assets/poi/*.png', { eager: true, import: 'default' });
export const POI_IMAGE_ASSETS = Object.entries(poiImageModules).map(([filePath, src]) => ({
    key: `poi-${filePath.split('/').pop().replace('.png', '')}`,
    src,
}));

const bikeshareImageModules = import.meta.glob('../../../assets/bikeshare/*.png', { eager: true, import: 'default' });
export const BIKESHARE_IMAGE_ASSETS = Object.entries(bikeshareImageModules).map(([filePath, src]) => ({
    key: filePath.split('/').pop().replace('.png', ''),
    src,
}));

const bikeshareLogoModules = import.meta.glob('../../../assets/bikeshare/logos/*.png', { eager: true, import: 'default' });
export const BIKESHARE_LOGOS = Object.fromEntries(
    Object.entries(bikeshareLogoModules)
        .map(([filePath, src]) => [filePath.split('/').pop().replace('.png', ''), src])
);

export const POI_IMAGE_SRC_BY_KEY = Object.fromEntries(
    [...POI_IMAGE_ASSETS, ...BIKESHARE_IMAGE_ASSETS].map(({ key, src }) => [key, src])
);

export const RESTRICTED_ACCESS = ['private', 'no', 'permit', 'employees', 'delivery', 'military', 'agricultural', 'forestry'];
export const OFF_COLOR = '#9CA3AF';
export const CUSTOMERS_COLOR = '#F59E0B';

export const isPoiUnavailable = (poi) => (
    RESTRICTED_ACCESS.includes(poi?.access)
    || poi?.disused === 'yes'
    || poi?.['disused:amenity'] != null
    || ['closed', 'off'].includes(poi?.opening_hours)
);

export const isPoiCustomers = (poi) => poi?.access === 'customers';

export const isPoiPaid = (poi) => (
    poi?.category === 'toilets'
        ? poi?.toilet_fee === 'paid'
        : (poi?.fee != null && poi.fee !== 'no' && poi.fee !== '')
);

export const poiStateSuffix = (poi) => (
    isPoiUnavailable(poi) ? '-off'
        : isPoiPaid(poi) ? '-paid'
            : isPoiCustomers(poi) ? '-customers'
                : ''
);

export const poiAccentColor = (poi, base) => (isPoiUnavailable(poi) ? OFF_COLOR : isPoiCustomers(poi) ? CUSTOMERS_COLOR : base);

export const poiIconSrc = (poi) => {
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
    return POI_IMAGE_SRC_BY_KEY[key + poiStateSuffix(poi)];
};

export const TOILET_FEE_LABELS = { free: 'Gratuit', paid: 'Payant', unknown: 'Non précisé' };

export const formatPoiTag = (value) => {
    if (value === 'yes') return 'Oui';
    if (value === 'no') return 'Non';
    return String(value);
};

export const POI_DETAIL_FIELDS = [
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

export const POI_LAYER_ID = 'pois-symbol';

// Miroir exact, côté expression MapLibre, de poiIconSrc + poiStateSuffix ci-dessus.
export const POI_ICON_IMAGE = ['concat',
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
        '']];

export const POI_LAYER_LAYOUT = {
    'icon-image': POI_ICON_IMAGE,
    'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.3, 13, 0.6, 17, 1.1],
    'icon-allow-overlap': false,
    'symbol-sort-key': ['match', ['get', 'category'], 'parking', 1, 0],
    'text-field': ['step', ['zoom'], '', 16, ['coalesce', ['get', 'name'], '']],
    'text-size': 11,
    'text-anchor': 'top',
    'text-offset': [0, 1.7],
    'text-allow-overlap': false,
    'text-optional': true,
};

export const poiLayerPaint = (theme) => ({
    'icon-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.45, 13, 0.7, 15, 1],
    'text-color': theme === 'dark' ? '#e5e7eb' : '#1f2937',
    'text-halo-color': theme === 'dark' ? '#111827' : '#ffffff',
    'text-halo-width': 1.2,
});

/* -------------------------------------------------------------------- éclairage */

export const LIT_ROADS_COLORS = { osm: '#ffcf3d', inferred: '#ffe39a' };
export const LIGHTING_LAMP_COLOR = '#ffc12d';

export const LIT_ROADS_COLOR = ['match', ['get', 'lit_source'],
    'inferred', LIT_ROADS_COLORS.inferred,
    LIT_ROADS_COLORS.osm];

export const LIGHTING_HEAT_LAYER_ID = 'lighting-heat';
export const LIT_ROADS_GLOW_LAYER_ID = 'lit-roads-glow';
export const LIT_ROADS_LINE_LAYER_ID = 'lit-roads-line';

export const LIGHTING_HEATMAP_PAINT = {
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

export const LIT_ROADS_GLOW_PAINT = {
    'line-color': LIT_ROADS_COLOR,
    'line-width': ['interpolate', ['exponential', 2], ['zoom'], 11, 4, 15, 5.3, 19, 85, 22, 680],
    'line-blur': ['interpolate', ['exponential', 2], ['zoom'], 11, 2, 15, 3, 19, 48, 22, 384],
    'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.12, 14, 0.3],
};

export const LIT_ROADS_LINE_PAINT = {
    'line-color': LIT_ROADS_COLOR,
    'line-width': ['interpolate', ['exponential', 2], ['zoom'], 11, 1.5, 15, 2.7, 19, 43, 22, 344],
    'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.5, 14, 0.85],
};

/* -------------------------------------------------------------------- accidents */

export const ACCIDENT_HEAT_LAYER_ID = 'accidents-heat';
export const ACCIDENT_POINT_LAYER_ID = 'accidents-point';
export const ACCIDENT_SWITCH_ZOOM = 13.5;

export const ACCIDENT_SEVERITY_COLOR = [
    'match', ['get', 'severity'],
    10, '#7f1d1d',
    3, '#dc2626',
    1, '#f97316',
    '#fbbf24',
];

export const ACCIDENT_LEGEND = [
    { label: 'Accident mortel', color: '#7f1d1d' },
    { label: 'Blessé hospitalisé', color: '#dc2626' },
    { label: 'Blessé léger', color: '#f97316' },
];

export const ACCIDENT_DETAIL_FIELDS = [
    { key: 'light', label: 'Luminosité' },
    { key: 'weather', label: 'Météo' },
    { key: 'collision', label: 'Type de collision' },
    { key: 'road_type', label: 'Type de voie' },
    { key: 'intersection', label: 'Intersection' },
];

export const formatAccidentDate = (properties) => {
    if (!properties?.date) return null;
    const parsed = new Date(properties.date);
    if (Number.isNaN(parsed.getTime())) return properties.date;
    const options = properties.date_precision === 'month'
        ? { month: 'long', year: 'numeric' }
        : { day: 'numeric', month: 'long', year: 'numeric' };
    return parsed.toLocaleDateString('fr-FR', options);
};

export const ACCIDENT_HEAT_PAINT = {
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
};

export const ACCIDENT_POINT_PAINT = {
    'circle-radius': ['interpolate', ['linear'], ['zoom'],
        ACCIDENT_SWITCH_ZOOM, 4, 17, 10],
    'circle-color': ACCIDENT_SEVERITY_COLOR,
    'circle-stroke-width': 1.5,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': ['interpolate', ['linear'], ['zoom'],
        ACCIDENT_SWITCH_ZOOM, 0, ACCIDENT_SWITCH_ZOOM + 1, 0.9],
    'circle-stroke-opacity': ['interpolate', ['linear'], ['zoom'],
        ACCIDENT_SWITCH_ZOOM, 0, ACCIDENT_SWITCH_ZOOM + 1, 1],
};

/* ---------------------------------------------------------------------- trafic */

export const TRAFFIC_LAYER_ID = 'traffic-line';
export const TRAFFIC_HITBOX_LAYER_ID = 'traffic-hitbox';

export const TRAFFIC_COLORS = { green: "#22c55e", orange: "#f97316", red: "#ef4444", gray: "#9ca3af" };

export const TRAFFIC_LABELS = {
    green: 'Circulation fluide',
    orange: 'Circulation dense',
    red: 'Axe embouteillé',
    gray: 'État inconnu',
};

export const TRAFFIC_CYCLIST_HINT = {
    orange: '🚲 Trafic ralenti : dépassements serrés et portières, restez visible.',
    red: '🚲 Axe évité par nos itinéraires sécurisés dès que possible.',
};

export const TRAFFIC_LINE_PAINT = {
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
};

/* ------------------------------------------------------------ vélos en libre-service */

export const BIKESHARE_ICON_LAYER_ID = 'bikeshare-icon';
export const BIKESHARE_HITBOX_LAYER_ID = 'bikeshare-hitbox';
export const BIKESHARE_BADGE_LAYER_ID = 'bikeshare-badge';

export const BIKESHARE_NAVY = '#312E81';

export const BIKESHARE_COLORS = {
    ok: '#16A34A',
    low: '#F97316',
    empty: '#EF4444',
    off: OFF_COLOR,
    full: '#166534',
};

export const BIKESHARE_IS_OFF = ['any',
    ['==', ['get', 'is_renting'], false],
    ['==', ['get', 'is_installed'], false]];

export const BIKESHARE_BIKES = ['coalesce', ['get', 'bikes_available'], -1];
export const BIKESHARE_DOCKS = ['coalesce', ['get', 'docks_available'], -1];

const BIKESHARE_STATE = (unknown, off, empty, full, low, ok) => ['case',
    BIKESHARE_IS_OFF, off,
    ['<', BIKESHARE_BIKES, 0], unknown,
    ['==', BIKESHARE_BIKES, 0], empty,
    ['==', BIKESHARE_DOCKS, 0], full,
    ['<=', BIKESHARE_BIKES, 2], low,
    ok];

export const BIKESHARE_ICON_IMAGE = BIKESHARE_STATE(
    'bikeshare-unknown', 'bikeshare-off', 'bikeshare-0',
    'bikeshare-3', 'bikeshare-1', 'bikeshare-2');

export const BIKESHARE_BADGE_IMAGE = BIKESHARE_STATE(
    '', '', 'bikeshare-badge-empty',
    'bikeshare-badge-full', 'bikeshare-badge-low', 'bikeshare-badge-ok');

export const BIKESHARE_HAS_BADGE = ['all',
    ['!', BIKESHARE_IS_OFF],
    ['>=', BIKESHARE_BIKES, 0]];

export const BIKESHARE_BADGE_TRANSLATE = ['interpolate', ['linear'], ['zoom'],
    10, ['literal', [4, -4]],
    12, ['literal', [7, -7]],
    14, ['literal', [10, -10]],
    16, ['literal', [12, -12]],
    18, ['literal', [14, -14]]];

export const BIKESHARE_COUNT_FIELDS = [
    { key: 'bikes_mechanical', label: 'Mécaniques', Icon: FaBicycle, tone: 'mechanical' },
    { key: 'bikes_electric', label: 'Électriques', Icon: MdElectricBike, tone: 'electric' },
    { key: 'docks_available', label: 'Places libres', Icon: MdLocalParking, tone: 'docks' },
];

export const BIKESHARE_TOTAL_FIELD = {
    key: 'bikes_available', label: 'Vélos', Icon: FaBicycle, tone: 'mechanical',
};

export const BIKESHARE_DETAIL_FIELDS = [
    { key: 'capacity', label: 'Capacité', format: (value) => `${value} points d'attache` },
    { key: 'system_name', label: 'Réseau' },
    { key: 'address', label: 'Adresse' },
];

export function bikeshareShare(station, ventile) {
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

export const formatStationFreshness = (lastReported) => {
    if (!lastReported) return null;
    const then = new Date(lastReported).getTime();
    if (Number.isNaN(then)) return null;
    const minutes = Math.round((Date.now() - then) / 60000);
    if (minutes < 1) return 'Données à jour';
    if (minutes < 60) return `Relevé ${RELATIVE_TIME_FR.format(-minutes, 'minute')}`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `Relevé ${RELATIVE_TIME_FR.format(-hours, 'hour')}`;
    return 'Relevé ancien, fiabilité incertaine';
};

export const BIKESHARE_HITBOX_PAINT = {
    'circle-color': 'transparent',
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 9, 12, 12, 14, 16, 16, 19, 18, 22],
};

export const BIKESHARE_ICON_LAYOUT = {
    'icon-image': BIKESHARE_ICON_IMAGE,
    'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.35, 12, 0.56, 14, 0.81, 16, 1, 18, 1.19],
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
};

export const BIKESHARE_ICON_PAINT = {
    'icon-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 13, 0.85, 15, 1],
};

export const BIKESHARE_BADGE_LAYOUT = {
    'icon-image': BIKESHARE_BADGE_IMAGE,
    'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.19, 12.99, 0.38, 13, 0.64, 16, 0.86, 18, 1],
    'text-field': ['step', ['zoom'], '', 13, ['to-string', BIKESHARE_BIKES]],
    'text-size': ['interpolate', ['linear'], ['zoom'], 13, 9, 16, 11, 18, 12],
    'icon-allow-overlap': ['step', ['zoom'], true, 13, false],
    'icon-ignore-placement': ['step', ['zoom'], true, 13, false],
};

export const BIKESHARE_BADGE_PAINT = {
    'icon-translate': BIKESHARE_BADGE_TRANSLATE,
    'text-translate': BIKESHARE_BADGE_TRANSLATE,
    'text-color': '#ffffff',
};
