// Registre langue-neutre des cartes thématiques.
//
// Ce module ne contient aucune phrase rédigée : uniquement de la géographie, des
// couches, des couleurs, des sources et des CLÉS de libellé. Le texte vit dans
// thematicMaps.<langue>.js pour l'éditorial et dans i18n/locales/<langue>/carte.json
// pour les libellés d'interface.
//
// La règle qui justifie ce découpage : la couche de calcul émet des clés, la couche
// de rendu émet des mots. C'est ce qui permet d'écrire `stats()` une seule fois pour
// toutes les langues, et de ne servir à chaque visiteur que le contenu de la sienne.
//
// Contrainte : JavaScript pur. Ce module est importé par le bundle Vite comme par les
// scripts Node de build. Pas d'import.meta.env, pas de JSX, pas de hook React.

export const SITE_URL = 'https://secu-cycle.fr';

/* ------------------------------------------------------------------ licences & sources */

// i18n-exempt-start: noms légaux de licences, titres officiels de jeux de données
// et noms d'opérateurs. La règle 3 du README interdit de les traduire — c'est ce
// qui garde /pois/ et /streetlights/ neutres en langue. Les formulations
// descriptives, elles, portent une `labelKey` et se traduisent.
export const ODBL = { label: 'ODbL', href: 'https://opendatacommons.org/licenses/odbl/' };
export const LO = { label: 'Licence Ouverte', href: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/' };
export const LO2 = { label: 'Licence Ouverte 2.0', href: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/' };
export const CCBY = { label: 'CC BY 4.0', href: 'https://creativecommons.org/licenses/by/4.0/deed.fr' };

export const SOURCE_OSM = {
    name: 'OpenStreetMap',
    detailKey: 'source.osm.detail',
    licence: ODBL,
    producer: { label: 'openstreetmap.org', href: 'https://www.openstreetmap.org/copyright' },
};

export const SOURCE_PTLUM = {
    name: 'Points lumineux',
    detail: 'Bordeaux Métropole',
    licence: LO,
    producer: {
        label: 'opendata.bordeaux-metropole.fr',
        href: 'https://opendata.bordeaux-metropole.fr/explore/dataset/bor_ptlum/',
    },
};

export const SOURCE_BAAC = {
    name: '« Accidents de vélo »',
    detailKey: 'source.baac.detail',
    licence: LO2,
    producer: { label: 'data.gouv.fr', href: 'https://www.data.gouv.fr/datasets/accidents-de-velo' },
};

export const SOURCE_STATBEL = {
    name: 'Géolocalisation des accidents de la circulation',
    detail: 'Statbel',
    licence: CCBY,
    producer: {
        label: 'statbel.fgov.be',
        href: 'https://statbel.fgov.be/fr/open-data/geolocalisation-des-accidents-de-la-circulation-2017-2024',
    },
};

export const SOURCE_GBFS = {
    name: 'Flux GBFS « Le Vélo »',
    detail: 'Bordeaux Métropole / Keolis',
    licence: { labelKey: 'source.licence.fluxOuvert' },
    producer: { label: 'gbfs.org', href: 'https://gbfs.org/' },
};

export const SOURCE_TRAFIC_BM = {
    name: 'Trafic temps réel',
    detail: 'Bordeaux Métropole',
    licence: LO,
    producer: {
        label: 'opendata.bordeaux-metropole.fr',
        href: 'https://opendata.bordeaux-metropole.fr/explore/dataset/ci_trafi_l/',
    },
};

export const SOURCE_TRAFIC_RENNES = {
    name: 'État du trafic en temps réel',
    detail: 'Rennes Métropole',
    licence: ODBL,
    producer: {
        label: 'data.rennesmetropole.fr',
        href: 'https://data.rennesmetropole.fr/explore/dataset/etat-du-trafic-en-temps-reel/',
    },
};

export const SOURCE_TRAFIC_NANTES = {
    name: 'Fluidité des axes routiers',
    detail: 'Nantes Métropole',
    licence: ODBL,
    producer: {
        label: 'data.nantesmetropole.fr',
        href: 'https://data.nantesmetropole.fr/explore/dataset/244400404_fluidite-axes-routiers-nantes-metropole/',
    },
};

export const SOURCE_LUM_NANTES = {
    name: 'Luminaires d’éclairage public',
    detail: 'Nantes Métropole',
    licence: LO,
    producer: {
        label: 'data.nantesmetropole.fr',
        href: 'https://data.nantesmetropole.fr/explore/dataset/244400404_luminaires-eclairage-public-nantes-metropole/',
    },
};

export const SOURCE_GBFS_RENNES = {
    name: 'Flux GBFS « LE vélo STAR »',
    detail: 'Rennes Métropole / STAR',
    licence: { labelKey: 'source.licence.fluxOuvert' },
    producer: { label: 'gbfs.org', href: 'https://gbfs.org/' },
};

export const SOURCE_GBFS_NANTES = {
    name: 'Flux GBFS « Naolib »',
    detail: 'Nantes Métropole / JCDecaux',
    licence: { labelKey: 'source.licence.fluxOuvert' },
    producer: { label: 'gbfs.org', href: 'https://gbfs.org/' },
};

export const SOURCE_GBFS_PARIS = {
    name: 'Flux GBFS « Vélib’ Métropole »',
    detail: 'Vélib’ Métropole / Smovengo',
    licence: { labelKey: 'source.licence.fluxOuvert' },
    producer: { label: 'gbfs.org', href: 'https://gbfs.org/' },
};

export const SOURCE_GBFS_LYON = {
    name: 'Flux GBFS « Vélo’v »',
    detail: 'Métropole de Lyon / JCDecaux',
    licence: { labelKey: 'source.licence.fluxOuvert' },
    producer: { label: 'gbfs.org', href: 'https://gbfs.org/' },
};

export const SOURCE_GBFS_LILLE = {
    name: 'Flux GBFS « V’Lille »',
    detail: 'Métropole Européenne de Lille / Ilévia',
    licence: { labelKey: 'source.licence.fluxOuvert' },
    producer: { label: 'gbfs.org', href: 'https://gbfs.org/' },
};

export const SOURCE_GBFS_STRASBOURG = {
    name: 'Flux GBFS « Vélhop »',
    detail: 'Strasbourg Mobilités Vélo / nextbike',
    licence: { labelKey: 'source.licence.fluxOuvert' },
    producer: { label: 'gbfs.org', href: 'https://gbfs.org/' },
};

export const SOURCE_GBFS_BRUXELLES = {
    name: 'Flux GBFS « Villo! »',
    detail: 'Bruxelles-Capitale / JCDecaux',
    licence: { labelKey: 'source.licence.fluxOuvert' },
    producer: { label: 'gbfs.org', href: 'https://gbfs.org/' },
};

export const SOURCE_GBFS_BLUEBIKE = {
    name: 'Flux GBFS « Blue-bike »',
    detail: 'Blue-mobility',
    licence: { labelKey: 'source.licence.fluxOuvert' },
    producer: { label: 'gbfs.org', href: 'https://gbfs.org/' },
};
// i18n-exempt-end

/* ------------------------------------------------------------------------ utilitaires */

export const countBy = (features, prop) => features.reduce((acc, f) => {
    const key = f?.properties?.[prop];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
}, {});

/* ----------------------------------------------------------------- villes (géographie) */
//
// Le libellé, la description et le texte d'introduction de chaque ville sont dans le
// registre éditorial, indexés par ce même `slug`.

export const CITIES = [
    {
        slug: 'bordeaux',
        name: 'Bordeaux',
        center: [-0.5795, 44.8378],
        zoom: 11.4,
        bbox: [-0.78, 44.71, -0.45, 44.95],
        // Le calculateur d'itinéraires travaille sur le graphe routier chargé en mémoire par
        // l'API, dont l'emprise est plus étroite que celle des données : une ville peut avoir
        // ses cartes sans être navigable. `routing: false` le dit dans le texte des pages
        // plutôt que de laisser un bouton « Calculer mon itinéraire » mener à une impasse.
        routing: true,
        themes: [
            'stationnements-velo',
            'toilettes-publiques',
            'points-eau',
            'eclairage-public',
            'velos-libre-service',
            'trafic-routier',
            'accidents-velo',
            'reparation-velo',
        ],
    },
    {
        slug: 'rennes',
        name: 'Rennes',
        center: [-1.6778, 48.1113],
        zoom: 11.4,
        // Reprise de l'emprise du fournisseur de trafic (backend/traffic/config.py,
        // « rennes-metropole ») : c'est la même convention qu'à Bordeaux.
        bbox: [-1.84, 47.99, -1.52, 48.21],
        routing: false,
        themes: [
            'stationnements-velo',
            'toilettes-publiques',
            'points-eau',
            'velos-libre-service',
            'trafic-routier',
            'accidents-velo',
            'reparation-velo',
        ],
    },
    {
        slug: 'nantes',
        name: 'Nantes',
        center: [-1.5536, 47.2184],
        zoom: 11.4,
        bbox: [-1.77, 47.11, -1.40, 47.35],
        routing: false,
        themes: [
            'stationnements-velo',
            'toilettes-publiques',
            'points-eau',
            'eclairage-public',
            'velos-libre-service',
            'trafic-routier',
            'accidents-velo',
            'reparation-velo',
        ],
    },
    {
        slug: 'paris',
        name: 'Paris',
        center: [2.3488, 48.8534],
        zoom: 10.8,
        // Emprise de la Métropole du Grand Paris, plus resserrée que la couverture
        // déclarée par le flux Vélib' (backend/bikeshare/config.py), qui déborde
        // sur toute l'Île-de-France centrale.
        bbox: [2.15, 48.70, 2.57, 48.98],
        routing: false,
        themes: [
            'stationnements-velo',
            'toilettes-publiques',
            'points-eau',
            'velos-libre-service',
            'accidents-velo',
            'reparation-velo',
        ],
    },
    {
        slug: 'lyon',
        name: 'Lyon',
        center: [4.8357, 45.7640],
        zoom: 11.2,
        bbox: [4.72, 45.63, 5.03, 45.92],
        routing: false,
        themes: [
            'stationnements-velo',
            'toilettes-publiques',
            'points-eau',
            'velos-libre-service',
            'accidents-velo',
            'reparation-velo',
        ],
    },
    {
        slug: 'lille',
        name: 'Lille',
        center: [3.0573, 50.6292],
        zoom: 10.9,
        bbox: [2.90, 50.55, 3.30, 50.80],
        routing: false,
        themes: [
            'stationnements-velo',
            'toilettes-publiques',
            'points-eau',
            'velos-libre-service',
            'accidents-velo',
            'reparation-velo',
        ],
    },
    {
        slug: 'strasbourg',
        name: 'Strasbourg',
        center: [7.7521, 48.5734],
        zoom: 11.2,
        bbox: [7.55, 48.45, 7.87, 48.68],
        routing: false,
        themes: [
            'stationnements-velo',
            'toilettes-publiques',
            'points-eau',
            'velos-libre-service',
            'accidents-velo',
            'reparation-velo',
        ],
    },
    {
        slug: 'tournai',
        name: 'Tournai',
        center: [3.3878, 50.6056],
        zoom: 10.6,
        bbox: [3.10, 50.48, 3.70, 50.82],
        routing: true,
        themes: [
            'stationnements-velo',
            'accidents-velo',
            'toilettes-et-points-eau',
        ],
    },
    {
        slug: 'bruxelles',
        name: 'Bruxelles',
        center: [4.3517, 50.8503],
        zoom: 11.6,
        bbox: [4.24, 50.76, 4.48, 50.91],
        routing: false,
        themes: [
            'stationnements-velo',
            'toilettes-publiques',
            'points-eau',
            'velos-libre-service',
            'accidents-velo',
            'reparation-velo',
        ],
    },
];

/* ----------------------------------------------------------------------------- thèmes */

export const THEMES = {
    'stationnements-velo': {
        labelKey: 'theme.stationnements-velo.label',
        layer: { kind: 'poi', categories: ['parking'] },
        itineraireLayer: 'parking',
        sources: [SOURCE_OSM],
        legend: [
            { key: 'arceaux', color: '#22C55E' },
            { key: 'rateliers_pince_roues', color: '#0D9488' },
            { key: 'abris_et_consignes', color: '#15803D' },
            { key: 'autres_non_precise', color: '#9CA3AF' },
        ],
        stats: (features) => {
            const types = countBy(features, 'parking_type');
            const places = features.reduce((sum, f) => {
                const c = parseInt(f?.properties?.capacity, 10);
                return sum + (Number.isFinite(c) ? c : 0);
            }, 0);
            const abrites = (types.shelter || 0) + features.filter(f => f?.properties?.covered === 'yes').length;
            return [
                { key: 'points_de_stationnement', value: features.length },
                { key: 'places_declarees', value: places },
                { key: 'arceaux', value: types.stands || 0 },
                { key: 'emplacements_abrites', value: abrites },
            ];
        },
    },

    'toilettes-publiques': {
        labelKey: 'theme.toilettes-publiques.label',
        layer: { kind: 'poi', categories: ['toilets'] },
        itineraireLayer: 'toilets',
        sources: [SOURCE_OSM],
        legend: [
            { key: 'gratuites', color: '#EC4899' },
            { key: 'payantes', color: '#9F1239' },
            { key: 'tarif_non_precise', color: '#8B5CF6' },
        ],
        stats: (features) => {
            const fee = countBy(features, 'toilet_fee');
            const pmr = features.filter(f => f?.properties?.wheelchair === 'yes').length;
            return [
                { key: 'toilettes_recensees', value: features.length },
                { key: 'gratuites', value: fee.free || 0 },
                { key: 'payantes', value: fee.paid || 0 },
                { key: 'accessibles_en_fauteuil', value: pmr },
            ];
        },
    },

    'points-eau': {
        labelKey: 'theme.points-eau.label',
        layer: { kind: 'poi', categories: ['water'] },
        itineraireLayer: 'water',
        sources: [SOURCE_OSM],
        legend: [{ key: 'point_deau_potable', color: '#0EA5E9' }],
        stats: (features) => [
            { key: 'points_deau_recenses', value: features.length },
            {
                key: 'en_acces_libre',
                value: features.filter(f => !['private', 'no', 'permit', 'customers'].includes(f?.properties?.access)).length,
            },
        ],
    },

    'toilettes-et-points-eau': {
        labelKey: 'theme.toilettes-et-points-eau.label',
        layer: { kind: 'poi', categories: ['toilets', 'water'] },
        itineraireLayer: 'toilets',
        sources: [SOURCE_OSM],
        legend: [
            { key: 'toilettes', color: '#8B5CF6' },
            { key: 'point_deau_potable', color: '#0EA5E9' },
        ],
        stats: (features) => {
            const cat = countBy(features, 'category');
            return [
                { key: 'haltes_recensees', value: features.length },
                { key: 'toilettes', value: cat.toilets || 0 },
                { key: 'points_deau', value: cat.water || 0 },
            ];
        },
    },

    'reparation-velo': {
        labelKey: 'theme.reparation-velo.label',
        layer: { kind: 'poi', categories: ['repair'] },
        itineraireLayer: 'repair',
        sources: [SOURCE_OSM],
        legend: [
            { key: 'station_libre_service', color: '#F97316' },
            { key: 'atelier_magasin', color: '#C2410C' },
        ],
        stats: (features) => {
            const kinds = countBy(features, 'repair_kind');
            return [
                { key: 'adresses_recensees', value: features.length },
                { key: 'stations_en_libre_service', value: kinds.selfservice || 0 },
                { key: 'ateliers_et_magasins', value: kinds.shop || 0 },
            ];
        },
    },

    'eclairage-public': {
        labelKey: 'theme.eclairage-public.label',
        layer: { kind: 'lighting' },
        itineraireLayer: 'lighting',
        sources: [SOURCE_OSM, SOURCE_PTLUM],
        // `needsGraph` : le tracé des rues éclairées est calculé sur le réseau routier chargé
        // en mémoire (GET /streetlights/lit-roads). Hors de son emprise, la heatmap des
        // luminaires reste servie, mais ces deux entrées n'auraient rien à désigner.
        legend: [
            { key: 'densite_de_points_lumineux', color: '#ffc12d' },
            { key: 'rue_eclairee_releve', color: '#ffcf3d', needsGraph: true },
            { key: 'rue_eclairee_deduite', color: '#ffe39a', needsGraph: true },
        ],
        stats: (features) => [
            { key: 'points_lumineux', value: features.length },
        ],
    },

    'velos-libre-service': {
        labelKey: 'theme.velos-libre-service.label',
        layer: { kind: 'bikeshare' },
        itineraireLayer: 'bikeshare',
        sources: [SOURCE_GBFS],
        legend: [
            { key: 'velos_disponibles', color: '#16A34A' },
            { key: 'station_presque_vide', color: '#F97316' },
            { key: 'station_vide', color: '#EF4444' },
            { key: 'station_pleine', color: '#166534' },
            { key: 'hors_service', color: '#9CA3AF' },
        ],
        realtime: true,
        stats: (features) => {
            const sum = (key) => features.reduce((acc, f) => {
                const v = f?.properties?.[key];
                return acc + (typeof v === 'number' ? v : 0);
            }, 0);
            return [
                { key: 'stations', value: features.length },
                { key: 'velos_disponibles', value: sum('bikes_available') },
                { key: 'velos_electriques', value: sum('bikes_electric') },
                { key: 'places_libres', value: sum('docks_available') },
            ];
        },
    },

    'trafic-routier': {
        labelKey: 'theme.trafic-routier.label',
        layer: { kind: 'traffic' },
        itineraireLayer: 'traffic',
        sources: [SOURCE_TRAFIC_BM],
        legend: [
            { key: 'circulation_fluide', color: '#22c55e' },
            { key: 'circulation_dense', color: '#f97316' },
            { key: 'axe_embouteille', color: '#ef4444' },
            { key: 'etat_inconnu', color: '#9ca3af' },
        ],
        realtime: true,
        stats: (features) => {
            const levels = countBy(features, 'level');
            return [
                { key: 'troncons_suivis', value: features.length },
                { key: 'fluides', value: levels.green || 0 },
                { key: 'denses', value: levels.orange || 0 },
                { key: 'embouteilles', value: levels.red || 0 },
            ];
        },
    },

    'accidents-velo': {
        labelKey: 'theme.accidents-velo.label',
        layer: { kind: 'accidents' },
        itineraireLayer: 'accidents',
        sources: [SOURCE_BAAC, SOURCE_STATBEL],
        legend: [
            { key: 'accident_mortel', color: '#7f1d1d' },
            { key: 'blesse_hospitalise', color: '#dc2626' },
            { key: 'blesse_leger', color: '#f97316' },
        ],
        stats: (features) => {
            // On compte sur `severity` (l'entier renvoyé par l'API) et non sur
            // `severity_label` : ce dernier est un libellé destiné à l'affichage,
            // donc traduisible, et l'utiliser comme clé mettrait silencieusement
            // ces deux compteurs à zéro dès que l'API répond en anglais.
            // Barème : 1 = blessé léger, 3 = blessé hospitalisé, 10 = tué.
            const sev = countBy(features, 'severity');
            const years = features
                .map(f => f?.properties?.date)
                .filter(Boolean)
                .map(d => Number(String(d).slice(0, 4)))
                .filter(Number.isFinite);
            const stats = [
                { key: 'accidents_cartographies', value: features.length },
                { key: 'blesses_hospitalises', value: sev[3] || 0 },
                { key: 'accidents_mortels', value: sev[10] || 0 },
            ];
            if (years.length) {
                stats.push({ key: 'periode_couverte', text: `${Math.min(...years)}–${Math.max(...years)}` });
            }
            return stats;
        },
    },
};
