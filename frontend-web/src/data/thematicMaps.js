// Registre des cartes thématiques (/carte/<ville>/<thème>).
//
// Source unique de vérité : les pages, le maillage interne, le sitemap et le script de
// couverture lisent tous ce fichier. Ajouter une ville = ajouter une entrée dans CITIES,
// lancer `node scripts/check-coverage.mjs`, retenir les thèmes qui passent les seuils, puis
// rédiger le contenu correspondant dans PAGE_CONTENT.
//
// Contraintes :
//  - JavaScript pur : ce module est importé aussi bien par le bundle Vite que par des
//    scripts Node de build. Pas d'import.meta.env, pas d'import.meta.glob, pas de JSX.
//  - Le contenu éditorial (intro, sections, faq) est rédigé à la main pour chaque couple
//    ville × thème. Aucun texte généré par gabarit : une page qui n'a rien d'unique à dire
//    ne doit pas être publiée.

export const SITE_URL = 'https://secu-cycle.fr';

/* ------------------------------------------------------------------ licences & sources */

const ODBL = { label: 'ODbL', href: 'https://opendatacommons.org/licenses/odbl/' };
const LO = { label: 'Licence Ouverte', href: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/' };
const LO2 = { label: 'Licence Ouverte 2.0', href: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/' };
const CCBY = { label: 'CC BY 4.0', href: 'https://creativecommons.org/licenses/by/4.0/deed.fr' };

const SOURCE_OSM = {
    name: 'OpenStreetMap',
    detail: 'collecté via Overpass',
    licence: ODBL,
    producer: { label: 'openstreetmap.org', href: 'https://www.openstreetmap.org/copyright' },
};

const SOURCE_PTLUM = {
    name: 'Points lumineux',
    detail: 'Bordeaux Métropole',
    licence: LO,
    producer: {
        label: 'opendata.bordeaux-metropole.fr',
        href: 'https://opendata.bordeaux-metropole.fr/explore/dataset/bor_ptlum/',
    },
};

const SOURCE_BAAC = {
    name: '« Accidents de vélo »',
    detail: 'dérivé des BAAC de l’ONISR, publié par Koumoul',
    licence: LO2,
    producer: { label: 'data.gouv.fr', href: 'https://www.data.gouv.fr/datasets/accidents-de-velo' },
};

const SOURCE_STATBEL = {
    name: 'Géolocalisation des accidents de la circulation',
    detail: 'Statbel',
    licence: CCBY,
    producer: {
        label: 'statbel.fgov.be',
        href: 'https://statbel.fgov.be/fr/open-data/geolocalisation-des-accidents-de-la-circulation-2017-2024',
    },
};

const SOURCE_GBFS = {
    name: 'Flux GBFS « Le Vélo »',
    detail: 'Bordeaux Métropole / Keolis',
    licence: { label: 'Flux ouvert, attribution requise' },
    producer: { label: 'gbfs.org', href: 'https://gbfs.org/' },
};

const SOURCE_TRAFIC_BM = {
    name: 'Trafic temps réel',
    detail: 'Bordeaux Métropole',
    licence: LO,
    producer: {
        label: 'opendata.bordeaux-metropole.fr',
        href: 'https://opendata.bordeaux-metropole.fr/explore/dataset/ci_trafi_l/',
    },
};

const SOURCE_TRAFIC_RENNES = {
    name: 'État du trafic en temps réel',
    detail: 'Rennes Métropole',
    licence: ODBL,
    producer: {
        label: 'data.rennesmetropole.fr',
        href: 'https://data.rennesmetropole.fr/explore/dataset/etat-du-trafic-en-temps-reel/',
    },
};

const SOURCE_TRAFIC_NANTES = {
    name: 'Fluidité des axes routiers',
    detail: 'Nantes Métropole',
    licence: ODBL,
    producer: {
        label: 'data.nantesmetropole.fr',
        href: 'https://data.nantesmetropole.fr/explore/dataset/244400404_fluidite-axes-routiers-nantes-metropole/',
    },
};

const SOURCE_LUM_NANTES = {
    name: 'Luminaires d’éclairage public',
    detail: 'Nantes Métropole',
    licence: LO,
    producer: {
        label: 'data.nantesmetropole.fr',
        href: 'https://data.nantesmetropole.fr/explore/dataset/244400404_luminaires-eclairage-public-nantes-metropole/',
    },
};

const SOURCE_GBFS_RENNES = {
    name: 'Flux GBFS « LE vélo STAR »',
    detail: 'Rennes Métropole / STAR',
    licence: { label: 'Flux ouvert, attribution requise' },
    producer: { label: 'gbfs.org', href: 'https://gbfs.org/' },
};

const SOURCE_GBFS_NANTES = {
    name: 'Flux GBFS « Naolib »',
    detail: 'Nantes Métropole / JCDecaux',
    licence: { label: 'Flux ouvert, attribution requise' },
    producer: { label: 'gbfs.org', href: 'https://gbfs.org/' },
};

const SOURCE_GBFS_PARIS = {
    name: 'Flux GBFS « Vélib’ Métropole »',
    detail: 'Vélib’ Métropole / Smovengo',
    licence: { label: 'Flux ouvert, attribution requise' },
    producer: { label: 'gbfs.org', href: 'https://gbfs.org/' },
};

const SOURCE_GBFS_LYON = {
    name: 'Flux GBFS « Vélo’v »',
    detail: 'Métropole de Lyon / JCDecaux',
    licence: { label: 'Flux ouvert, attribution requise' },
    producer: { label: 'gbfs.org', href: 'https://gbfs.org/' },
};

const SOURCE_GBFS_LILLE = {
    name: 'Flux GBFS « V’Lille »',
    detail: 'Métropole Européenne de Lille / Ilévia',
    licence: { label: 'Flux ouvert, attribution requise' },
    producer: { label: 'gbfs.org', href: 'https://gbfs.org/' },
};

const SOURCE_GBFS_STRASBOURG = {
    name: 'Flux GBFS « Vélhop »',
    detail: 'Strasbourg Mobilités Vélo / nextbike',
    licence: { label: 'Flux ouvert, attribution requise' },
    producer: { label: 'gbfs.org', href: 'https://gbfs.org/' },
};

const SOURCE_GBFS_BRUXELLES = {
    name: 'Flux GBFS « Villo! »',
    detail: 'Bruxelles-Capitale / JCDecaux',
    licence: { label: 'Flux ouvert, attribution requise' },
    producer: { label: 'gbfs.org', href: 'https://gbfs.org/' },
};

const SOURCE_GBFS_BLUEBIKE = {
    name: 'Flux GBFS « Blue-bike »',
    detail: 'Blue-mobility',
    licence: { label: 'Flux ouvert, attribution requise' },
    producer: { label: 'gbfs.org', href: 'https://gbfs.org/' },
};

/* ------------------------------------------------------------------------ utilitaires */

const plural = (n, singulier, pluriel) => `${n.toLocaleString('fr-FR')} ${n > 1 ? pluriel : singulier}`;

const countBy = (features, prop) => features.reduce((acc, f) => {
    const key = f?.properties?.[prop];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
}, {});

/* ----------------------------------------------------------------------------- villes */

export const CITIES = [
    {
        slug: 'bordeaux',
        name: 'Bordeaux',
        // « à Bordeaux », « de Bordeaux » — évite les gabarits grammaticalement faux
        prep: 'à Bordeaux',
        de: 'de Bordeaux',
        label: 'Bordeaux et sa métropole',
        center: [-0.5795, 44.8378],
        zoom: 11.4,
        bbox: [-0.78, 44.71, -0.45, 44.95],
        communes: 'les 28 communes de Bordeaux Métropole et une quinzaine de communes du sud de la Gironde',
        // Le calculateur d'itinéraires travaille sur le graphe routier chargé en mémoire par
        // l'API, dont l'emprise est plus étroite que celle des données : une ville peut avoir
        // ses cartes sans être navigable. `routing: false` le dit dans le texte des pages
        // plutôt que de laisser un bouton « Calculer mon itinéraire » mener à une impasse.
        routing: true,
        // Meta description du hub de ville. Rédigée à la main plutôt que dérivée de la liste
        // des thèmes : celle-ci dépassait 250 caractères et se faisait tronquer en SERP.
        metaDescription: 'Toutes les cartes vélo de Bordeaux Métropole : stationnements, toilettes, '
            + 'points d’eau, éclairage, trafic en direct et accidents, en données ouvertes.',
        intro: 'Sécu’Cycle couvre Bordeaux Métropole et le sud de l’agglomération, de Blanquefort à '
            + 'La Brède, en passant par Mérignac, Pessac, Talence et Bègles. Toutes les cartes '
            + 'ci-dessous s’appuient sur les mêmes données que le calculateur d’itinéraires.',
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
        prep: 'à Rennes',
        de: 'de Rennes',
        label: 'Rennes et sa métropole',
        center: [-1.6778, 48.1113],
        zoom: 11.4,
        // Reprise de l'emprise du fournisseur de trafic (backend/traffic/config.py,
        // « rennes-metropole ») : c'est la même convention qu'à Bordeaux.
        bbox: [-1.84, 47.99, -1.52, 48.21],
        communes: 'les 43 communes de Rennes Métropole',
        routing: false,
        routingNote: 'Le calcul d’itinéraire ne dessert pas Rennes Métropole pour le moment : le '
            + 'réseau routier tient en mémoire pour Bordeaux et la région de Tournai, pas au-delà. '
            + 'Les données rennaises affichées ici, elles, restent synchronisées.',
        metaDescription: 'Toutes les cartes vélo de Rennes Métropole : stationnements, toilettes, '
            + 'points d’eau, stations LE vélo STAR, trafic en direct et accidents à vélo.',
        intro: 'Sécu’Cycle couvre Rennes Métropole, de Betton à Bruz et de Mordelles à '
            + 'Cesson-Sévigné. Rennes est l’une des agglomérations françaises les plus denses en '
            + 'stationnement vélo, et les cartes ci-dessous s’appuient sur les mêmes données '
            + 'ouvertes que le calculateur d’itinéraires.',
        themes: [
            'stationnements-velo',
            'toilettes-publiques',
            'points-eau',
            'velos-libre-service',
            'trafic-routier',
            'accidents-velo',
            'reparation-velo',
        ],
        excludedThemes: {
            'eclairage-public': 'Rennes Métropole ne publie pas d’inventaire de points lumineux : '
                + 'seuls les quelque 9 800 lampadaires relevés dans OpenStreetMap sont disponibles, '
                + 'contre 97 473 luminaires officiels à Nantes. La carte laisserait croire à de '
                + 'vastes zones non éclairées qui le sont en réalité.',
        },
    },
    {
        slug: 'nantes',
        name: 'Nantes',
        prep: 'à Nantes',
        de: 'de Nantes',
        label: 'Nantes et sa métropole',
        center: [-1.5536, 47.2184],
        zoom: 11.4,
        bbox: [-1.77, 47.11, -1.40, 47.35],
        communes: 'les 24 communes de Nantes Métropole',
        routing: false,
        routingNote: 'Le calcul d’itinéraire ne dessert pas Nantes Métropole pour le moment : le '
            + 'réseau routier tient en mémoire pour Bordeaux et la région de Tournai, pas au-delà. '
            + 'Les données nantaises affichées ici, elles, restent synchronisées.',
        metaDescription: 'Toutes les cartes vélo de Nantes Métropole : stationnements, toilettes, '
            + 'points d’eau, éclairage public, stations Naolib, trafic en direct et accidents.',
        intro: 'Sécu’Cycle couvre Nantes Métropole, des deux rives de la Loire à l’Erdre et à la '
            + 'Sèvre. C’est le territoire le mieux doté en données ouvertes du service : Nantes '
            + 'Métropole publie notamment l’inventaire complet de son éclairage public, ce qui '
            + 'permet une carte d’une précision rare.',
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
        prep: 'à Paris',
        de: 'de Paris',
        label: 'Paris et le Grand Paris',
        center: [2.3488, 48.8534],
        zoom: 10.8,
        // Emprise de la Métropole du Grand Paris, plus resserrée que la couverture
        // déclarée par le flux Vélib' (backend/bikeshare/config.py), qui déborde
        // sur toute l'Île-de-France centrale.
        bbox: [2.15, 48.70, 2.57, 48.98],
        communes: 'les 130 communes de la Métropole du Grand Paris',
        routing: false,
        routingNote: 'Le calcul d’itinéraire ne dessert pas encore le Grand Paris : les données '
            + 'franciliennes affichées ici sont bien synchronisées, mais le réseau routier '
            + 'nécessaire au calcul d’un trajet n’y est pas chargé.',
        metaDescription: 'Toutes les cartes vélo du Grand Paris : stationnements, toilettes, '
            + 'points d’eau, stations Vélib’, accidents et ateliers de réparation.',
        intro: 'Sécu’Cycle couvre la Métropole du Grand Paris, de Paris intra-muros aux communes '
            + 'de la petite couronne, de Saint-Denis à Montrouge et de Boulogne à Montreuil. Les '
            + 'cartes ci-dessous s’appuient sur des données ouvertes, resynchronisées '
            + 'automatiquement.',
        themes: [
            'stationnements-velo',
            'toilettes-publiques',
            'points-eau',
            'velos-libre-service',
            'accidents-velo',
            'reparation-velo',
        ],
        excludedThemes: {
            'eclairage-public': 'Aucun inventaire officiel des points lumineux n’est repris pour le '
                + 'Grand Paris : seuls les lampadaires relevés dans OpenStreetMap seraient '
                + 'disponibles, très loin du parc réel. La carte laisserait croire à de vastes '
                + 'zones non éclairées qui le sont en réalité.',
            'trafic-routier': 'La couche trafic est calculée sur le réseau routier chargé par le '
                + 'calculateur d’itinéraires, qui ne couvre pas encore l’Île-de-France.',
        },
    },
    {
        slug: 'lyon',
        name: 'Lyon',
        prep: 'à Lyon',
        de: 'de Lyon',
        label: 'Lyon et sa métropole',
        center: [4.8357, 45.7640],
        zoom: 11.2,
        bbox: [4.72, 45.63, 5.03, 45.92],
        communes: 'les 58 communes de la Métropole de Lyon',
        routing: false,
        routingNote: 'Le calcul d’itinéraire ne dessert pas encore la Métropole de Lyon : les '
            + 'données lyonnaises affichées ici sont bien synchronisées, mais le réseau routier '
            + 'nécessaire au calcul d’un trajet n’y est pas chargé.',
        metaDescription: 'Toutes les cartes vélo de la Métropole de Lyon : stationnements, '
            + 'toilettes, points d’eau, stations Vélo’v, accidents et ateliers de réparation.',
        intro: 'Sécu’Cycle couvre la Métropole de Lyon, de la Presqu’île à Villeurbanne et de '
            + 'Vaulx-en-Velin à Sainte-Foy-lès-Lyon. Une agglomération où le relief compte autant '
            + 'que les aménagements : les cartes ci-dessous s’appuient sur des données ouvertes, '
            + 'resynchronisées automatiquement.',
        themes: [
            'stationnements-velo',
            'toilettes-publiques',
            'points-eau',
            'velos-libre-service',
            'accidents-velo',
            'reparation-velo',
        ],
        excludedThemes: {
            'eclairage-public': 'La Métropole de Lyon ne publie pas d’inventaire de points lumineux '
                + 'exploitable ici : seuls les lampadaires relevés dans OpenStreetMap seraient '
                + 'disponibles, très loin du parc réel.',
            'trafic-routier': 'La couche trafic est calculée sur le réseau routier chargé par le '
                + 'calculateur d’itinéraires, qui ne couvre pas encore la métropole lyonnaise.',
        },
    },
    {
        slug: 'lille',
        name: 'Lille',
        prep: 'à Lille',
        de: 'de Lille',
        label: 'Lille et sa métropole',
        center: [3.0573, 50.6292],
        zoom: 10.9,
        bbox: [2.90, 50.55, 3.30, 50.80],
        communes: 'les 95 communes de la Métropole Européenne de Lille',
        routing: false,
        routingNote: 'Le calcul d’itinéraire ne dessert pas encore la Métropole Européenne de '
            + 'Lille : les données lilloises affichées ici sont bien synchronisées, mais le réseau '
            + 'routier nécessaire au calcul d’un trajet n’y est pas chargé.',
        metaDescription: 'Toutes les cartes vélo de la Métropole Européenne de Lille : '
            + 'stationnements, toilettes, points d’eau, stations V’Lille, accidents et ateliers.',
        intro: 'Sécu’Cycle couvre la Métropole Européenne de Lille, de Lille à Roubaix et de '
            + 'Tourcoing à Villeneuve-d’Ascq. Un territoire plat et polycentrique, où les pavés '
            + 'font partie du quotidien : les cartes ci-dessous s’appuient sur des données '
            + 'ouvertes, resynchronisées automatiquement.',
        themes: [
            'stationnements-velo',
            'toilettes-publiques',
            'points-eau',
            'velos-libre-service',
            'accidents-velo',
            'reparation-velo',
        ],
        excludedThemes: {
            'eclairage-public': 'La métropole lilloise ne publie pas d’inventaire de points lumineux '
                + 'exploitable ici : seuls les lampadaires relevés dans OpenStreetMap seraient '
                + 'disponibles, très loin du parc réel.',
            'trafic-routier': 'La couche trafic est calculée sur le réseau routier chargé par le '
                + 'calculateur d’itinéraires, qui ne couvre pas encore la métropole lilloise.',
        },
    },
    {
        slug: 'strasbourg',
        name: 'Strasbourg',
        prep: 'à Strasbourg',
        de: 'de Strasbourg',
        label: 'Strasbourg et l’Eurométropole',
        center: [7.7521, 48.5734],
        zoom: 11.2,
        bbox: [7.55, 48.45, 7.87, 48.68],
        communes: 'les 33 communes de l’Eurométropole de Strasbourg',
        routing: false,
        routingNote: 'Le calcul d’itinéraire ne dessert pas encore l’Eurométropole de '
            + 'Strasbourg : les données strasbourgeoises affichées ici sont bien synchronisées, '
            + 'mais le réseau routier nécessaire au calcul d’un trajet n’y est pas chargé.',
        metaDescription: 'Toutes les cartes vélo de l’Eurométropole de Strasbourg : '
            + 'stationnements, toilettes, points d’eau, stations Vélhop, accidents et ateliers.',
        intro: 'Sécu’Cycle couvre l’Eurométropole de Strasbourg, de la Grande Île aux communes de '
            + 'la deuxième couronne. C’est la ville française où la part du vélo dans les '
            + 'déplacements est la plus élevée : les cartes ci-dessous s’appuient sur des données '
            + 'ouvertes, resynchronisées automatiquement.',
        themes: [
            'stationnements-velo',
            'toilettes-publiques',
            'points-eau',
            'velos-libre-service',
            'accidents-velo',
            'reparation-velo',
        ],
        excludedThemes: {
            'eclairage-public': 'L’Eurométropole ne publie pas d’inventaire de points lumineux '
                + 'exploitable ici : seuls les lampadaires relevés dans OpenStreetMap seraient '
                + 'disponibles, très loin du parc réel.',
            'trafic-routier': 'La couche trafic est calculée sur le réseau routier chargé par le '
                + 'calculateur d’itinéraires, qui ne couvre pas encore l’Eurométropole.',
        },
    },
    {
        slug: 'tournai',
        name: 'Tournai',
        prep: 'à Tournai',
        de: 'de Tournai',
        label: 'Tournai, Mouscron et le Tournaisis',
        center: [3.3878, 50.6056],
        zoom: 10.6,
        bbox: [3.10, 50.48, 3.70, 50.82],
        communes: 'Tournai, Antoing, Leuze-en-Hainaut, Estaimpuis, Mont-de-l’Enclus et Mouscron',
        routing: true,
        metaDescription: 'Cartes vélo du Tournaisis et du Mouscronnois : stationnements, accidents '
            + 'à vélo, toilettes et points d’eau, à partir des données ouvertes belges.',
        intro: 'Côté belge, Sécu’Cycle couvre le Tournaisis et le Mouscronnois, jusqu’à la frontière '
            + 'française. La couverture des données ouvertes y est plus inégale qu’à Bordeaux : nous '
            + 'ne publions que les cartes pour lesquelles le recensement est suffisamment fourni.',
        themes: [
            'stationnements-velo',
            'accidents-velo',
            'toilettes-et-points-eau',
        ],
        // Thèmes volontairement écartés malgré un volume de données apparemment suffisant.
        // Documenté ici pour que le script de couverture ne les signale pas à chaque passage.
        excludedThemes: {
            'eclairage-public': 'Recensement lacunaire : ~640 points lumineux pour six communes, '
                + 'contre ~38 000 sur Bordeaux Métropole. La carte donnerait une image fausse d’un '
                + 'territoire en réalité éclairé.',
            'velos-libre-service': 'Les stations captées dans l’emprise appartiennent à V’Lille, '
                + 'côté français, et non à un service tournaisien. Publier une page « Tournai » '
                + 'sur des stations lilloises induirait le visiteur en erreur.',
        },
    },
    {
        slug: 'bruxelles',
        name: 'Bruxelles',
        prep: 'à Bruxelles',
        de: 'de Bruxelles',
        label: 'Bruxelles et ses 19 communes',
        center: [4.3517, 50.8503],
        zoom: 11.6,
        bbox: [4.24, 50.76, 4.48, 50.91],
        communes: 'les 19 communes de la Région de Bruxelles-Capitale',
        routing: false,
        routingNote: 'Le calcul d’itinéraire ne dessert pas encore la Région de '
            + 'Bruxelles-Capitale : les données bruxelloises affichées ici sont bien '
            + 'synchronisées, mais le réseau routier nécessaire au calcul d’un trajet n’y est '
            + 'pas chargé.',
        metaDescription: 'Toutes les cartes vélo de Bruxelles-Capitale : stationnements, '
            + 'toilettes, points d’eau, stations Villo! et Blue-bike, accidents et ateliers.',
        intro: 'Sécu’Cycle couvre les 19 communes de la Région de Bruxelles-Capitale, du Pentagone '
            + 'à Uccle et de Molenbeek à Woluwe-Saint-Pierre. Une ville de pentes et de pavés, où '
            + 'la zone 30 est généralisée depuis 2021 : les cartes ci-dessous s’appuient sur des '
            + 'données ouvertes, resynchronisées automatiquement.',
        themes: [
            'stationnements-velo',
            'toilettes-publiques',
            'points-eau',
            'velos-libre-service',
            'accidents-velo',
            'reparation-velo',
        ],
        excludedThemes: {
            'eclairage-public': 'La Région ne publie pas d’inventaire de points lumineux exploitable '
                + 'ici : seuls les lampadaires relevés dans OpenStreetMap seraient disponibles, très '
                + 'loin du parc réel.',
            'trafic-routier': 'La couche trafic est calculée sur le réseau routier chargé par le '
                + 'calculateur d’itinéraires, qui ne couvre pas encore Bruxelles.',
        },
    },
];

/* ----------------------------------------------------------------------------- thèmes */

export const THEMES = {
    'stationnements-velo': {
        label: 'Stationnements vélo',
        layer: { kind: 'poi', categories: ['parking'] },
        itineraireLayer: 'parking',
        sources: [SOURCE_OSM],
        legend: [
            { label: 'Arceaux', color: '#22C55E' },
            { label: 'Râteliers, pince-roues', color: '#0D9488' },
            { label: 'Abris et consignes', color: '#15803D' },
            { label: 'Autres, non précisé', color: '#9CA3AF' },
        ],
        stats: (features) => {
            const types = countBy(features, 'parking_type');
            const places = features.reduce((sum, f) => {
                const c = parseInt(f?.properties?.capacity, 10);
                return sum + (Number.isFinite(c) ? c : 0);
            }, 0);
            const abrites = (types.shelter || 0) + features.filter(f => f?.properties?.covered === 'yes').length;
            return [
                { label: 'points de stationnement', value: features.length },
                { label: 'places déclarées', value: places },
                { label: 'arceaux', value: types.stands || 0 },
                { label: 'emplacements abrités', value: abrites },
            ];
        },
    },

    'toilettes-publiques': {
        label: 'Toilettes publiques',
        layer: { kind: 'poi', categories: ['toilets'] },
        itineraireLayer: 'toilets',
        sources: [SOURCE_OSM],
        legend: [
            { label: 'Gratuites', color: '#EC4899' },
            { label: 'Payantes', color: '#9F1239' },
            { label: 'Tarif non précisé', color: '#8B5CF6' },
        ],
        stats: (features) => {
            const fee = countBy(features, 'toilet_fee');
            const pmr = features.filter(f => f?.properties?.wheelchair === 'yes').length;
            return [
                { label: 'toilettes recensées', value: features.length },
                { label: 'gratuites', value: fee.free || 0 },
                { label: 'payantes', value: fee.paid || 0 },
                { label: 'accessibles en fauteuil', value: pmr },
            ];
        },
    },

    'points-eau': {
        label: 'Points d’eau potable',
        layer: { kind: 'poi', categories: ['water'] },
        itineraireLayer: 'water',
        sources: [SOURCE_OSM],
        legend: [{ label: 'Point d’eau potable', color: '#0EA5E9' }],
        stats: (features) => [
            { label: 'points d’eau recensés', value: features.length },
            {
                label: 'en accès libre',
                value: features.filter(f => !['private', 'no', 'permit', 'customers'].includes(f?.properties?.access)).length,
            },
        ],
    },

    'toilettes-et-points-eau': {
        label: 'Toilettes et points d’eau',
        layer: { kind: 'poi', categories: ['toilets', 'water'] },
        itineraireLayer: 'toilets',
        sources: [SOURCE_OSM],
        legend: [
            { label: 'Toilettes', color: '#8B5CF6' },
            { label: 'Point d’eau potable', color: '#0EA5E9' },
        ],
        stats: (features) => {
            const cat = countBy(features, 'category');
            return [
                { label: 'haltes recensées', value: features.length },
                { label: 'toilettes', value: cat.toilets || 0 },
                { label: 'points d’eau', value: cat.water || 0 },
            ];
        },
    },

    'reparation-velo': {
        label: 'Réparation de vélo',
        layer: { kind: 'poi', categories: ['repair'] },
        itineraireLayer: 'repair',
        sources: [SOURCE_OSM],
        legend: [
            { label: 'Station libre-service', color: '#F97316' },
            { label: 'Atelier / magasin', color: '#C2410C' },
        ],
        stats: (features) => {
            const kinds = countBy(features, 'repair_kind');
            return [
                { label: 'adresses recensées', value: features.length },
                { label: 'stations en libre-service', value: kinds.selfservice || 0 },
                { label: 'ateliers et magasins', value: kinds.shop || 0 },
            ];
        },
    },

    'eclairage-public': {
        label: 'Éclairage public',
        layer: { kind: 'lighting' },
        itineraireLayer: 'lighting',
        sources: [SOURCE_OSM, SOURCE_PTLUM],
        // `needsGraph` : le tracé des rues éclairées est calculé sur le réseau routier chargé
        // en mémoire (GET /streetlights/lit-roads). Hors de son emprise, la heatmap des
        // luminaires reste servie, mais ces deux entrées n'auraient rien à désigner.
        legend: [
            { label: 'Densité de points lumineux', color: '#ffc12d' },
            { label: 'Rue éclairée (relevé)', color: '#ffcf3d', needsGraph: true },
            { label: 'Rue éclairée (déduite)', color: '#ffe39a', needsGraph: true },
        ],
        stats: (features) => [
            { label: 'points lumineux', value: features.length },
        ],
    },

    'velos-libre-service': {
        label: 'Vélos en libre-service',
        layer: { kind: 'bikeshare' },
        itineraireLayer: 'bikeshare',
        sources: [SOURCE_GBFS],
        legend: [
            { label: 'Vélos disponibles', color: '#16A34A' },
            { label: 'Station presque vide', color: '#F97316' },
            { label: 'Station vide', color: '#EF4444' },
            { label: 'Station pleine', color: '#166534' },
            { label: 'Hors service', color: '#9CA3AF' },
        ],
        realtime: true,
        stats: (features) => {
            const sum = (key) => features.reduce((acc, f) => {
                const v = f?.properties?.[key];
                return acc + (typeof v === 'number' ? v : 0);
            }, 0);
            return [
                { label: 'stations', value: features.length },
                { label: 'vélos disponibles', value: sum('bikes_available') },
                { label: 'vélos électriques', value: sum('bikes_electric') },
                { label: 'places libres', value: sum('docks_available') },
            ];
        },
    },

    'trafic-routier': {
        label: 'Trafic routier',
        layer: { kind: 'traffic' },
        itineraireLayer: 'traffic',
        sources: [SOURCE_TRAFIC_BM],
        legend: [
            { label: 'Circulation fluide', color: '#22c55e' },
            { label: 'Circulation dense', color: '#f97316' },
            { label: 'Axe embouteillé', color: '#ef4444' },
            { label: 'État inconnu', color: '#9ca3af' },
        ],
        realtime: true,
        stats: (features) => {
            const levels = countBy(features, 'level');
            return [
                { label: 'tronçons suivis', value: features.length },
                { label: 'fluides', value: levels.green || 0 },
                { label: 'denses', value: levels.orange || 0 },
                { label: 'embouteillés', value: levels.red || 0 },
            ];
        },
    },

    'accidents-velo': {
        label: 'Accidents à vélo',
        layer: { kind: 'accidents' },
        itineraireLayer: 'accidents',
        sources: [SOURCE_BAAC, SOURCE_STATBEL],
        legend: [
            { label: 'Accident mortel', color: '#7f1d1d' },
            { label: 'Blessé hospitalisé', color: '#dc2626' },
            { label: 'Blessé léger', color: '#f97316' },
        ],
        stats: (features) => {
            const sev = countBy(features, 'severity_label');
            const years = features
                .map(f => f?.properties?.date)
                .filter(Boolean)
                .map(d => Number(String(d).slice(0, 4)))
                .filter(Number.isFinite);
            const stats = [
                { label: 'accidents cartographiés', value: features.length },
                { label: 'blessés hospitalisés', value: sev['blessé hospitalisé'] || 0 },
                { label: 'accidents mortels', value: sev['tué'] || 0 },
            ];
            if (years.length) {
                stats.push({ label: 'période couverte', text: `${Math.min(...years)}–${Math.max(...years)}` });
            }
            return stats;
        },
    },
};

/* ------------------------------------------------------------------ contenu éditorial */
//
// Une entrée par couple ville/thème. `intro` est le chapô affiché sous le H1, `sections`
// le corps rédactionnel indexable, `faq` alimente le bloc FAQ et le JSON-LD FAQPage.

export const PAGE_CONTENT = {
    'bordeaux/stationnements-velo': {
        title: 'Stationnements vélo à Bordeaux — carte des arceaux et abris',
        description: 'Carte interactive des 3 800 stationnements vélo de Bordeaux Métropole : '
            + 'arceaux, râteliers, abris et consignes sécurisées, avec leur capacité.',
        h1: 'Stationnements vélo à Bordeaux',
        intro: 'Où attacher son vélo à Bordeaux ? Cette carte recense les arceaux, râteliers, abris '
            + 'et consignes de toute la métropole, avec le type d’équipement et, quand il est connu, '
            + 'le nombre de places.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Chaque point correspond à un emplacement de stationnement vélo relevé sur le terrain '
                    + 'par les contributeurs OpenStreetMap. Les arceaux, de loin les plus nombreux, sont les '
                    + 'seuls équipements qui permettent d’attacher le cadre et une roue avec un antivol en U : '
                    + 'ce sont ceux à privilégier pour un stationnement long.',
                    'Les râteliers et pince-roues, où seule la roue est maintenue, exposent davantage au vol '
                    + 'et à la voilure de la jante. Les abris et consignes, signalés séparément, protègent de '
                    + 'la pluie et, pour les consignes fermées de type Ma Ligne / Vélo-Box, permettent un '
                    + 'stationnement de longue durée à proximité des gares et des terminus de tramway.',
                ],
            },
            {
                h2: 'Stationner sans se faire voler',
                p: [
                    'Le vol de vélo reste la première cause d’abandon de la pratique. Attachez toujours le '
                    + 'cadre à un point fixe, jamais la roue seule, et préférez un antivol en U certifié. '
                    + 'Dans l’hypercentre et autour des stations de tram, privilégiez les emplacements '
                    + 'visibles et fréquentés plutôt qu’une rue déserte.',
                    'Le marquage Bicycode, obligatoire à la vente de vélos neufs depuis 2021, augmente '
                    + 'nettement les chances de restitution : pensez à enregistrer votre vélo.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Le recensement provient d’OpenStreetMap et est resynchronisé automatiquement. '
                    + 'Il est donc vivant mais imparfait : un arceau posé récemment peut manquer, un '
                    + 'équipement supprimé peut subsister quelques semaines. Toute correction apportée '
                    + 'sur OpenStreetMap se retrouvera ici après la synchronisation suivante.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien y a-t-il de stationnements vélo à Bordeaux ?',
                a: 'Environ 3 800 emplacements sont recensés sur Bordeaux Métropole et le sud de '
                    + 'l’agglomération, représentant près de 37 000 places déclarées. La grande majorité '
                    + 'sont des arceaux ; on compte aussi plusieurs centaines d’abris et de consignes.',
            },
            {
                q: 'Quelle est la différence entre un arceau et un râtelier ?',
                a: 'Un arceau est un tube en U inversé auquel on attache à la fois le cadre et une roue : '
                    + 'c’est le dispositif recommandé. Un râtelier (ou pince-roue) ne retient que la roue '
                    + 'avant, ce qui protège mal du vol et peut voiler la jante.',
            },
            {
                q: 'Existe-t-il des consignes à vélo sécurisées à Bordeaux ?',
                a: 'Oui, des abris fermés et des consignes individuelles existent notamment autour des '
                    + 'gares et des pôles d’échange. Ils apparaissent sur la carte dans la catégorie '
                    + '« Abris et consignes ».',
            },
            {
                q: 'Un stationnement manque sur la carte, comment le signaler ?',
                a: 'Les données proviennent d’OpenStreetMap : vous pouvez ajouter l’emplacement '
                    + 'directement sur openstreetmap.org, il sera repris lors de la synchronisation '
                    + 'suivante. Vous pouvez aussi nous écrire via la page Contact.',
            },
        ],
    },

    'bordeaux/toilettes-publiques': {
        title: 'Toilettes publiques à Bordeaux — carte interactive',
        description: 'Carte des toilettes publiques de Bordeaux et de sa métropole : sanitaires '
            + 'gratuits, payants et accessibles en fauteuil roulant, localisés et à jour.',
        h1: 'Toilettes publiques à Bordeaux',
        intro: 'Trouver des toilettes publiques à Bordeaux ne devrait pas être un jeu de piste. Cette '
            + 'carte localise les sanitaires recensés sur la métropole, en distinguant les toilettes '
            + 'gratuites des toilettes payantes et en signalant celles accessibles en fauteuil roulant.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Sont recensés les sanitaires publics au sens large : les toilettes automatiques de '
                    + 'voirie, les blocs sanitaires des parcs et jardins, ceux des marchés, des gares et '
                    + 'des équipements municipaux. La couleur du repère indique le tarif — gratuit, payant, '
                    + 'ou non renseigné lorsque l’information manque dans la base.',
                    'Une partie des emplacements porte aussi des horaires d’ouverture. Beaucoup de blocs '
                    + 'sanitaires de parcs ferment à la tombée de la nuit et suivent les horaires du parc '
                    + 'lui-même : vérifiez l’horaire affiché dans la fiche avant de vous déplacer.',
                ],
            },
            {
                h2: 'Toilettes gratuites, payantes et accessibilité',
                p: [
                    'La majorité des toilettes recensées à Bordeaux sont gratuites. Les sanitaires payants '
                    + 'restent minoritaires et se concentrent dans les gares et quelques équipements '
                    + 'commerciaux. Lorsque le tarif n’est pas renseigné, le repère apparaît en violet : '
                    + 'l’information n’est pas connue, pas nécessairement absente.',
                    'L’accessibilité en fauteuil roulant est indiquée quand elle a été relevée. Ce champ '
                    + 'est cependant moins bien renseigné que la position elle-même : son absence ne '
                    + 'signifie pas que le lieu est inaccessible.',
                ],
            },
            {
                h2: 'Utile à vélo comme à pied',
                p: [
                    'Cette carte est un sous-produit de Sécu’Cycle, un calculateur d’itinéraires cyclables '
                    + 'sécurisés. Sur un trajet à vélo, connaître le prochain sanitaire ouvert évite un '
                    + 'détour hasardeux — c’est pourquoi la couche est également disponible directement '
                    + 'sur la carte d’itinéraire.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien de toilettes publiques sont recensées à Bordeaux ?',
                a: 'Environ 250 emplacements sont cartographiés sur Bordeaux Métropole et le sud de '
                    + 'l’agglomération, dont près de 150 explicitement gratuits. Une centaine n’ont pas '
                    + 'de tarif renseigné dans les données ouvertes.',
            },
            {
                q: 'Les toilettes publiques sont-elles gratuites à Bordeaux ?',
                a: 'Dans leur grande majorité, oui. Les sanitaires automatiques de voirie et ceux des '
                    + 'parcs municipaux sont gratuits. Seuls quelques équipements, principalement en gare, '
                    + 'sont payants.',
            },
            {
                q: 'Les horaires d’ouverture sont-ils fiables ?',
                a: 'Ils proviennent d’OpenStreetMap et ne sont renseignés que pour une partie des '
                    + 'emplacements. Les blocs sanitaires de parcs suivent généralement les horaires du '
                    + 'parc, variables selon la saison. Considérez-les comme indicatifs.',
            },
            {
                q: 'Puis-je voir ces toilettes pendant le calcul d’un itinéraire ?',
                a: 'Oui. La couche « Toilettes » est disponible dans le menu Points d’intérêt de la carte '
                    + 'd’itinéraire, et le bouton en haut de cette page l’active directement.',
            },
        ],
    },

    'bordeaux/points-eau': {
        title: 'Points d’eau potable à Bordeaux — carte des fontaines',
        description: 'Carte des fontaines et points d’eau potable de Bordeaux Métropole, utile aux '
            + 'cyclistes, coureurs et promeneurs pour remplir sa gourde en été.',
        h1: 'Points d’eau potable à Bordeaux',
        intro: 'Où remplir sa gourde à Bordeaux ? Cette carte recense les fontaines et points d’eau '
            + 'potable accessibles librement sur la métropole — un réflexe utile à vélo, en courant '
            + 'ou simplement lors des épisodes de forte chaleur.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Chaque repère correspond à un point d’eau déclaré potable : fontaine de parc, borne '
                    + 'fontaine de voirie, point d’eau d’aire de jeux ou de cimetière. Les points dont '
                    + 'l’accès est restreint — privé, réservé aux clients, sur autorisation — sont '
                    + 'signalés visuellement afin de ne pas vous envoyer devant une porte fermée.',
                    'Attention : de nombreuses fontaines bordelaises sont coupées en hiver pour éviter le '
                    + 'gel, et certaines sont saisonnières par nature. La carte indique le caractère '
                    + 'saisonnier lorsque l’information est disponible.',
                ],
            },
            {
                h2: 'S’hydrater à vélo l’été',
                p: [
                    'Sur un trajet estival dans l’agglomération, prévoyez de boire avant d’avoir soif : la '
                    + 'déshydratation dégrade la vigilance, ce qui compte particulièrement en circulation. '
                    + 'Les parcs des bords de Garonne, le parc Bordelais et les places arborées du centre '
                    + 'concentrent une bonne partie des points d’eau.',
                    'Les épisodes caniculaires deviennent fréquents en Gironde : lors d’une alerte, '
                    + 'privilégiez les trajets tôt le matin ou en soirée et repérez à l’avance deux ou '
                    + 'trois points de remplissage sur votre parcours.',
                ],
            },
            {
                h2: 'Fiabilité des données',
                p: [
                    'Le recensement vient d’OpenStreetMap. Une fontaine peut avoir été mise hors service '
                    + 'sans que la base ait été mise à jour, et à l’inverse des points récents peuvent '
                    + 'manquer. En cas de doute lors d’une sortie longue, emportez de quoi tenir jusqu’au '
                    + 'point suivant.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien de points d’eau potable y a-t-il à Bordeaux ?',
                a: 'Plus de 300 points d’eau sont recensés sur Bordeaux Métropole et le sud de '
                    + 'l’agglomération, en très grande majorité en accès libre.',
            },
            {
                q: 'Les fontaines de Bordeaux fonctionnent-elles toute l’année ?',
                a: 'Non. Une partie du réseau est coupée durant l’hiver pour prévenir le gel, et certains '
                    + 'points sont explicitement saisonniers. L’information est indiquée dans la fiche du '
                    + 'point lorsqu’elle est connue.',
            },
            {
                q: 'L’eau de ces fontaines est-elle potable ?',
                a: 'Seuls les points déclarés potables dans les données ouvertes sont affichés. Les '
                    + 'fontaines ornementales et les points d’eau non potables sont exclus. En cas de '
                    + 'doute, fiez-vous à la signalétique sur place.',
            },
        ],
    },

    'bordeaux/reparation-velo': {
        title: 'Réparer son vélo à Bordeaux — stations et ateliers',
        description: 'Carte des stations de réparation en libre-service et des ateliers vélo de '
            + 'Bordeaux Métropole : gonflage, outils, réparation et entretien.',
        h1: 'Réparation de vélo à Bordeaux',
        intro: 'Une chambre à air crevée, un pneu à regonfler, un dérailleur déréglé : cette carte '
            + 'recense les stations de réparation en libre-service et les ateliers et magasins de cycles '
            + 'de la métropole bordelaise.',
        sections: [
            {
                h2: 'Stations libre-service et ateliers',
                p: [
                    'Les stations en libre-service sont ces totems installés sur l’espace public, '
                    + 'généralement équipés d’une pompe et d’un jeu d’outils au bout d’un câble : de quoi '
                    + 'regonfler, resserrer une selle ou remettre une chaîne. Elles sont gratuites et '
                    + 'accessibles en permanence, mais leur état dépend de l’entretien et du vandalisme.',
                    'Les ateliers et magasins couvrent aussi bien les vélocistes classiques que les '
                    + 'ateliers associatifs d’auto-réparation, où l’on répare soi-même avec les conseils '
                    + 'et l’outillage de l’association. Ces derniers sont souvent la solution la plus '
                    + 'économique pour un entretien de fond.',
                ],
            },
            {
                h2: 'Ce qu’on peut faire soi-même',
                p: [
                    'La crevaison, le réglage des freins et la lubrification de la chaîne sont à la portée '
                    + 'de tous et couvrent la majorité des pannes du quotidien. Emporter une chambre à air '
                    + 'de rechange, deux démonte-pneus et une petite pompe évite la plupart des trajets '
                    + 'interrompus.',
                    'En revanche, un voile de roue, un jeu de direction ou un système de freinage '
                    + 'hydraulique demandent de l’outillage spécifique : mieux vaut passer par un atelier.',
                ],
            },
        ],
        faq: [
            {
                q: 'Les stations de réparation en libre-service sont-elles gratuites ?',
                a: 'Oui, les totems installés sur l’espace public sont gratuits et accessibles en '
                    + 'permanence. Leur outillage peut toutefois être dégradé ou manquant.',
            },
            {
                q: 'Où gonfler ses pneus à Bordeaux ?',
                a: 'Les stations de réparation en libre-service comportent presque toujours une pompe. '
                    + 'Elles apparaissent en orange clair sur la carte.',
            },
            {
                q: 'Quelle différence entre un atelier associatif et un vélociste ?',
                a: 'Dans un atelier associatif, vous réparez vous-même avec l’outillage et les conseils '
                    + 'de bénévoles, en échange d’une adhésion. Chez un vélociste, la réparation est '
                    + 'réalisée pour vous, à un tarif horaire.',
            },
        ],
    },

    'bordeaux/eclairage-public': {
        title: 'Éclairage public à Bordeaux — carte des points lumineux',
        description: 'Carte de l’éclairage public de Bordeaux Métropole : densité des points '
            + 'lumineux et rues éclairées, pour choisir ses trajets de nuit à vélo.',
        h1: 'Éclairage public à Bordeaux',
        intro: 'Quelles rues sont éclairées la nuit à Bordeaux ? Cette carte combine près de 38 000 '
            + 'points lumineux recensés et les rues identifiées comme éclairées, pour visualiser d’un '
            + 'coup d’œil les axes praticables une fois la nuit tombée.',
        sections: [
            {
                h2: 'Deux couches complémentaires',
                p: [
                    'La première couche est une carte de densité : plus une zone est jaune et lumineuse, '
                    + 'plus les points lumineux y sont nombreux. Elle donne une lecture d’ensemble du '
                    + 'maillage — centre-ville dense, boulevards bien équipés, franges métropolitaines '
                    + 'nettement plus sombres.',
                    'La seconde couche trace les rues elles-mêmes. Un tracé franc signale une rue dont '
                    + 'l’éclairage est explicitement relevé ; un tracé plus pâle signale un éclairage '
                    + 'déduit de la présence de lampadaires à proximité immédiate. Cette distinction '
                    + 'compte : le second cas est une estimation, pas un relevé.',
                ],
            },
            {
                h2: 'Rouler de nuit en sécurité',
                p: [
                    'L’éclairage public ne remplace pas l’éclairage du vélo, qui reste obligatoire : feu '
                    + 'blanc à l’avant, feu rouge à l’arrière, catadioptres et gilet rétroréfléchissant hors '
                    + 'agglomération la nuit. Une rue éclairée améliore votre vision, pas nécessairement '
                    + 'votre visibilité pour les autres.',
                    'À Bordeaux comme ailleurs, plusieurs communes pratiquent l’extinction nocturne au '
                    + 'milieu de la nuit pour des raisons d’économie et de biodiversité. Une rue marquée '
                    + 'comme éclairée peut donc être plongée dans le noir à trois heures du matin.',
                ],
            },
            {
                h2: 'Origine des données',
                p: [
                    'Les points lumineux proviennent d’OpenStreetMap, densifiés par le jeu de données '
                    + '« Points lumineux » ouvert par Bordeaux Métropole. Les doublons entre les deux '
                    + 'sources sont écartés automatiquement lorsque deux points sont distants de moins de '
                    + 'huit mètres.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien de lampadaires compte Bordeaux Métropole ?',
                a: 'Près de 38 000 points lumineux sont cartographiés sur l’emprise couverte, en '
                    + 'combinant OpenStreetMap et les données ouvertes de Bordeaux Métropole.',
            },
            {
                q: 'Que signifie une rue en jaune pâle ?',
                a: 'Que son éclairage est déduit plutôt que relevé : des points lumineux se trouvent à '
                    + 'proximité immédiate, mais la rue elle-même n’est pas explicitement décrite comme '
                    + 'éclairée dans les données. C’est une estimation.',
            },
            {
                q: 'L’éclairage est-il pris en compte dans le calcul d’itinéraire ?',
                a: 'Oui. Sécu’Cycle intègre l’éclairage dans le score de sécurité des tronçons, ce qui '
                    + 'influence les itinéraires proposés, en particulier pour les trajets de nuit.',
            },
            {
                q: 'Les lampadaires restent-ils allumés toute la nuit ?',
                a: 'Pas partout. Plusieurs communes éteignent tout ou partie de leur éclairage au cœur de '
                    + 'la nuit. La carte montre l’implantation des points lumineux, pas leur plage de '
                    + 'fonctionnement.',
            },
        ],
    },

    'bordeaux/velos-libre-service': {
        title: 'Vélos libre-service à Bordeaux — stations Le Vélo en direct',
        description: 'Carte en temps réel des stations de vélos en libre-service de Bordeaux '
            + 'Métropole (Le Vélo, ex-V³ / TBM) : vélos mécaniques, électriques et places libres.',
        h1: 'Vélos en libre-service à Bordeaux',
        intro: 'Combien de vélos reste-t-il à la station la plus proche ? Cette carte affiche en temps '
            + 'réel les stations du service Le Vélo de Bordeaux Métropole — anciennement V³ — avec le '
            + 'nombre de vélos mécaniques, de vélos électriques et de places libres.',
        sections: [
            {
                h2: 'Une carte rafraîchie en continu',
                p: [
                    'Les disponibilités proviennent du flux GBFS publié par l’exploitant et sont '
                    + 'rafraîchies automatiquement. La pastille de chaque station indique d’un coup d’œil '
                    + 'son état : des vélos disponibles, une station presque vide, complètement vide, ou '
                    + 'au contraire pleine — auquel cas vous ne pourrez pas y rendre votre vélo.',
                    'Le compteur affiché sur la pastille est le nombre de vélos disponibles. En ouvrant '
                    + 'une station, vous voyez le détail entre vélos mécaniques et vélos à assistance '
                    + 'électrique, ainsi que le nombre de points d’attache libres.',
                ],
            },
            {
                h2: 'Libre-service ou vélo personnel ?',
                p: [
                    'Le libre-service excelle sur les trajets courts et les déplacements à sens unique — '
                    + 'aller en tram, revenir à vélo. Pour un trajet domicile-travail quotidien, un vélo '
                    + 'personnel bien stationné revient souvent moins cher et évite l’aléa d’une station '
                    + 'vide au départ ou pleine à l’arrivée.',
                    'Un réflexe utile : vérifier l’état de la station d’arrivée avant de partir. Une '
                    + 'station pleine en hypercentre à l’heure de pointe est fréquente, et impose de '
                    + 'poursuivre jusqu’à la suivante.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien de stations Le Vélo compte Bordeaux ?',
                a: 'Le service exploité pour Bordeaux Métropole compte environ 230 stations sur '
                    + 'l’agglomération, toutes affichées sur cette carte.',
            },
            {
                q: 'Les données sont-elles en temps réel ?',
                a: 'Oui, elles proviennent du flux GBFS officiel et sont rafraîchies en continu. La date '
                    + 'du dernier relevé est indiquée sur la carte ; en cas de relevé ancien, un '
                    + 'avertissement s’affiche.',
            },
            {
                q: 'V³ et Le Vélo, est-ce le même service ?',
                a: 'Oui. Le service de vélos en libre-service de Bordeaux Métropole, longtemps connu sous '
                    + 'le nom V³, est aujourd’hui commercialisé sous la marque Le Vélo au sein de l’offre '
                    + 'TBM.',
            },
            {
                q: 'Puis-je voir les stations pendant un calcul d’itinéraire ?',
                a: 'Oui, la couche « Vélos en libre-service » est disponible sur la carte d’itinéraire. '
                    + 'Le bouton en haut de cette page l’active directement.',
            },
        ],
    },

    'bordeaux/trafic-routier': {
        title: 'Trafic à Bordeaux en temps réel — carte de la circulation',
        description: 'Carte du trafic routier en temps réel à Bordeaux Métropole : axes fluides, '
            + 'denses et embouteillés, avec la lecture cycliste des zones à éviter.',
        h1: 'Trafic routier à Bordeaux en temps réel',
        intro: 'Où ça bouchonne à Bordeaux en ce moment ? Cette carte affiche l’état de circulation des '
            + 'axes de la métropole, mis à jour en continu à partir des données ouvertes de Bordeaux '
            + 'Métropole — et ce que cela implique quand on circule à vélo.',
        sections: [
            {
                h2: 'Lire la carte',
                p: [
                    'Chaque tronçon est coloré selon son état : vert pour une circulation fluide, orange '
                    + 'pour une circulation dense, rouge pour un axe embouteillé, gris quand le capteur ne '
                    + 'remonte pas d’information exploitable. Les données couvrent les axes structurants '
                    + 'de la métropole, pas la totalité de la voirie.',
                    'L’information est rafraîchie automatiquement toutes les quelques minutes. Les pointes '
                    + 'les plus marquées se concentrent sur la rocade, les ponts sur la Garonne et les '
                    + 'boulevards, aux heures d’entrée et de sortie d’agglomération.',
                ],
            },
            {
                h2: 'Ce que le trafic change à vélo',
                p: [
                    'Un axe embouteillé n’est pas un axe sûr pour un cycliste. La congestion multiplie les '
                    + 'dépassements serrés, les remontées de file et surtout le risque d’emportiérage — '
                    + 'l’ouverture soudaine d’une portière — qui est l’une des causes majeures de chute '
                    + 'en ville.',
                    'À l’inverse, une circulation dense mais lente peut être plus tolérable qu’un axe '
                    + 'fluide où les voitures roulent vite. Sécu’Cycle en tient compte : ses itinéraires '
                    + 'contournent en priorité les axes rouges quand une alternative raisonnable existe.',
                ],
            },
        ],
        faq: [
            {
                q: 'D’où viennent les données de trafic ?',
                a: 'Du jeu de données ouvert de Bordeaux Métropole décrivant l’état de circulation des '
                    + 'axes, publié sous Licence Ouverte et rafraîchi en continu.',
            },
            {
                q: 'Tous les axes sont-ils couverts ?',
                a: 'Non. Le dispositif porte sur les axes structurants équipés de capteurs — environ 700 '
                    + 'tronçons. Les rues résidentielles n’y figurent pas.',
            },
            {
                q: 'Le trafic influence-t-il les itinéraires proposés ?',
                a: 'Oui, la couche est intégrée au calcul : à trajet comparable, Sécu’Cycle privilégie '
                    + 'les parcours qui évitent les axes les plus chargés.',
            },
        ],
    },

    'bordeaux/accidents-velo': {
        title: 'Accidents à vélo à Bordeaux — carte de l’accidentologie',
        description: 'Carte des accidents corporels impliquant un cycliste à Bordeaux Métropole, '
            + 'de 2015 à 2023, issue des données BAAC de l’ONISR.',
        h1: 'Accidents à vélo à Bordeaux',
        // Statbel ne couvre que la Belgique : citer les deux sources sur une page française
        // était trompeur.
        sources: [SOURCE_BAAC],
        intro: 'Où les cyclistes sont-ils accidentés à Bordeaux ? Cette carte recense les accidents '
            + 'corporels impliquant un vélo sur la métropole entre 2015 et 2023, à partir des bulletins '
            + 'd’analyse des accidents corporels (BAAC) publiés par l’ONISR.',
        sections: [
            {
                h2: 'Lire la carte sans la surinterpréter',
                p: [
                    'À faible zoom, la carte affiche une densité : les zones chaudes signalent les '
                    + 'secteurs où les accidents se concentrent. En zoomant, chaque accident apparaît '
                    + 'individuellement, coloré selon sa gravité — blessé léger, blessé hospitalisé, ou '
                    + 'accident mortel.',
                    'Une précaution s’impose : une concentration d’accidents traduit autant l’intensité '
                    + 'du trafic cycliste que la dangerosité intrinsèque d’un lieu. Un carrefour très '
                    + 'fréquenté cumulera mécaniquement plus d’accidents qu’une rue déserte, sans '
                    + 'nécessairement être plus dangereux par kilomètre parcouru. Ces données ne '
                    + 'permettent pas de calculer un taux, faute de mesure de l’exposition.',
                ],
            },
            {
                h2: 'Ce que recouvrent les données',
                p: [
                    'Seuls les accidents corporels ayant donné lieu à une intervention des forces de '
                    + 'l’ordre sont enregistrés. Les chutes sans tiers, les accrochages réglés à l’amiable '
                    + 'et l’immense majorité des incidents sans blessure n’y figurent pas : le nombre réel '
                    + 'd’accidents est très supérieur à ce que montre la carte.',
                    'La gravité est celle de la victime la plus touchée. Chaque fiche précise, quand '
                    + 'l’information est disponible, les conditions de luminosité, la météo, le type de '
                    + 'collision et la nature de la voie.',
                ],
            },
            {
                h2: 'Comment Sécu’Cycle s’en sert',
                p: [
                    'Ces accidents ne servent pas qu’à l’illustration : ils sont rattachés aux tronçons du '
                    + 'graphe routier dans un rayon de 25 mètres et appliquent un malus au score de '
                    + 'sécurité. Ce malus décroît avec le temps — un accident de 2015 pèse beaucoup moins '
                    + 'qu’un accident récent — et reste plafonné, afin de ne jamais faire basculer à lui '
                    + 'seul le choix d’un itinéraire.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien d’accidents à vélo sont recensés à Bordeaux ?',
                a: 'Environ 460 accidents corporels impliquant un cycliste sont cartographiés sur '
                    + 'l’emprise couverte entre 2015 et 2023, dont près de 90 ayant entraîné une '
                    + 'hospitalisation et 8 décès.',
            },
            {
                q: 'D’où viennent ces données ?',
                a: 'Des bulletins d’analyse des accidents corporels (BAAC) renseignés par les forces de '
                    + 'l’ordre et publiés par l’ONISR, via le jeu de données dérivé « Accidents de vélo » '
                    + 'diffusé sur data.gouv.fr sous Licence Ouverte 2.0.',
            },
            {
                q: 'Une zone rouge signifie-t-elle que l’endroit est dangereux ?',
                a: 'Pas mécaniquement. Elle signale une concentration d’accidents, qui dépend aussi du '
                    + 'nombre de cyclistes qui y passent. Sans donnée de fréquentation, on ne peut pas en '
                    + 'déduire un risque par kilomètre parcouru.',
            },
            {
                q: 'Les données sont-elles à jour ?',
                a: 'La publication des BAAC intervient avec un décalage de plusieurs années. Les données '
                    + 'disponibles couvrent actuellement la période 2015-2023.',
            },
        ],
    },

    'rennes/stationnements-velo': {
        title: 'Stationnements vélo à Rennes — carte des arceaux et abris',
        description: 'Carte interactive des stationnements vélo de Rennes Métropole : arceaux, '
            + 'râteliers, abris et consignes sécurisées, avec leur capacité quand elle est connue.',
        h1: 'Stationnements vélo à Rennes',
        intro: 'Où attacher son vélo à Rennes ? Cette carte recense les arceaux, râteliers, abris et '
            + 'consignes des 43 communes de la métropole, du centre intra-rocade aux communes '
            + 'périphériques, avec le type d’équipement et le nombre de places lorsqu’il est renseigné.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Chaque point est un emplacement de stationnement relevé par les contributeurs '
                    + 'OpenStreetMap. Les arceaux dominent largement : ce sont les seuls équipements qui '
                    + 'permettent d’attacher à la fois le cadre et une roue avec un antivol en U, et donc '
                    + 'les seuls à recommander pour un stationnement de plusieurs heures.',
                    'Les râteliers et pince-roues, qui ne maintiennent que la roue avant, exposent au vol '
                    + 'et à la voilure de la jante. Les abris et consignes fermées apparaissent dans une '
                    + 'catégorie distincte ; ils se concentrent autour de la gare, des stations de métro '
                    + 'et des parcs relais de la métropole.',
                ],
            },
            {
                h2: 'Une métropole dense, un stationnement inégal',
                p: [
                    'Près de 2 900 emplacements sont recensés sur Rennes Métropole, mais leur répartition '
                    + 'suit celle des pôles d’activité : centre-ville, campus de Beaulieu et de Villejean, '
                    + 'abords des stations de métro. Dans les communes de la couronne — Betton, Bruz, '
                    + 'Mordelles, Cesson-Sévigné — le maillage se resserre autour des gares, des mairies '
                    + 'et des équipements scolaires.',
                    'Le rabattement à vélo vers les stations de métro et les gares est l’usage qui pèse le '
                    + 'plus sur la demande de stationnement : c’est là que les abris fermés font la '
                    + 'différence, en couvrant une journée entière de stationnement sans surveillance.',
                ],
            },
            {
                h2: 'Stationner sans se faire voler',
                p: [
                    'Attachez le cadre à un point fixe, jamais la roue seule, et préférez un antivol en U '
                    + 'certifié. Le marquage Bicycode, obligatoire à la vente d’un vélo neuf depuis 2021, '
                    + 'augmente nettement les chances de restitution en cas de vol : enregistrez votre '
                    + 'vélo si ce n’est pas déjà fait.',
                    'Les données proviennent d’OpenStreetMap et sont resynchronisées automatiquement : un '
                    + 'arceau posé récemment peut manquer, un équipement démonté peut subsister quelques '
                    + 'semaines. Toute correction faite sur OpenStreetMap se retrouve ici après la '
                    + 'synchronisation suivante.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien y a-t-il de stationnements vélo à Rennes ?',
                a: 'Près de 2 900 emplacements sont recensés sur les 43 communes de Rennes Métropole, '
                    + 'dans leur grande majorité des arceaux. S’y ajoutent plusieurs centaines d’abris et '
                    + 'de consignes fermées, principalement aux abords des gares et du métro.',
            },
            {
                q: 'Quelle est la différence entre un arceau et un râtelier ?',
                a: 'Un arceau est un tube en U inversé auquel on attache le cadre et une roue : c’est le '
                    + 'dispositif recommandé. Un râtelier, ou pince-roue, ne retient que la roue avant, ce '
                    + 'qui protège mal du vol et peut voiler la jante.',
            },
            {
                q: 'Où trouver un stationnement vélo sécurisé à Rennes ?',
                a: 'Les abris fermés et consignes individuelles se concentrent autour de la gare de '
                    + 'Rennes, des stations de métro et des parcs relais. Ils apparaissent sur la carte '
                    + 'dans la catégorie « Abris et consignes ».',
            },
            {
                q: 'Un stationnement manque sur la carte, comment le signaler ?',
                a: 'Les données viennent d’OpenStreetMap : vous pouvez ajouter l’emplacement directement '
                    + 'sur openstreetmap.org, il sera repris à la synchronisation suivante. Vous pouvez '
                    + 'aussi nous écrire via la page Contact.',
            },
            {
                q: 'Sécu’Cycle calcule-t-il un itinéraire jusqu’à ces stationnements ?',
                a: 'Pas pour le moment : le calcul de trajet s’appuie sur un réseau routier '
                    + 'chargé en mémoire par notre serveur, réduit à Bordeaux et à la région '
                    + 'de Tournai. Les données rennaises affichées ici restent, elles, '
                    + 'synchronisées automatiquement.',
            },
        ],
    },

    'rennes/toilettes-publiques': {
        title: 'Toilettes publiques à Rennes — carte interactive',
        description: 'Carte des toilettes publiques de Rennes et de sa métropole : sanitaires '
            + 'gratuits, payants et accessibles en fauteuil roulant, localisés et à jour.',
        h1: 'Toilettes publiques à Rennes',
        intro: 'Cette carte localise les toilettes publiques recensées sur Rennes Métropole — sanitaires '
            + 'de voirie, blocs des parcs et jardins, équipements de gares et de marchés — en distinguant '
            + 'les toilettes gratuites des payantes et en signalant celles accessibles en fauteuil roulant.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Environ 260 emplacements sont cartographiés sur la métropole. La couleur du repère '
                    + 'indique le tarif : gratuit, payant, ou non renseigné lorsque l’information manque '
                    + 'dans les données ouvertes. Le violet signifie donc « inconnu », pas « payant ».',
                    'Une partie des emplacements porte des horaires d’ouverture. Les blocs sanitaires des '
                    + 'parcs — Thabor, Gayeulles, prairies Saint-Martin — suivent les horaires du parc '
                    + 'lui-même, qui varient fortement entre l’hiver et l’été : vérifiez l’horaire affiché '
                    + 'dans la fiche avant de vous déplacer.',
                ],
            },
            {
                h2: 'Gratuité et accessibilité',
                p: [
                    'La très grande majorité des sanitaires recensés à Rennes sont gratuits. Les rares '
                    + 'équipements payants se trouvent surtout en gare et dans quelques pôles commerciaux. '
                    + 'L’accessibilité en fauteuil roulant est indiquée quand elle a été relevée, mais ce '
                    + 'champ est moins bien renseigné que la position : son absence ne veut pas dire que '
                    + 'le lieu est inaccessible.',
                ],
            },
            {
                h2: 'Utile à vélo comme à pied',
                p: [
                    'Cette carte est un sous-produit de Sécu’Cycle, un calculateur '
                        + 'd’itinéraires cyclables sécurisés. Sur un trajet le long de la '
                        + 'Vilaine ou du canal d’Ille-et-Rance, savoir où se trouve le '
                        + 'prochain sanitaire ouvert évite un détour hasardeux : repérez-en '
                        + 'un ou deux avant de partir. Le calcul d’itinéraire, lui, ne '
                        + 'dessert pas Rennes Métropole pour le moment.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien de toilettes publiques sont recensées à Rennes ?',
                a: 'Environ 260 emplacements sont cartographiés sur les 43 communes de Rennes Métropole, '
                    + 'des sanitaires de voirie du centre-ville aux blocs des parcs et des équipements '
                    + 'sportifs de la couronne.',
            },
            {
                q: 'Les toilettes publiques sont-elles gratuites à Rennes ?',
                a: 'Dans leur grande majorité, oui. Les sanitaires de voirie et ceux des parcs municipaux '
                    + 'sont gratuits ; seuls quelques équipements, principalement en gare, sont payants.',
            },
            {
                q: 'Les horaires d’ouverture sont-ils fiables ?',
                a: 'Ils proviennent d’OpenStreetMap et ne sont renseignés que pour une partie des '
                    + 'emplacements. Les blocs de parcs suivent les horaires du parc, variables selon la '
                    + 'saison. Considérez-les comme indicatifs.',
            },
            {
                q: 'Ces toilettes s’affichent-elles pendant un calcul d’itinéraire ?',
                a: 'Pas à Rennes pour le moment : le calcul d’itinéraire s’appuie sur un '
                    + 'réseau routier chargé en mémoire, qui ne couvre plus que Bordeaux et '
                    + 'la région de Tournai. La couche existe sur ces emprises ; ici, la '
                    + 'carte se consulte pour elle-même.',
            },
        ],
    },

    'rennes/points-eau': {
        title: 'Points d’eau potable à Rennes — carte des fontaines',
        description: 'Carte des fontaines et points d’eau potable de Rennes Métropole, utile aux '
            + 'cyclistes, coureurs et promeneurs pour remplir sa gourde.',
        h1: 'Points d’eau potable à Rennes',
        intro: 'Où remplir sa gourde à Rennes ? Cette carte recense les fontaines et points d’eau '
            + 'potable accessibles librement sur la métropole — un réflexe utile à vélo, en courant, ou '
            + 'lors des épisodes de forte chaleur.',
        sections: [
            {
                h2: 'Un recensement à prendre pour ce qu’il est',
                p: [
                    'Près de 90 points d’eau sont cartographiés sur la métropole. Le chiffre est '
                    + 'modeste, et il faut le lire comme une borne basse : il décrit l’état des '
                    + 'contributions à OpenStreetMap, pas l’équipement réel des communes. Une part du '
                    + 'réseau municipal n’y figure simplement pas encore.',
                    'Autrement dit, l’absence de repère dans un quartier ne prouve rien. La présence '
                    + 'd’un repère, elle, est fiable : seuls les points explicitement déclarés potables '
                    + 'sont retenus, et les fontaines ornementales écartées.',
                ],
            },
            {
                h2: 'Les parcs et l’eau vive',
                p: [
                    'Le peu qui est recensé se concentre là où l’on s’attend à le trouver : le Thabor, '
                    + 'les Gayeulles, les prairies Saint-Martin, et les berges du canal d’Ille-et-Rance. '
                    + 'Ce sont aussi les itinéraires que l’on choisit spontanément à vélo, ce qui rend '
                    + 'la carte plus utile que son total ne le laisse craindre.',
                    'Un point porte parfois une restriction d’accès — enceinte privée, réservé aux '
                    + 'usagers d’un équipement. Elle est signalée, pour éviter le détour qui se termine '
                    + 'devant une grille.',
                ],
            },
            {
                h2: 'Boire avant d’avoir soif',
                p: [
                    'La déshydratation dégrade la vigilance bien avant de donner soif, et la vigilance '
                    + 'est exactement ce dont on a besoin en circulation. Sur un trajet estival, buvez '
                    + 'par anticipation plutôt qu’à la demande.',
                    'Sur une sortie longue, ne construisez pas votre ravitaillement sur cette carte '
                    + 'seule : une partie des fontaines est purgée l’hiver contre le gel, d’autres sont '
                    + 'saisonnières, et toutes ne sont pas documentées. Une gourde pleine au départ vaut '
                    + 'mieux qu’un point d’eau espéré.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien de points d’eau potable y a-t-il à Rennes ?',
                a: 'Près de 90 sont recensés sur Rennes Métropole, presque tous en accès libre. Ce '
                    + 'total reflète l’avancement du relevé collaboratif et progresse au fil des '
                    + 'contributions.',
            },
            {
                q: 'Pourquoi si peu de points par rapport à d’autres villes ?',
                a: 'Parce que le recensement rennais dans OpenStreetMap est moins avancé, non parce que '
                    + 'la ville serait moins équipée. La carte mesure ici la donnée disponible, pas le '
                    + 'terrain.',
            },
            {
                q: 'Les fontaines rennaises coulent-elles en hiver ?',
                a: 'Pas toutes : une partie du réseau est coupée pour prévenir le gel et certains '
                    + 'points ne fonctionnent qu’à la belle saison. La fiche l’indique lorsque '
                    + 'l’information est connue.',
            },
            {
                q: 'Puis-je faire passer mon itinéraire par ces fontaines ?',
                a: 'Pas à Rennes pour le moment. Le calcul d’itinéraire ne dessert plus que '
                    + 'Bordeaux et la région de Tournai, faute d’un réseau routier chargé '
                    + 'au-delà. Repérez vos points de remplissage sur cette carte avant de '
                    + 'partir.',
            },
        ],
    },

    'rennes/reparation-velo': {
        title: 'Réparer son vélo à Rennes — stations et ateliers',
        description: 'Carte des stations de réparation en libre-service et des ateliers vélo de '
            + 'Rennes Métropole : gonflage, outils, réparation et entretien.',
        h1: 'Réparation de vélo à Rennes',
        intro: 'Un pneu à plat devant la fac, un dérailleur qui saute sur la montée de la rue de '
            + 'Fougères : cette carte recense les points de réparation vélo de Rennes Métropole, du '
            + 'totem de rue à l’atelier associatif.',
        sections: [
            {
                h2: 'Une culture de l’auto-réparation',
                p: [
                    'Rennes est une ville jeune, et cela se lit dans son maillage : les ateliers '
                    + 'd’auto-réparation, où l’on remet soi-même son vélo en état avec l’outillage et '
                    + 'les conseils de bénévoles, y tiennent une place inhabituelle pour une '
                    + 'agglomération de cette taille. Contre une adhésion, on y apprend à entretenir sa '
                    + 'machine plutôt qu’à la faire entretenir.',
                    'À côté d’eux, les vélocistes prennent le vélo en charge au tarif horaire, et les '
                    + 'totems installés sur la voirie assurent le dépannage immédiat : pompe au sol, '
                    + 'clés et tournevis au bout d’un câble, gratuits et disponibles à toute heure. Un '
                    + 'peu plus de 80 adresses, tous types confondus, sont recensées sur la métropole.',
                ],
            },
            {
                h2: 'Anticiper plutôt que subir',
                p: [
                    'La crevaison représente l’essentiel des pannes du quotidien, et se règle au bord '
                    + 'de la route avec une chambre à air de rechange, deux démonte-pneus et une pompe '
                    + 'de poche. Un multi-outil couvre presque tout le reste : patin qui frotte, selle '
                    + 'qui pivote, dérailleur mal ajusté.',
                    'Une roue voilée, un jeu de direction usé ou un frein hydraulique à purger '
                    + 'demandent un outillage spécifique. C’est précisément là que l’atelier associatif '
                    + 'devient intéressant : l’outil est sur place, et la réparation vous reste acquise.',
                ],
            },
        ],
        faq: [
            {
                q: 'Où gonfler ses pneus gratuitement à Rennes ?',
                a: 'Aux totems de réparation installés sur l’espace public : presque tous disposent '
                    + 'd’une pompe à pied, utilisable sans formalité ni paiement. Ils apparaissent en '
                    + 'orange clair sur la carte.',
            },
            {
                q: 'Comment fonctionne un atelier d’auto-réparation ?',
                a: 'Vous adhérez, puis vous réparez vous-même sur un établi mis à disposition, avec '
                    + 'l’outillage de l’atelier et l’aide de bénévoles. Le coût se limite le plus '
                    + 'souvent à l’adhésion et aux pièces.',
            },
            {
                q: 'Les totems de rue sont-ils toujours en état ?',
                a: 'Non. Ils sont gratuits et permanents, mais leur outillage est exposé au vandalisme '
                    + 'et aux arrachages. Mieux vaut ne pas compter uniquement dessus pour un trajet '
                    + 'que l’on ne peut pas se permettre d’interrompre.',
            },
            {
                q: 'Sécu’Cycle peut-il me guider jusqu’à un atelier ?',
                a: 'Pas à Rennes pour le moment, le calcul d’itinéraire n’y étant plus '
                    + 'disponible. La carte donne les adresses et, quand l’information '
                    + 'existe, la nature de chaque point de réparation.',
            },
        ],
    },

    'rennes/velos-libre-service': {
        title: 'LE vélo STAR à Rennes — stations en temps réel',
        description: 'Carte en temps réel des stations de vélos en libre-service LE vélo STAR à '
            + 'Rennes Métropole : vélos disponibles et places libres, station par station.',
        h1: 'Vélos en libre-service à Rennes',
        sources: [SOURCE_GBFS_RENNES],
        intro: 'Combien de vélos reste-t-il à la station la plus proche ? Cette carte affiche en temps '
            + 'réel les stations de LE vélo STAR, le service de vélos en libre-service de Rennes '
            + 'Métropole exploité par la STAR, avec le nombre de vélos disponibles et de places libres.',
        sections: [
            {
                h2: 'Une carte rafraîchie en continu',
                p: [
                    'Les disponibilités proviennent du flux GBFS publié par l’exploitant et sont '
                    + 'rafraîchies automatiquement. La pastille de chaque station indique d’un coup d’œil '
                    + 'son état : des vélos disponibles, une station presque vide, complètement vide, ou '
                    + 'au contraire pleine — auquel cas vous ne pourrez pas y rendre votre vélo.',
                    'Le flux rennais est publié dans une version ancienne du standard GBFS, qui ne décrit '
                    + 'pas les types de véhicules. La fiche d’une station affiche donc le nombre total de '
                    + 'vélos disponibles, sans ventilation entre mécaniques et électriques : nous '
                    + 'préférons ne rien afficher plutôt qu’inventer une répartition.',
                ],
            },
            {
                h2: 'Un service intra-rocade, et qui l’assume',
                p: [
                    'La soixantaine de stations se masse à l’intérieur de la rocade, au plus près du '
                    + 'centre et des campus. Ce choix rend le service redoutable sur son terrain — '
                    + 'trajet court, déplacement à sens unique, aller en métro et retour à vélo — et '
                    + 'inopérant au-delà : depuis Betton ou Bruz, aucune station ne vous attend.',
                    'La ligne de partage est nette, et vaut la peine d’être connue avant de fonder un '
                    + 'trajet quotidien dessus. Pour un domicile-travail depuis la couronne, le vélo '
                    + 'personnel n’a pas de concurrent ; pour un déplacement interne à Rennes, la '
                    + 'station est presque toujours à portée.',
                ],
            },
        ],
        faq: [
            {
                q: 'Le service dessert-il toute Rennes Métropole ?',
                a: 'Non. La soixantaine de stations publiées se situe presque intégralement sur la '
                    + 'commune de Rennes, à l’intérieur de la rocade. Les communes de la couronne ne '
                    + 'sont pas desservies.',
            },
            {
                q: 'Pourquoi le détail entre vélos mécaniques et électriques n’apparaît-il pas ?',
                a: 'Parce que le flux rennais suit une version du standard GBFS antérieure à la '
                    + 'description des types de véhicules. Seul le total est publié, et nous préférons '
                    + 'l’afficher tel quel plutôt que d’inventer une répartition.',
            },
            {
                q: 'Comment savoir si je pourrai rendre mon vélo à l’arrivée ?',
                a: 'La pastille d’une station signale l’état « pleine », c’est-à-dire sans point '
                    + 'd’attache libre. Consultez la station d’arrivée avant de partir : en hypercentre '
                    + 'aux heures de pointe, le cas est courant.',
            },
            {
                q: 'Ces disponibilités sont-elles fiables ?',
                a: 'Elles viennent du flux officiel de l’exploitant, rafraîchi en continu. La date du '
                    + 'dernier relevé est affichée, et un avertissement apparaît si elle commence à '
                    + 'dater.',
            },
            {
                q: 'Peut-on calculer un trajet depuis une station LE vélo STAR ?',
                a: 'Pas pour l’instant : les disponibilités sont bien affichées en direct, '
                    + 'mais le calcul d’itinéraire ne couvre plus que Bordeaux et la région '
                    + 'de Tournai.',
            },
        ],
    },

    'rennes/trafic-routier': {
        title: 'Trafic à Rennes en temps réel — carte de la circulation',
        description: 'Carte du trafic routier en temps réel à Rennes Métropole : rocade, radiales et '
            + 'axes urbains, fluides, denses ou embouteillés, avec la lecture cycliste.',
        h1: 'Trafic routier à Rennes en temps réel',
        sources: [SOURCE_TRAFIC_RENNES],
        intro: 'Où ça bouchonne à Rennes en ce moment ? Cette carte affiche l’état de circulation des '
            + 'axes de la métropole, mis à jour en continu à partir des données ouvertes de Rennes '
            + 'Métropole — et ce que cela implique quand on circule à vélo.',
        sections: [
            {
                h2: 'Lire la carte',
                p: [
                    'Chaque tronçon est coloré selon son état : vert pour une circulation fluide, orange '
                    + 'pour une circulation dense, rouge pour un axe embouteillé, gris quand la mesure '
                    + 'n’est pas exploitable. Le dispositif rennais est l’un des plus fins de France : '
                    + 'près de 2 900 tronçons sont décrits, bien au-delà des seuls grands axes.',
                    'Les pointes se concentrent sur la rocade, ses échangeurs et les radiales qui y '
                    + 'aboutissent, aux heures d’entrée et de sortie d’agglomération. À l’intérieur, les '
                    + 'axes qui longent la Vilaine et les grands boulevards saturent plus tôt le soir que '
                    + 'le matin.',
                ],
            },
            {
                h2: 'Une finesse qui profite au cycliste',
                p: [
                    'Avec près de 2 900 tronçons décrits contre quelques centaines ailleurs, le relevé '
                    + 'rennais ne se limite pas aux voies rapides : il descend jusqu’aux axes urbains '
                    + 'que l’on emprunte réellement à vélo. La carte cesse alors d’être une '
                    + 'information automobile pour devenir un outil de choix d’itinéraire.',
                    'Concrètement, on peut y comparer deux traversées possibles du centre '
                        + 'plutôt que de constater l’état de la rocade, et préférer à durée '
                        + 'voisine une parallèle apaisée — souvent le long de la Vilaine ou '
                        + 'du canal d’Ille-et-Rance. L’arbitrage reste ici manuel : le calcul '
                        + 'd’itinéraire ne dessert pas Rennes Métropole pour le moment.',
                ],
            },
            {
                h2: 'Dense n’est pas dangereux, fluide n’est pas sûr',
                p: [
                    'La congestion multiplie les remontées de file et les ouvertures de portière, deux '
                    + 'causes majeures de chute en ville. Mais un axe fluide où les voitures roulent '
                    + 'vite reste souvent le plus redoutable des deux : la gravité d’un choc dépend '
                    + 'davantage de la vitesse que de la densité.',
                    'Là où Sécu’Cycle calcule des trajets, son score de sécurité croise '
                        + 'd’ailleurs l’état du trafic avec la vitesse autorisée et la '
                        + 'présence d’un aménagement cyclable, plutôt que de fuir '
                        + 'mécaniquement tout ce qui est rouge. Le même raisonnement se mène '
                        + 'à l’œil sur cette carte.',
                ],
            },
        ],
        faq: [
            {
                q: 'D’où viennent les données de trafic rennais ?',
                a: 'Du jeu « État du trafic en temps réel » publié par Rennes Métropole sur son portail '
                    + 'open data, sous licence ODbL, et rafraîchi en continu.',
            },
            {
                q: 'La couverture rennaise est-elle complète ?',
                a: 'Elle est inhabituellement large — près de 2 900 tronçons, des voies rapides aux '
                    + 'axes urbains — sans pour autant descendre jusqu’à la rue résidentielle, qui '
                    + 'n’est pas instrumentée.',
            },
            {
                q: 'Le trafic influence-t-il les itinéraires proposés à Rennes ?',
                a: 'Pas pour l’instant : le calcul d’itinéraire ne couvre plus que Bordeaux '
                    + 'et la région de Tournai. Là où il fonctionne, la couche est intégrée '
                    + 'au calcul et, à trajet comparable, Sécu’Cycle privilégie les parcours '
                    + 'qui évitent les axes les plus chargés.',
            },
        ],
    },

    'rennes/accidents-velo': {
        title: 'Accidents à vélo à Rennes — carte de l’accidentologie',
        description: 'Carte des accidents corporels impliquant un cycliste à Rennes Métropole, de '
            + '2015 à 2023, issue des données BAAC publiées par l’ONISR.',
        h1: 'Accidents à vélo à Rennes',
        sources: [SOURCE_BAAC],
        intro: 'Où les cyclistes rennais sont-ils accidentés ? Cette carte reporte les accidents '
            + 'corporels impliquant un vélo sur la métropole entre 2015 et 2023, tels que les ont '
            + 'consignés les forces de l’ordre.',
        sections: [
            {
                h2: 'Le piège du dénominateur',
                p: [
                    'Rennes est une ville étudiante à forte pratique cycliste, et cela déforme la '
                    + 'lecture de la carte. Les abords des campus de Beaulieu et de Villejean, les '
                    + 'quais de la Vilaine et les carrefours du centre concentrent les accidents '
                    + 'd’abord parce qu’ils concentrent les cyclistes.',
                    'Un point chaud mesure donc un produit — risque multiplié par fréquentation — dont '
                    + 'nous ne connaissons qu’un facteur. Une rue vide où personne ne roule ne '
                    + 'ressortira jamais, si dangereuse soit-elle ; c’est le principal angle mort de '
                    + 'toute carte d’accidentologie.',
                ],
            },
            {
                h2: 'Ce que le registre laisse dehors',
                p: [
                    'Un accident n’est consigné que s’il a été corporel et a donné lieu à une '
                    + 'intervention. Chute isolée sur rail ou sur gravier, portière ouverte sans '
                    + 'blessure, accrochage réglé sur le trottoir : rien de tout cela n’existe dans les '
                    + 'données. Le volume réel dépasse largement ce que la carte affiche.',
                    'En zoomant, chaque accident se détache et se colore selon la gravité de la '
                    + 'victime la plus touchée. La fiche précise, quand l’information a été relevée, la '
                    + 'luminosité, la météo, le type de collision et la nature de la voie — de quoi '
                    + 'distinguer un choc nocturne en périphérie d’un accrochage diurne en centre-ville.',
                ],
            },
            {
                h2: 'Ce que le calculateur en fait',
                p: [
                    'Là où Sécu’Cycle calcule des trajets, chaque accident applique un malus '
                        + 'au score de sécurité des tronçons situés dans un rayon de 25 '
                        + 'mètres. Ce malus s’atténue avec l’ancienneté et reste plafonné : '
                        + 'l’objectif est d’infléchir un itinéraire vers une alternative '
                        + 'comparable, pas de condamner une rue sur un événement isolé. '
                        + 'Rennes Métropole n’étant pas desservie pour le moment, la carte y '
                        + 'sert surtout à repérer soi-même les carrefours à aborder avec '
                        + 'prudence.',
                ],
            },
        ],
        faq: [
            {
                q: 'D’où viennent ces données ?',
                a: 'Des bulletins d’analyse des accidents corporels renseignés par les forces de '
                    + 'l’ordre et publiés par l’ONISR, via le jeu dérivé « Accidents de vélo » diffusé '
                    + 'sur data.gouv.fr sous Licence Ouverte 2.0.',
            },
            {
                q: 'Les abords des campus sont-ils les endroits les plus dangereux de Rennes ?',
                a: 'Rien ne permet de l’affirmer. Ils cumulent des accidents parce qu’ils cumulent des '
                    + 'trajets à vélo. Sans comptage de la fréquentation, on ne peut pas convertir ces '
                    + 'points chauds en risque par kilomètre parcouru.',
            },
            {
                q: 'Ma chute sans tiers apparaîtra-t-elle sur la carte ?',
                a: 'Non, sauf intervention des forces de l’ordre pour un accident corporel. La très '
                    + 'grande majorité des chutes de cyclistes échappe à ce registre.',
            },
            {
                q: 'Ces accidents modifient-ils les itinéraires proposés à Rennes ?',
                a: 'Pas à Rennes pour l’instant, le calcul d’itinéraire n’y étant pas '
                    + 'disponible. Là où il fonctionne, ils dégradent à la marge le score de '
                    + 'sécurité des tronçons proches, avec un poids décroissant dans le temps '
                    + 'et plafonné, de sorte qu’un accident ancien ne pèse presque plus.',
            },
        ],
    },

    'nantes/stationnements-velo': {
        title: 'Stationnements vélo à Nantes — carte des arceaux et abris',
        description: 'Carte interactive des 5 000 stationnements vélo de Nantes Métropole : arceaux, '
            + 'râteliers, abris et consignes sécurisées, avec leur capacité.',
        h1: 'Stationnements vélo à Nantes',
        intro: 'Où attacher son vélo à Nantes ? Cette carte recense les arceaux, râteliers, abris et '
            + 'consignes des 24 communes de la métropole, des deux rives de la Loire aux vallées de '
            + 'l’Erdre et de la Sèvre, avec le type d’équipement et le nombre de places quand il est connu.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Chaque point est un emplacement de stationnement relevé par les contributeurs '
                    + 'OpenStreetMap. Avec plus de 5 000 emplacements recensés, Nantes Métropole est le '
                    + 'territoire le mieux équipé couvert par Sécu’Cycle — devant Bordeaux Métropole, '
                    + 'pourtant de taille comparable.',
                    'Les arceaux dominent : ce sont les seuls équipements qui permettent d’attacher le '
                    + 'cadre et une roue avec un antivol en U. Les râteliers et pince-roues ne maintiennent '
                    + 'que la roue avant et protègent mal du vol. Les abris et consignes fermées '
                    + 'apparaissent dans une catégorie distincte, concentrée autour de la gare, des '
                    + 'terminus de tramway et des parcs relais.',
                ],
            },
            {
                h2: 'Un maillage qui suit la Loire',
                p: [
                    'La répartition raconte la géographie nantaise : forte densité sur le centre, l’île de '
                    + 'Nantes et les quartiers universitaires, maillage plus lâche dès qu’on s’éloigne des '
                    + 'axes de transport. Les communes de la métropole — Saint-Herblain, Rezé, Orvault, '
                    + 'Vertou, Couëron, Carquefou — sont équipées autour de leurs centres-bourgs, gares et '
                    + 'équipements scolaires.',
                    'Les franchissements de la Loire concentrent les flux cyclistes et, avec eux, la '
                    + 'demande de stationnement de part et d’autre des ponts. C’est aussi là que les abris '
                    + 'fermés font la différence, en couvrant une journée entière sans surveillance.',
                ],
            },
            {
                h2: 'Une carte vivante, et donc parfois en retard',
                p: [
                    'Le relevé vient d’OpenStreetMap et se resynchronise automatiquement. Il vit donc '
                    + 'au rythme des contributions : un arceau posé le mois dernier peut manquer, un '
                    + 'équipement démonté peut survivre quelques semaines sur la carte. Une correction '
                    + 'apportée à OpenStreetMap remonte ici à la synchronisation suivante.',
                    'La capacité affichée souffre de la même limite : elle n’est renseignée que pour '
                    + 'une partie des emplacements. Son absence ne signifie pas un emplacement unique, '
                    + 'seulement une information non relevée — nuance qui compte quand on cherche de la '
                    + 'place pour un vélo cargo.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien y a-t-il de stationnements vélo à Nantes ?',
                a: 'Plus de 5 000 emplacements sont recensés sur les 24 communes de Nantes Métropole, en '
                    + 'très grande majorité des arceaux, auxquels s’ajoutent plusieurs centaines d’abris '
                    + 'et de consignes fermées.',
            },
            {
                q: 'Quelle est la différence entre un arceau et un râtelier ?',
                a: 'Un arceau est un tube en U inversé auquel on attache le cadre et une roue : c’est le '
                    + 'dispositif recommandé. Un râtelier, ou pince-roue, ne retient que la roue avant, ce '
                    + 'qui protège mal du vol et peut voiler la jante.',
            },
            {
                q: 'Où trouver un stationnement vélo sécurisé à Nantes ?',
                a: 'Les abris fermés et consignes individuelles se concentrent autour de la gare de '
                    + 'Nantes, des pôles d’échange et des parcs relais. Ils apparaissent sur la carte dans '
                    + 'la catégorie « Abris et consignes ».',
            },
            {
                q: 'Un stationnement manque sur la carte, comment le signaler ?',
                a: 'Les données viennent d’OpenStreetMap : vous pouvez ajouter l’emplacement directement '
                    + 'sur openstreetmap.org, il sera repris à la synchronisation suivante. Vous pouvez '
                    + 'aussi nous écrire via la page Contact.',
            },
            {
                q: 'Sécu’Cycle calcule-t-il un itinéraire jusqu’à ces stationnements ?',
                a: 'Pas pour le moment : le calcul de trajet s’appuie sur un réseau routier '
                    + 'chargé en mémoire par notre serveur, réduit à Bordeaux et à la région '
                    + 'de Tournai. Les données nantaises affichées ici restent, elles, '
                    + 'synchronisées automatiquement.',
            },
        ],
    },

    'nantes/toilettes-publiques': {
        title: 'Toilettes publiques à Nantes — carte interactive',
        description: 'Carte des toilettes publiques de Nantes et de sa métropole : sanitaires '
            + 'gratuits, payants et accessibles en fauteuil roulant, localisés et à jour.',
        h1: 'Toilettes publiques à Nantes',
        intro: 'Près de 350 emplacements de toilettes publiques sont recensés sur Nantes Métropole : '
            + 'c’est le relevé le plus dense de tout Sécu’Cycle. Cette carte les situe et indique, '
            + 'quand l’information existe, leur tarif, leurs horaires et leur accessibilité.',
        sections: [
            {
                h2: 'Trois couleurs, dont une qui ne dit rien',
                p: [
                    'Le repère est coloré selon le tarif : gratuit, payant, ou violet. Ce violet est le '
                    + 'plus important à comprendre — il ne veut pas dire « payant », il veut dire que '
                    + 'personne n’a renseigné le tarif dans les données ouvertes. Un sanitaire violet a '
                    + 'toutes les chances d’être gratuit comme les autres.',
                    'Le même principe vaut pour l’accessibilité en fauteuil roulant : elle est '
                    + 'signalée quand elle a été relevée, et ce champ est bien moins souvent rempli que '
                    + 'la position. Une absence de mention n’est jamais une mention d’absence.',
                ],
            },
            {
                h2: 'Les horaires suivent ceux des parcs',
                p: [
                    'Une bonne part des sanitaires nantais se trouve dans les espaces verts : Jardin '
                    + 'des plantes, parc de Procé, île de Versailles, bords d’Erdre. Leurs horaires '
                    + 'sont ceux du parc qui les abrite, et ces horaires se resserrent nettement '
                    + 'l’hiver — un bloc ouvert jusqu’en soirée en juillet peut fermer en fin '
                    + 'd’après-midi en décembre.',
                    'La fiche de chaque emplacement affiche l’horaire connu. En l’absence '
                    + 'd’indication, considérez qu’un sanitaire de parc ferme avec le parc.',
                ],
            },
            {
                h2: 'Sur un itinéraire, pas seulement sur une carte',
                p: [
                    'Cette carte dérive du calculateur d’itinéraires cyclables de Sécu’Cycle. '
                        + 'Sur la Loire à Vélo ou le long de l’Erdre, repérer le prochain '
                        + 'sanitaire avant de partir évite le détour improvisé. Le calcul '
                        + 'd’itinéraire, lui, ne dessert pas Nantes Métropole pour le moment '
                        + ': le réseau routier tient en mémoire pour Bordeaux et la région de '
                        + 'Tournai.',
                ],
            },
        ],
        faq: [
            {
                q: 'Que signifie un repère violet sur la carte ?',
                a: 'Que le tarif n’est pas renseigné dans les données ouvertes, et rien d’autre. Ce '
                    + 'n’est pas un équipement payant : c’est un équipement dont personne n’a encore '
                    + 'documenté le tarif.',
            },
            {
                q: 'Les toilettes publiques sont-elles gratuites à Nantes ?',
                a: 'Dans leur immense majorité, oui. Les sanitaires de voirie et ceux des parcs '
                    + 'municipaux sont gratuits ; les rares équipements payants se concentrent en gare '
                    + 'et dans quelques pôles commerciaux.',
            },
            {
                q: 'Peut-on se fier aux horaires affichés ?',
                a: 'À titre indicatif seulement. Ils viennent d’OpenStreetMap et ne couvrent qu’une '
                    + 'partie des emplacements ; ceux des parcs varient fortement entre la saison '
                    + 'hivernale et la saison estivale.',
            },
            {
                q: 'Ces toilettes s’affichent-elles pendant un calcul d’itinéraire ?',
                a: 'Pas à Nantes pour le moment : le calcul d’itinéraire ne couvre plus que '
                    + 'Bordeaux et la région de Tournai, faute d’un réseau routier chargé '
                    + 'au-delà. La couche existe sur ces emprises ; ici, la carte se consulte '
                    + 'pour elle-même.',
            },
        ],
    },

    'nantes/points-eau': {
        title: 'Points d’eau potable à Nantes — carte des fontaines',
        description: 'Carte des fontaines et points d’eau potable de Nantes Métropole, utile aux '
            + 'cyclistes, coureurs et promeneurs pour remplir sa gourde en été.',
        h1: 'Points d’eau potable à Nantes',
        intro: 'Plus de 300 points d’eau potable sont recensés sur Nantes Métropole. Cette carte les '
            + 'situe pour que remplir sa gourde ne devienne pas un détour — à vélo, en courant, ou '
            + 'simplement lors d’un épisode de chaleur.',
        sections: [
            {
                h2: 'Ce qui compte comme point d’eau',
                p: [
                    'La carte ne retient que l’eau déclarée potable : bornes-fontaines de voirie, '
                    + 'robinets de parcs, d’aires de jeux, de cimetières et d’équipements sportifs. Les '
                    + 'fontaines ornementales en sont exclues, quelle que soit leur allure.',
                    'Certains points sont accessibles mais sous condition — enceinte privée, réservé '
                    + 'aux usagers d’un équipement, ouverture sur autorisation. Ils portent une marque '
                    + 'distincte, pour éviter le détour qui se termine devant une grille fermée.',
                ],
            },
            {
                h2: 'La densité s’arrête aux limites de la métropole',
                p: [
                    'Nantes offre l’un des maillages les plus serrés de tout le service : bords '
                    + 'd’Erdre, île de Nantes, grands parcs et places arborées du centre en concentrent '
                    + 'l’essentiel. Dans l’agglomération, un point d’eau n’est jamais très loin.',
                    'Cette abondance s’évapore dès qu’on en sort. Sur un départ vers la Loire à Vélo, '
                    + 'repérez vos deux prochains ravitaillements avant de quitter la métropole : la '
                    + 'densité chute franchement passé les dernières communes, et l’habitude prise en '
                    + 'ville devient un mauvais réflexe.',
                ],
            },
            {
                h2: 'Le réseau se rétracte l’hiver',
                p: [
                    'Une part des fontaines est purgée à la mauvaise saison pour éviter le gel, et '
                    + 'd’autres sont saisonnières par construction. La carte le signale quand '
                    + 'l’information existe, mais tous les points ne sont pas documentés : entre '
                    + 'novembre et mars, prévoyez une réserve plutôt qu’un itinéraire de remplissage.',
                ],
            },
        ],
        faq: [
            {
                q: 'Où remplir sa gourde à Nantes ?',
                a: 'Plus de 300 points d’eau potable sont cartographiés sur la métropole, en très '
                    + 'grande majorité en accès libre. Les bords d’Erdre, l’île de Nantes et les grands '
                    + 'parcs en réunissent la plus forte concentration.',
            },
            {
                q: 'L’eau de ces fontaines est-elle vraiment potable ?',
                a: 'Seuls les points explicitement déclarés potables dans les données ouvertes sont '
                    + 'affichés ; les fontaines décoratives sont écartées. En cas de doute sur place, '
                    + 'la signalétique du point fait foi.',
            },
            {
                q: 'Les fontaines nantaises coulent-elles en hiver ?',
                a: 'Pas toutes. Une partie du réseau est coupée pour prévenir le gel et certains points '
                    + 'ne fonctionnent que l’été. La fiche du point l’indique lorsque l’information a '
                    + 'été renseignée.',
            },
            {
                q: 'Peut-on compter sur ces points d’eau au-delà de la métropole ?',
                a: 'Non. Le recensement s’arrête aux 24 communes de Nantes Métropole, et la densité '
                    + 'réelle des points d’eau diminue de toute façon nettement en dehors de '
                    + 'l’agglomération.',
            },
            {
                q: 'Puis-je faire passer mon itinéraire par ces points d’eau ?',
                a: 'Pas à Nantes pour le moment. Le calcul d’itinéraire ne dessert plus que '
                    + 'Bordeaux et la région de Tournai ; cette carte reste le bon outil pour '
                    + 'préparer une sortie estivale le long de l’Erdre ou de la Loire.',
            },
        ],
    },

    'nantes/reparation-velo': {
        title: 'Réparer son vélo à Nantes — stations et ateliers',
        description: 'Carte des stations de réparation en libre-service et des ateliers vélo de '
            + 'Nantes Métropole : gonflage, outils, réparation et entretien.',
        h1: 'Réparation de vélo à Nantes',
        intro: 'Crevaison au retour de la Loire à Vélo, freins qui frottent en pleine heure de '
            + 'pointe : cette carte situe les endroits où réparer son vélo, ou le faire réparer, sur '
            + 'les 24 communes de Nantes Métropole.',
        sections: [
            {
                h2: 'Trois recours, trois usages',
                p: [
                    'Le totem de rue dépanne. Pompe fixée au sol, clés et tournevis retenus par un '
                    + 'câble, gratuit et accessible à toute heure : il règle une pression de pneu, une '
                    + 'selle qui glisse, une chaîne déraillée. Rarement davantage, et son outillage '
                    + 'souffre des arrachages.',
                    'Le vélociste prend le vélo en charge et facture au temps passé. L’atelier '
                    + 'd’auto-réparation, lui, prête l’établi, l’outillage et le conseil contre une '
                    + 'adhésion : la voie lente et bon marché, celle qui apprend à se passer des deux '
                    + 'autres. Un peu plus de 80 adresses relèvent de ces trois catégories sur la '
                    + 'métropole.',
                ],
            },
            {
                h2: 'Ce qui tient jusqu’au prochain arrêt',
                p: [
                    'Une chambre à air de rechange, deux démonte-pneus et une pompe de poche traitent '
                    + 'la panne la plus fréquente et tiennent sous une selle. Un multi-outil règle le '
                    + 'reste du quotidien : patin qui frotte, chaîne sèche, dérailleur qui hésite.',
                    'Une roue voilée, un jeu de direction qui claque, un frein hydraulique à purger '
                    + 'réclament en revanche un outillage dédié et de la méthode. Insister avec les '
                    + 'moyens du bord coûte souvent plus cher que l’heure d’atelier économisée.',
                ],
            },
        ],
        faq: [
            {
                q: 'Les totems de réparation nantais sont-ils payants ?',
                a: 'Non. Installés sur l’espace public, ils s’utilisent sans formalité, de jour comme '
                    + 'de nuit. Rien ne garantit en revanche que l’outillage soit complet : câbles et '
                    + 'embouts sont régulièrement arrachés.',
            },
            {
                q: 'Comment regonfler un pneu à Nantes sans pompe ?',
                a: 'En rejoignant le totem le plus proche : presque tous embarquent une pompe à pied. '
                    + 'Ils ressortent en orange clair sur la carte.',
            },
            {
                q: 'Atelier associatif ou vélociste ?',
                a: 'L’atelier associatif si vous avez du temps et l’envie d’apprendre : vous réparez '
                    + 'vous-même, l’adhésion ouvre l’accès à l’outillage. Le vélociste si le vélo doit '
                    + 'repartir vite, ou si la panne dépasse ce qu’on traite sur un établi partagé.',
            },
            {
                q: 'Pourquoi certains magasins de cycles n’apparaissent-ils pas ?',
                a: 'Le recensement ne retient un magasin que s’il déclare explicitement un service de '
                    + 'réparation dans OpenStreetMap. Un vélociste qui répare sans l’avoir signalé reste '
                    + 'invisible ici — l’information peut y être ajoutée par n’importe qui.',
            },
            {
                q: 'Puis-je me faire guider jusqu’à l’atelier le plus proche ?',
                a: 'Pas depuis Sécu’Cycle à Nantes pour le moment : le calcul d’itinéraire ne '
                    + 'couvre plus que Bordeaux et la région de Tournai. La carte donne en '
                    + 'revanche l’adresse de chaque atelier et station de gonflage.',
            },
        ],
    },

    'nantes/eclairage-public': {
        title: 'Éclairage public à Nantes — carte des points lumineux',
        description: 'Carte de l’éclairage public de Nantes Métropole : près de 100 000 luminaires '
            + 'recensés et rues éclairées, pour choisir ses trajets de nuit à vélo.',
        h1: 'Éclairage public à Nantes',
        sources: [SOURCE_OSM, SOURCE_LUM_NANTES],
        intro: 'Quelles rues sont éclairées la nuit à Nantes ? Cette carte s’appuie sur l’inventaire '
            + 'complet des luminaires ouvert par Nantes Métropole — près de 100 000 points — pour '
            + 'visualiser d’un coup d’œil les axes praticables une fois la nuit tombée.',
        sections: [
            {
                h2: 'L’inventaire le plus complet du service',
                p: [
                    'Nantes Métropole publie en données ouvertes la totalité de son parc de luminaires '
                    + 'd’éclairage public : 97 473 points au dernier relevé, soit deux fois et demie ce '
                    + 'dont nous disposons à Bordeaux. C’est ce qui rend cette carte d’une précision rare — '
                    + 'à ce niveau de détail, on lit le maillage rue par rue, et pas seulement les grands '
                    + 'axes.',
                    'Ces luminaires officiels sont complétés par les points relevés dans OpenStreetMap. '
                    + 'Les doublons entre les deux sources sont écartés automatiquement lorsque deux '
                    + 'points sont distants de moins de huit mètres.',
                ],
            },
            {
                h2: 'Où la lumière s’arrête',
                p: [
                    'À cette résolution, ce sont les ruptures qui deviennent lisibles. La Loire, '
                    + 'l’Erdre et les coulées vertes tracent des discontinuités nettes dans la nappe '
                    + 'lumineuse : les berges, les zones naturelles et les franges d’activité '
                    + 'décrochent brutalement par rapport aux quartiers qui les bordent.',
                    'Ce sont précisément les portions qu’un itinéraire agréable de jour emprunte '
                    + 'volontiers, et qui changent de nature à la nuit tombée. Comparer son trajet '
                    + 'habituel à cette carte suffit souvent à identifier les deux ou trois kilomètres '
                    + 'qui méritent un autre tracé en hiver.',
                ],
            },
            {
                h2: 'Ce que la carte ne dit pas',
                p: [
                    'Elle montre où les luminaires sont implantés, jamais quand ils fonctionnent. '
                    + 'Plusieurs communes de la métropole pratiquent l’extinction au cœur de la nuit, '
                    + 'par économie et pour limiter la pollution lumineuse : une rue franchement '
                    + 'dessinée ici peut être noire à trois heures du matin.',
                    'Elle ne dispense pas non plus de s’équiper. Feu blanc à l’avant, feu rouge à '
                    + 'l’arrière et catadioptres restent obligatoires, et le gilet rétroréfléchissant '
                    + 's’impose hors agglomération la nuit. Une rue éclairée améliore ce que vous '
                    + 'voyez ; elle ne garantit pas que l’on vous voie.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien de lampadaires compte Nantes Métropole ?',
                a: 'L’inventaire ouvert par Nantes Métropole recense 97 473 luminaires d’éclairage public. '
                    + 'S’y ajoutent les points relevés dans OpenStreetMap, dédoublonnés automatiquement.',
            },
            {
                q: 'Que signifie une rue en jaune pâle ?',
                a: 'Que son éclairage est déduit plutôt que relevé : des points lumineux se trouvent à '
                    + 'proximité immédiate, mais la rue elle-même n’est pas explicitement décrite comme '
                    + 'éclairée dans les données. C’est une estimation.',
            },
            {
                q: 'L’éclairage influence-t-il les itinéraires proposés à Nantes ?',
                a: 'Pas pour le moment : le calcul d’itinéraire ne dessert plus que Bordeaux '
                    + 'et la région de Tournai. Là où il fonctionne, l’éclairage entre dans '
                    + 'le score de sécurité des tronçons et pèse sur le tracé proposé la '
                    + 'nuit. La densité de l’inventaire nantais rendrait cet arbitrage '
                    + 'nettement plus fin ici qu’ailleurs.',
            },
            {
                q: 'Les luminaires restent-ils allumés toute la nuit à Nantes ?',
                a: 'Pas partout. L’extinction en milieu de nuit est pratiquée par plusieurs communes de '
                    + 'la métropole. L’inventaire décrit l’implantation du parc, jamais ses horaires de '
                    + 'fonctionnement.',
            },
        ],
    },

    'nantes/velos-libre-service': {
        title: 'Vélos libre-service à Nantes — stations Naolib en temps réel',
        description: 'Carte en temps réel des stations de vélos en libre-service de Nantes Métropole '
            + '(Naolib, exploité par JCDecaux) : vélos disponibles et places libres.',
        h1: 'Vélos en libre-service à Nantes',
        sources: [SOURCE_GBFS_NANTES],
        intro: 'Combien de vélos reste-t-il à la station la plus proche ? Cette carte affiche en temps '
            + 'réel les stations du service de vélos en libre-service de Nantes Métropole, exploité par '
            + 'JCDecaux sous la marque Naolib, avec le nombre de vélos disponibles et de places libres.',
        sections: [
            {
                h2: 'Un parc entièrement musculaire',
                p: [
                    'Le flux officiel ne déclare aucun vélo à assistance électrique : à Nantes, le '
                    + 'libre-service se pédale. La conséquence se sent dans les jambes plus que sur la '
                    + 'carte — franchir la Loire, remonter vers Sainte-Anne ou Chantenay demande un '
                    + 'effort que l’assistance masquerait ailleurs.',
                    'Chaque station affiche donc deux nombres qui suffisent : les vélos prêts à partir '
                    + 'et les points d’attache encore libres. La pastille les résume — disponible, '
                    + 'presque vide, vide, ou pleine, ce dernier cas signifiant que vous ne pourrez pas '
                    + 'y rendre votre vélo.',
                ],
            },
            {
                h2: 'Vérifier l’arrivée, pas seulement le départ',
                p: [
                    'L’erreur classique consiste à ne regarder que la station de départ. Une station '
                    + 'd’hypercentre pleine en fin de journée est un cas ordinaire, et oblige à '
                    + 'poursuivre jusqu’à la suivante — trajet rallongé, minutes facturées en plus.',
                    'Les quelque 120 stations se concentrent sur Nantes et ses communes limitrophes, en '
                    + 'appui des lignes de tramway. Le service brille sur le trajet à sens unique — '
                    + 'aller en tram, revenir à vélo — et s’efface dès qu’on s’éloigne du cœur '
                    + 'métropolitain, où le vélo personnel reprend l’avantage.',
                ],
            },
        ],
        faq: [
            {
                q: 'Y a-t-il des vélos électriques en libre-service à Nantes ?',
                a: 'Non. Le flux officiel ne déclare que des vélos mécaniques ; la carte n’affiche donc '
                    + 'aucune ventilation entre mécanique et électrique, faute d’objet.',
            },
            {
                q: 'Combien de stations Naolib sont cartographiées ?',
                a: 'Environ 120, réparties sur Nantes et les communes limitrophes. La totalité de '
                    + 'celles publiées dans le flux officiel figure sur cette carte.',
            },
            {
                q: 'À quelle fréquence les disponibilités sont-elles mises à jour ?',
                a: 'En continu, depuis le flux GBFS de l’exploitant. La date du dernier relevé est '
                    + 'affichée, et un avertissement apparaît si celui-ci commence à dater.',
            },
            {
                q: 'Peut-on calculer un trajet depuis une station bicloo ?',
                a: 'Pas pour le moment : les disponibilités sont bien affichées en direct, '
                    + 'mais le calcul d’itinéraire ne couvre plus que Bordeaux et la région '
                    + 'de Tournai. Il dépend d’un réseau routier chargé en mémoire, que '
                    + 'Nantes Métropole excède.',
            },
        ],
    },

    'nantes/trafic-routier': {
        title: 'Trafic à Nantes en temps réel — carte de la circulation',
        description: 'Carte du trafic routier en temps réel à Nantes Métropole : périphérique, ponts '
            + 'de Loire et axes urbains, fluides, denses ou embouteillés.',
        h1: 'Trafic routier à Nantes en temps réel',
        sources: [SOURCE_TRAFIC_NANTES],
        intro: 'La circulation nantaise se joue sur un nombre réduit de points de passage. Cette '
            + 'carte affiche leur état, rafraîchi en continu à partir des données ouvertes de Nantes '
            + 'Métropole, et ce qu’il faut en déduire quand on roule à vélo.',
        sections: [
            {
                h2: 'Une métropole tenue par ses franchissements',
                p: [
                    'Le vert signale un axe fluide, l’orange une circulation dense, le rouge un '
                    + 'embouteillage, le gris une mesure inexploitable. Environ 860 tronçons '
                    + 'structurants sont instrumentés — le périphérique, ses portes, et les grandes '
                    + 'pénétrantes.',
                    'La Loire commande le reste. Les franchissements sont peu nombreux au regard des '
                    + 'flux qu’ils absorbent : quand ils rougissent, ce n’est pas une congestion parmi '
                    + 'd’autres, c’est toute la relation entre les deux rives qui se contracte. '
                    + 'L’Erdre produit le même effet, en plus local.',
                ],
            },
            {
                h2: 'Le problème du cycliste : on ne contourne pas un pont',
                p: [
                    'Sur un axe urbain saturé, un cycliste dispose presque toujours d’un report — une '
                    + 'rue parallèle, un itinéraire apaisé. Sur un franchissement, non : l’ouvrage est '
                    + 'le seul chemin, et le détour se compte en kilomètres. C’est la différence '
                    + 'pratique entre un bouchon nantais et un bouchon ailleurs.',
                    'D’où l’intérêt de regarder la carte avant de partir plutôt qu’une fois engagé. '
                    + 'Décaler son départ de vingt minutes, ou viser un autre franchissement, coûte '
                    + 'moins cher que de traverser au milieu d’une file arrêtée — configuration où se '
                    + 'concentrent les remontées de file et les ouvertures de portière.',
                ],
            },
            {
                h2: 'Ce que le calculateur en fait',
                p: [
                    'Là où Sécu’Cycle calcule des trajets, cette couche alimente directement '
                        + 'le score de sécurité : à trajet comparable, il écarte les axes '
                        + 'rouges quand une alternative crédible existe. Nantes Métropole '
                        + 'n’étant pas desservie pour le moment, l’arbitrage se fait ici à '
                        + 'l’œil — avec la même nuance : un axe dense mais lent est souvent '
                        + 'préférable à un axe fluide où les voitures roulent vite, la '
                        + 'fluidité n’est pas la sécurité.',
                ],
            },
        ],
        faq: [
            {
                q: 'D’où viennent les données de trafic nantais ?',
                a: 'Du jeu « Fluidité des axes routiers » publié par Nantes Métropole sur son portail '
                    + 'open data, sous licence ODbL, et rafraîchi en continu.',
            },
            {
                q: 'Pourquoi ma rue n’apparaît-elle pas sur la carte ?',
                a: 'Parce que seuls les axes structurants sont instrumentés, soit environ 860 tronçons. '
                    + 'La voirie résidentielle n’est pas mesurée — ce qui, pour un cycliste, est '
                    + 'rarement gênant : ce sont justement les rues où la circulation est calme.',
            },
            {
                q: 'Un pont rouge est-il évitable à vélo ?',
                a: 'Rarement sans allonger sensiblement le trajet. C’est pourquoi la consultation avant '
                    + 'le départ vaut mieux que l’adaptation en route : les alternatives de '
                    + 'franchissement sont peu nombreuses.',
            },
            {
                q: 'Le trafic modifie-t-il l’itinéraire proposé à Nantes ?',
                a: 'Pas pour l’instant, le calcul d’itinéraire ne couvrant plus que Bordeaux '
                    + 'et la région de Tournai. Là où il fonctionne, la congestion dégrade le '
                    + 'score de sécurité des tronçons concernés et le calcul privilégie les '
                    + 'parcours qui les évitent lorsque le détour reste raisonnable.',
            },
        ],
    },

    'nantes/accidents-velo': {
        title: 'Accidents à vélo à Nantes — carte de l’accidentologie',
        description: 'Carte des accidents corporels impliquant un cycliste à Nantes Métropole, de '
            + '2015 à 2023, issue des données BAAC publiées par l’ONISR.',
        h1: 'Accidents à vélo à Nantes',
        sources: [SOURCE_BAAC],
        intro: 'Cette carte situe les accidents corporels impliquant un cycliste survenus sur Nantes '
            + 'Métropole entre 2015 et 2023. Elle est instructive à condition de savoir ce qu’elle ne '
            + 'montre pas — et à Nantes, ce hors-champ est particulièrement large.',
        sections: [
            {
                h2: 'L’angle mort nantais : les rails',
                p: [
                    'Le registre BAAC n’enregistre qu’un accident ayant donné lieu à une intervention '
                    + 'des forces de l’ordre. La chute isolée, sans véhicule tiers, en sort. Or à '
                    + 'Nantes, la roue prise dans une saignée de rail de tramway est un grand '
                    + 'pourvoyeur de chutes de cyclistes — et presque aucune n’apparaît sur cette '
                    + 'carte.',
                    'Le long des lignes, la carte est donc systématiquement optimiste. Traversez les '
                    + 'rails perpendiculairement, quitte à élargir la trajectoire, particulièrement '
                    + 'sur chaussée mouillée : c’est le geste que les données ne vous rappelleront '
                    + 'jamais.',
                ],
            },
            {
                h2: 'Des points chauds qui sont d’abord des passages obligés',
                p: [
                    'À faible zoom, la carte agrège les accidents en densité ; en zoomant, chaque '
                    + 'point se sépare et se colore selon la gravité — blessé léger, blessé '
                    + 'hospitalisé, accident mortel.',
                    'Les concentrations les plus vives se lisent là où la géographie force le '
                    + 'passage. Les ponts de Loire et les franchissements de l’Erdre canalisent '
                    + 'l’intégralité des flux entre rives : ils cumulent des accidents parce qu’ils '
                    + 'cumulent des cyclistes. Sans mesure de fréquentation, un point chaud ne se '
                    + 'traduit pas en risque par kilomètre parcouru.',
                ],
            },
            {
                h2: 'Du point rouge au calcul d’itinéraire',
                p: [
                    'Là où Sécu’Cycle calcule des trajets, chaque accident est rattaché aux '
                        + 'tronçons du graphe routier situés dans un rayon de 25 mètres, où '
                        + 'il applique un malus au score de sécurité. Le malus s’efface '
                        + 'progressivement avec l’ancienneté et reste plafonné : un accident '
                        + 'ne suffit jamais, à lui seul, à faire basculer le tracé proposé. '
                        + 'Nantes Métropole n’étant pas desservie pour le moment, cette carte '
                        + 's’y lit pour elle-même.',
                ],
            },
        ],
        faq: [
            {
                q: 'Pourquoi si peu d’accidents le long des lignes de tramway ?',
                a: 'Parce que la chute sur un rail se produit le plus souvent sans véhicule tiers, et '
                    + 'ne donne donc lieu à aucun bulletin d’accident corporel. Ce type de chute est '
                    + 'largement absent du registre, à Nantes comme ailleurs.',
            },
            {
                q: 'Combien d’accidents à vélo la carte recense-t-elle vraiment ?',
                a: 'Seulement ceux qui ont fait l’objet d’une intervention des forces de l’ordre. Les '
                    + 'chutes seules, les accrochages réglés à l’amiable et les incidents sans blessure '
                    + 'en sont absents : le nombre réel est très supérieur.',
            },
            {
                q: 'Une zone rouge signifie-t-elle que l’endroit est dangereux ?',
                a: 'Pas nécessairement. Elle signale une concentration d’accidents, qui dépend aussi du '
                    + 'nombre de cyclistes qui y passent. Un pont très fréquenté ressort fortement sans '
                    + 'être forcément plus risqué au kilomètre.',
            },
            {
                q: 'Jusqu’à quelle année vont les données ?',
                a: 'Jusqu’à 2023. La publication des bulletins d’analyse des accidents corporels par '
                    + 'l’ONISR intervient avec plusieurs années de décalage ; les derniers millésimes ne '
                    + 'sont donc jamais disponibles.',
            },
            {
                q: 'Ces accidents modifient-ils les itinéraires proposés à Nantes ?',
                a: 'Pas pour le moment, le calcul d’itinéraire ne couvrant plus que Bordeaux '
                    + 'et la région de Tournai. Là où il fonctionne, ils dégradent le score '
                    + 'de sécurité des tronçons proches, avec un poids décroissant dans le '
                    + 'temps et plafonné.',
            },
        ],
    },

    'tournai/stationnements-velo': {
        title: 'Stationnements vélo à Tournai — carte des arceaux et abris',
        description: 'Carte des stationnements vélo de Tournai, Mouscron et du Tournaisis : '
            + 'arceaux, râteliers et abris recensés dans les données ouvertes.',
        h1: 'Stationnements vélo à Tournai',
        intro: 'Où attacher son vélo à Tournai, Mouscron ou Antoing ? Cette carte recense les points '
            + 'de stationnement vélo du Tournaisis, avec le type d’équipement et sa capacité lorsqu’elle '
            + 'est connue.',
        sections: [
            {
                h2: 'Un maillage encore en construction',
                p: [
                    'Le Tournaisis compte environ 130 emplacements recensés, une densité bien inférieure '
                    + 'à celle d’une grande agglomération. Ils se concentrent logiquement autour de la '
                    + 'gare de Tournai, du centre historique et des pôles scolaires et commerciaux de '
                    + 'Mouscron.',
                    'Comme partout, l’arceau reste l’équipement de référence : il permet d’attacher le '
                    + 'cadre et une roue. Les râteliers, qui ne retiennent que la roue avant, protègent '
                    + 'mal du vol.',
                ],
            },
            {
                h2: 'Un territoire transfrontalier',
                p: [
                    'Le Tournaisis est directement connecté à la métropole lilloise, et de nombreux '
                    + 'trajets quotidiens franchissent la frontière. Le RAVeL, réseau autonome de voies '
                    + 'lentes wallon, offre plusieurs axes en site propre qui traversent la région et que '
                    + 'Sécu’Cycle privilégie dans ses itinéraires.',
                ],
            },
            {
                h2: 'Données et limites',
                p: [
                    'Le recensement provient d’OpenStreetMap. La couverture y est plus inégale qu’en '
                    + 'France : un stationnement existant peut tout simplement ne pas avoir encore été '
                    + 'cartographié. Toute contribution sur OpenStreetMap sera reprise ici après la '
                    + 'synchronisation suivante.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien de stationnements vélo sont recensés à Tournai ?',
                a: 'Environ 130 emplacements sont cartographiés sur Tournai, Mouscron, Antoing, '
                    + 'Estaimpuis, Leuze-en-Hainaut et Mont-de-l’Enclus.',
            },
            {
                q: 'Y a-t-il des abris vélo sécurisés à la gare de Tournai ?',
                a: 'Des emplacements abrités sont recensés autour de la gare. Leur nature exacte — abri '
                    + 'simple ou consigne fermée — dépend de ce qui a été relevé dans les données '
                    + 'ouvertes ; consultez la fiche du point sur la carte.',
            },
            {
                q: 'Pourquoi y a-t-il moins de points qu’à Bordeaux ?',
                a: 'À la fois parce que le territoire est bien moins peuplé et parce que la couverture '
                    + 'd’OpenStreetMap y est moins complète. L’absence d’un point sur la carte ne '
                    + 'signifie pas nécessairement l’absence d’équipement sur le terrain.',
            },
        ],
    },

    'tournai/accidents-velo': {
        title: 'Accidents à vélo à Tournai — carte de l’accidentologie',
        description: 'Carte des accidents impliquant un cycliste à Tournai, Mouscron et dans le '
            + 'Tournaisis, à partir des données ouvertes de Statbel.',
        h1: 'Accidents à vélo à Tournai',
        sources: [SOURCE_STATBEL],
        intro: 'Cette carte recense les accidents de la circulation impliquant un cycliste dans le '
            + 'Tournaisis et le Mouscronnois, à partir des données de géolocalisation des accidents '
            + 'publiées par Statbel, l’office belge de statistique.',
        sections: [
            {
                h2: 'Une précision au mois, pas au jour',
                p: [
                    'Contrairement aux données françaises, le jeu de données belge ne publie pas la date '
                    + 'exacte de l’accident mais seulement le mois. Les fiches indiquent donc un mois et '
                    + 'une année. Cette anonymisation volontaire limite le risque de ré-identification des '
                    + 'personnes impliquées.',
                    'La gravité est en revanche renseignée : blessé léger, blessé hospitalisé ou décès. '
                    + 'Sur le Tournaisis, la très grande majorité des accidents cartographiés ont causé '
                    + 'des blessures légères.',
                ],
            },
            {
                h2: 'Lire la carte avec prudence',
                p: [
                    'Comme pour toute carte d’accidentologie, une concentration de points reflète autant '
                    + 'la fréquentation cycliste que la dangerosité d’un lieu. Les axes de traversée de '
                    + 'Tournai et les abords de Mouscron ressortent d’abord parce que beaucoup de '
                    + 'cyclistes y circulent.',
                    'Seuls les accidents ayant donné lieu à un constat officiel figurent dans les '
                    + 'données. Les chutes sans tiers et les accrochages sans blessure en sont absents.',
                ],
            },
            {
                h2: 'Effet sur les itinéraires',
                p: [
                    'Ces accidents sont rattachés aux tronçons proches et appliquent un malus, plafonné '
                    + 'et décroissant avec le temps, au score de sécurité utilisé par le calculateur '
                    + 'd’itinéraires.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien d’accidents à vélo sont recensés dans le Tournaisis ?',
                a: 'Environ 150 accidents impliquant un cycliste sont cartographiés sur l’emprise '
                    + 'couverte, dont une dizaine ayant entraîné une hospitalisation.',
            },
            {
                q: 'Pourquoi les dates ne sont-elles pas précises ?',
                a: 'Le jeu de données ouvert de Statbel ne publie que le mois et l’année de l’accident, '
                    + 'afin de limiter le risque de ré-identification. Les fiches affichent donc « mars '
                    + '2023 » plutôt qu’une date exacte.',
            },
            {
                q: 'Quelle période est couverte ?',
                a: 'Les données belges exploitées portent sur les années les plus récentes publiées par '
                    + 'Statbel. La période effectivement présente est indiquée dans les chiffres en haut '
                    + 'de cette page.',
            },
        ],
    },

    'tournai/toilettes-et-points-eau': {
        title: 'Toilettes publiques et points d’eau à Tournai',
        description: 'Carte des toilettes publiques et des points d’eau potable de Tournai, '
            + 'Mouscron et du Tournaisis, utile à vélo comme à pied.',
        h1: 'Toilettes publiques et points d’eau à Tournai',
        intro: 'Où trouver des toilettes publiques ou de quoi remplir sa gourde dans le Tournaisis ? '
            + 'Le recensement étant encore modeste dans la région, cette carte regroupe les deux '
            + 'informations sur un même fond, pour repérer d’un coup d’œil les haltes utiles.',
        sections: [
            {
                h2: 'Deux types de haltes sur une même carte',
                p: [
                    'Les repères violets correspondent aux toilettes publiques, les repères bleus aux '
                    + 'points d’eau potable. Sur un territoire où chaque catégorie compte moins de vingt '
                    + 'emplacements, les réunir donne une carte réellement utilisable plutôt que deux '
                    + 'cartes trop clairsemées.',
                    'Les emplacements se concentrent dans le centre de Tournai, autour de la Grand-Place '
                    + 'et des quais de l’Escaut, ainsi que dans les parcs publics de Mouscron.',
                ],
            },
            {
                h2: 'Un recensement encore partiel',
                p: [
                    'La couverture d’OpenStreetMap dans le Tournaisis est moins complète qu’en zone '
                    + 'urbaine dense française. L’absence d’un point ne signifie pas l’absence '
                    + 'd’équipement : elle signifie souvent que personne ne l’a encore cartographié. '
                    + 'Prévoyez de l’eau d’avance sur les portions de RAVeL en dehors des villes.',
                ],
            },
        ],
        faq: [
            {
                q: 'Pourquoi les toilettes et les points d’eau sont-ils sur la même carte ?',
                a: 'Parce que chaque catégorie compte moins de vingt emplacements recensés dans le '
                    + 'Tournaisis. Les réunir produit une carte utile ; les séparer donnerait deux pages '
                    + 'trop pauvres pour rendre service.',
            },
            {
                q: 'L’eau des fontaines est-elle potable ?',
                a: 'Seuls les points déclarés potables dans les données ouvertes sont affichés. En cas de '
                    + 'doute, fiez-vous à la signalétique sur place.',
            },
            {
                q: 'Comment ajouter un emplacement manquant ?',
                a: 'Les données proviennent d’OpenStreetMap : ajoutez le point sur openstreetmap.org, il '
                    + 'sera repris lors de la synchronisation suivante.',
            },
        ],
    },
    'paris/stationnements-velo': {
        title: 'Stationnements vélo à Paris — carte des arceaux et abris',
        description: 'Carte interactive des stationnements vélo de la Métropole du Grand Paris : '
            + 'arceaux, abris, consignes Véligo et places déclarées, en données ouvertes.',
        h1: 'Stationnements vélo à Paris',
        intro: 'Où attacher son vélo à Paris ? Cette carte recense les arceaux, râteliers, abris et '
            + 'consignes de la capitale et des 130 communes de la Métropole du Grand Paris, avec le '
            + 'type d’équipement et, quand il est connu, le nombre de places.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Chaque point correspond à un emplacement relevé sur le terrain par les '
                    + 'contributeurs OpenStreetMap. Paris a massivement remplacé des places de '
                    + 'stationnement automobile par des arceaux depuis 2020, souvent en tête de rue '
                    + 'pour dégager la visibilité aux intersections : c’est la forme la plus '
                    + 'répandue sur la carte, et la seule qui permette d’attacher le cadre et une '
                    + 'roue avec un antivol en U.',
                    'Les abris et consignes fermées apparaissent à part. En Île-de-France, ce sont '
                    + 'surtout les consignes Véligo installées aux abords des gares et des stations '
                    + 'de métro : accès sur abonnement, place réservée, à privilégier pour laisser '
                    + 'un vélo la journée ou la nuit.',
                ],
            },
            {
                h2: 'Stationner à Paris sans se faire voler',
                p: [
                    'Paris concentre l’essentiel des vols de vélos déclarés en Île-de-France. La '
                    + 'règle vaut plus qu’ailleurs : attachez le cadre à un point fixe, jamais la '
                    + 'roue seule, avec un antivol en U certifié — les câbles et chaînes fines se '
                    + 'coupent en quelques secondes. Un second antivol pour la roue avant dissuade '
                    + 'le démontage.',
                    'Préférez les emplacements passants et éclairés aux impasses et aux parkings '
                    + 'souterrains peu fréquentés. Pour un stationnement de plus de quelques heures, '
                    + 'une consigne fermée reste la seule protection réellement efficace. Le '
                    + 'marquage Bicycode, obligatoire à la vente depuis 2021, augmente nettement les '
                    + 'chances de restitution en cas de vol.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Le recensement provient d’OpenStreetMap et est resynchronisé automatiquement. '
                    + 'Il est donc vivant mais imparfait : un arceau posé récemment peut manquer, un '
                    + 'équipement retiré peut subsister quelques semaines. Sur un territoire aussi '
                    + 'contribué que le Grand Paris, la couverture est cependant l’une des meilleures '
                    + 'de France. Toute correction apportée sur OpenStreetMap se retrouve ici après '
                    + 'la synchronisation suivante.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien y a-t-il de stationnements vélo à Paris ?',
                a: 'Le compteur affiché en tête de carte donne le total recensé au moment où vous la '
                    + 'consultez, ainsi que le nombre de places déclarées. La Ville de Paris a '
                    + 'engagé la création de dizaines de milliers de places depuis 2020, dont une '
                    + 'grande partie en remplacement de places de stationnement automobile.',
            },
            {
                q: 'Où trouver une consigne à vélo sécurisée en Île-de-France ?',
                a: 'Les abris fermés et consignes, principalement des Véligo installés près des gares '
                    + 'et des pôles d’échange, apparaissent sur la carte dans la catégorie « Abris et '
                    + 'consignes ». L’accès se fait sur abonnement auprès d’Île-de-France Mobilités.',
            },
            {
                q: 'Peut-on attacher son vélo à un poteau ou à une barrière ?',
                a: 'Rien ne l’interdit tant que le vélo ne gêne pas le passage, mais un poteau lisse '
                    + 'se démonte et une barrière se scie : ces points d’attache offrent une sécurité '
                    + 'très faible. Les arceaux recensés ici sont scellés et conçus pour résister.',
            },
            {
                q: 'Un stationnement manque sur la carte, comment le signaler ?',
                a: 'Les données proviennent d’OpenStreetMap : vous pouvez ajouter l’emplacement '
                    + 'directement sur openstreetmap.org, il sera repris lors de la synchronisation '
                    + 'suivante. Vous pouvez aussi nous écrire via la page Contact.',
            },
            {
                q: 'Sécu’Cycle calcule-t-il un itinéraire jusqu’à ces stationnements ?',
                a: 'Pas encore dans le Grand Paris. Le calcul de trajet s’appuie sur un '
                    + 'réseau routier chargé en mémoire par notre serveur, dont l’emprise '
                    + 'reste plus étroite que celle des données : la carte francilienne est '
                    + 'complète, mais l’itinéraire n’y est pas proposé. Les agglomérations '
                    + 'navigables sont listées sur la page Cartes.',
            },
        ],
    },

    'paris/toilettes-publiques': {
        title: 'Toilettes publiques à Paris — carte interactive',
        description: 'Carte des toilettes publiques de Paris et du Grand Paris : sanisettes '
            + 'gratuites, toilettes payantes et sanitaires accessibles en fauteuil roulant.',
        h1: 'Toilettes publiques à Paris',
        intro: 'Cette carte localise les toilettes publiques recensées à Paris et dans les communes '
            + 'de la métropole, en distinguant les sanitaires gratuits des sanitaires payants et en '
            + 'signalant ceux qui sont accessibles en fauteuil roulant.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Paris est l’une des rares villes où les toilettes publiques de voirie sont '
                    + 'gratuites : les sanisettes automatiques, réparties dans tous les '
                    + 'arrondissements, le sont depuis 2006. La carte les affiche aux côtés des '
                    + 'sanitaires de parcs et jardins, des toilettes de gares et de celles des '
                    + 'communes voisines, dont la politique tarifaire peut différer.',
                    'Les horaires ne sont pas toujours renseignés dans les données : beaucoup de '
                    + 'sanitaires de squares et de parcs ferment avec eux, souvent à la tombée de la '
                    + 'nuit. Les sanisettes de voirie, elles, fonctionnent en continu, sauf '
                    + 'maintenance.',
                ],
            },
            {
                h2: 'Accessibilité',
                p: [
                    'Les toilettes signalées comme accessibles disposent d’un espace de rotation et '
                    + 'de barres d’appui. Les sanisettes parisiennes sont conçues pour l’accès en '
                    + 'fauteuil, ce qui n’est pas le cas de tous les sanitaires plus anciens de la '
                    + 'métropole. L’information provient des relevés OpenStreetMap et peut manquer '
                    + 'sur certains équipements : l’absence de mention ne signifie pas l’absence '
                    + 'd’accessibilité.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les emplacements proviennent d’OpenStreetMap, resynchronisés automatiquement. '
                    + 'Un sanitaire fermé pour travaux ou définitivement retiré peut subsister '
                    + 'quelque temps sur la carte, et un équipement récent peut manquer.',
                ],
            },
        ],
        faq: [
            {
                q: 'Les toilettes publiques sont-elles gratuites à Paris ?',
                a: 'Les sanisettes automatiques de la Ville de Paris sont gratuites depuis 2006. '
                    + 'D’autres sanitaires, notamment en gare ou dans certaines communes de la '
                    + 'métropole, restent payants : la carte distingue les deux.',
            },
            {
                q: 'Les sanisettes parisiennes sont-elles ouvertes la nuit ?',
                a: 'La plupart fonctionnent en continu, contrairement aux sanitaires installés dans '
                    + 'les parcs et squares, qui ferment avec eux. Les horaires renseignés '
                    + 'apparaissent dans la fiche de chaque emplacement lorsqu’ils sont connus.',
            },
            {
                q: 'Comment trouver les toilettes les plus proches à vélo ?',
                a: 'Zoomez sur votre position : la carte affiche les sanitaires recensés autour de '
                    + 'vous, avec leur gratuité et leur accessibilité lorsque l’information est '
                    + 'renseignée. Repérer un arrêt à l’avance évite le détour improvisé.',
            },
            {
                q: 'Ces toilettes s’affichent-elles pendant un calcul d’itinéraire ?',
                a: 'Pas en Île-de-France. La navigation de Sécu’Cycle repose sur un réseau '
                    + 'routier chargé en mémoire, qui ne couvre pas encore le Grand Paris. '
                    + 'Cette carte reste consultable à part entière, mais sans calcul de '
                    + 'trajet associé.',
            },
        ],
    },

    'paris/points-eau': {
        title: 'Points d’eau potable à Paris — carte des fontaines',
        description: 'Carte des fontaines à boire et points d’eau potable de Paris et du Grand '
            + 'Paris : fontaines Wallace, fontaines pétillantes et bornes de parcs.',
        h1: 'Points d’eau potable à Paris',
        intro: 'Où remplir sa gourde à vélo dans le Grand Paris ? Cette carte recense les fontaines '
            + 'à boire et points d’eau potable accessibles librement, des fontaines Wallace du '
            + 'centre aux bornes des parcs des communes voisines.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Paris possède l’un des réseaux de fontaines publiques les plus denses au monde, '
                    + 'héritier des fontaines Wallace offertes à la ville en 1872 et toujours en '
                    + 'service. S’y ajoutent des fontaines contemporaines, des bornes de parcs et '
                    + 'quelques fontaines pétillantes, qui délivrent de l’eau gazéifiée gratuitement.',
                    'Une grande partie de ce réseau est saisonnier : les fontaines Wallace, sensibles '
                    + 'au gel, sont traditionnellement fermées de la mi-novembre à la mi-mars. La '
                    + 'carte les affiche toute l’année, sans distinguer la période de coupure.',
                ],
            },
            {
                h2: 'Bien s’hydrater à vélo',
                p: [
                    'En ville, la déshydratation s’installe sans qu’on la sente, surtout par temps '
                    + 'chaud et sur des trajets hachés par les feux. Repérez un ou deux points d’eau '
                    + 'sur les itinéraires que vous répétez plutôt que d’en chercher un dans '
                    + 'l’urgence : la plupart des fontaines parisiennes se trouvent dans les squares '
                    + 'et sur les places, rarement le long des grands axes.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les emplacements proviennent d’OpenStreetMap, resynchronisés automatiquement. '
                    + 'Une fontaine hors service ou fermée pour la saison froide reste affichée : '
                    + 'la donnée décrit l’équipement, pas son état du jour.',
                ],
            },
        ],
        faq: [
            {
                q: 'L’eau des fontaines parisiennes est-elle potable ?',
                a: 'Oui. Les fontaines publiques recensées ici délivrent de l’eau potable contrôlée. '
                    + 'Les points signalés comme non potables dans les données ne sont pas affichés '
                    + 'sur cette carte.',
            },
            {
                q: 'Les fontaines Wallace fonctionnent-elles en hiver ?',
                a: 'Non : elles sont généralement fermées de la mi-novembre à la mi-mars pour éviter '
                    + 'le gel des canalisations. Les bornes plus récentes et les fontaines de '
                    + 'bâtiments publics restent, elles, ouvertes toute l’année.',
            },
            {
                q: 'Existe-t-il des fontaines d’eau pétillante à Paris ?',
                a: 'Oui, plusieurs fontaines pétillantes délivrent gratuitement de l’eau gazéifiée. '
                    + 'Lorsqu’elles sont renseignées comme telles dans OpenStreetMap, elles '
                    + 'apparaissent sur cette carte au même titre que les autres points d’eau.',
            },
            {
                q: 'Puis-je faire passer mon itinéraire par ces points d’eau ?',
                a: 'Pas encore à Paris : le calculateur d’itinéraires ne dessert pas '
                    + 'l’Île-de-France, faute de réseau routier chargé pour cette emprise. '
                    + 'Repérez vos points de remplissage sur cette carte avant de partir.',
            },
        ],
    },

    'paris/velos-libre-service': {
        title: 'Stations Vélib’ à Paris — disponibilité en temps réel',
        description: 'Carte des stations Vélib’ Métropole en temps réel : vélos mécaniques et '
            + 'électriques disponibles, places libres, station par station.',
        h1: 'Stations Vélib’ à Paris',
        intro: 'Combien de vélos reste-t-il à la station la plus proche ? Cette carte affiche les '
            + 'stations Vélib’ Métropole avec, pour chacune, le nombre de vélos disponibles et de '
            + 'places libres, actualisé en continu depuis le flux ouvert du service.',
        sources: [SOURCE_GBFS_PARIS],
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Chaque station indique les vélos disponibles et les places libres au moment de '
                    + 'la consultation. Vélib’ Métropole exploite une flotte mixte : les vélos '
                    + 'mécaniques, en vert, et les vélos à assistance électrique, en bleu, dont la '
                    + 'disponibilité est indiquée séparément dans la fiche de chaque station.',
                    'Le service dépasse largement Paris intra-muros : le réseau couvre une grande '
                    + 'partie de la métropole, ce qui permet des trajets de banlieue à banlieue sans '
                    + 'passer par le centre. Une station affichée à zéro vélo ou à zéro place libre '
                    + 'l’est réellement : mieux vaut viser une station voisine que se déplacer pour '
                    + 'rien.',
                ],
            },
            {
                h2: 'Quelques réflexes utiles',
                p: [
                    'Aux heures de pointe, les stations des gares se vident le matin et se '
                    + 'remplissent le soir : anticipez en repérant deux stations d’arrivée proches '
                    + 'l’une de l’autre. En cas de station pleine, l’application du service accorde '
                    + 'généralement un délai supplémentaire pour rejoindre une autre station.',
                    'Vérifiez l’état du vélo avant de partir — freins, pneus, selle — et signalez '
                    + 'tout défaut depuis l’application : un vélo signalé est retiré de la '
                    + 'circulation, ce qui bénéficie à tout le monde.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les disponibilités proviennent du flux GBFS public de Vélib’ Métropole, '
                    + 'interrogé au rythme qu’il publie lui-même. La carte reflète donc l’état connu '
                    + 'du service, à quelques instants près. Sécu’Cycle n’est pas affilié à '
                    + 'l’exploitant.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien y a-t-il de stations Vélib’ ?',
                a: 'Le réseau compte environ 1 400 stations réparties sur Paris et une centaine de '
                    + 'communes de la métropole. La carte affiche celles qui sont actives au moment '
                    + 'de la consultation.',
            },
            {
                q: 'La disponibilité affichée est-elle en temps réel ?',
                a: 'Elle provient du flux officiel du service, rafraîchi en continu. Un décalage de '
                    + 'quelques instants est possible entre l’affichage et la réalité de la station, '
                    + 'notamment aux heures de pointe.',
            },
            {
                q: 'Comment distinguer les vélos mécaniques des électriques ?',
                a: 'La fiche de chaque station détaille les deux catégories lorsque le flux les '
                    + 'publie. Les vélos à assistance électrique sont facturés différemment des '
                    + 'vélos mécaniques : renseignez-vous auprès de l’exploitant.',
            },
            {
                q: 'Peut-on rendre un vélo dans n’importe quelle station ?',
                a: 'Oui, dans la limite des places libres. Si la station visée est pleine, la carte '
                    + 'vous permet d’en repérer une autre à proximité avant de vous déplacer.',
            },
            {
                q: 'Sécu’Cycle propose-t-il un itinéraire depuis une station Vélib’ ?',
                a: 'Pas encore. La carte des stations est à jour sur tout le périmètre '
                    + 'Vélib’, mais le calcul d’itinéraire ne couvre pas l’Île-de-France : il '
                    + 'repose sur un réseau routier chargé en mémoire par le serveur, '
                    + 'aujourd’hui limité aux agglomérations listées sur la page Cartes.',
            },
        ],
    },

    'paris/accidents-velo': {
        title: 'Accidents de vélo à Paris — carte des zones à risque',
        description: 'Carte des accidents corporels impliquant un cycliste à Paris et dans le Grand '
            + 'Paris, issue des données officielles BAAC, pour repérer les points noirs.',
        h1: 'Accidents de vélo à Paris',
        intro: 'Cette carte localise les accidents corporels impliquant un cycliste recensés à Paris '
            + 'et dans les communes de la métropole. Elle sert à repérer les carrefours et les axes '
            + 'où la vigilance doit être maximale, pas à décourager la pratique.',
        sources: [SOURCE_BAAC],
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Chaque point correspond à un accident corporel — c’est-à-dire ayant fait au '
                    + 'moins un blessé — enregistré par les forces de l’ordre dans le fichier BAAC. '
                    + 'Les accidents matériels, bien plus nombreux, n’y figurent pas, pas plus que '
                    + 'les chutes sans tiers impliqué.',
                    'À Paris, les concentrations apparaissent sans surprise sur les grands axes et '
                    + 'les places à circulation giratoire, là où les flux se croisent en nombre. Une '
                    + 'zone dense ne signifie pas nécessairement un aménagement dangereux : elle '
                    + 'traduit d’abord un trafic cycliste élevé. C’est la comparaison entre '
                    + 'carrefours voisins qui est instructive.',
                ],
            },
            {
                h2: 'Les configurations les plus fréquentes',
                p: [
                    'Deux situations dominent en ville. Le tourne-à-droite d’un véhicule qui coupe la '
                    + 'trajectoire d’un cycliste allant tout droit, particulièrement redoutable avec '
                    + 'un poids lourd ou un bus dont l’angle mort est étendu. Et l’ouverture de '
                    + 'portière côté chaussée, à laquelle la seule parade est de rouler à un mètre '
                    + 'des véhicules stationnés, quitte à occuper franchement la voie.',
                    'Aux carrefours, les sas vélo permettent de se placer devant les véhicules et '
                    + 'd’être vu. Le tourne-à-droite cycliste, autorisé là où le panneau le signale, '
                    + 'ne dispense jamais de céder le passage aux piétons.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les données proviennent du fichier BAAC publié chaque année par l’ONISR sur '
                    + 'data.gouv.fr. Elles sont donc officielles mais rétrospectives : le millésime '
                    + 'le plus récent porte sur une année déjà écoulée. Les localisations sont '
                    + 'parfois approximatives, un accident pouvant être rattaché à l’axe plutôt qu’au '
                    + 'point exact.',
                ],
            },
        ],
        faq: [
            {
                q: 'Cette carte recense-t-elle tous les accidents de vélo ?',
                a: 'Non. Seuls les accidents corporels ayant donné lieu à un procès-verbal des forces '
                    + 'de l’ordre entrent dans le fichier BAAC. Les chutes seules et les accrochages '
                    + 'sans blessé n’y figurent pas, alors qu’ils représentent une part importante '
                    + 'des incidents réels.',
            },
            {
                q: 'Les données sont-elles à jour ?',
                a: 'Elles suivent le calendrier de publication de l’ONISR : le dernier millésime '
                    + 'disponible porte sur une année révolue. Cette carte est un outil de '
                    + 'compréhension des zones à risque, pas un suivi de l’actualité.',
            },
            {
                q: 'Rouler à Paris est-il dangereux ?',
                a: 'Le nombre d’accidents augmente mécaniquement avec le nombre de cyclistes, mais '
                    + 'les études convergent sur l’effet de sécurité par le nombre : plus les '
                    + 'cyclistes sont nombreux et visibles, plus le risque individuel baisse. Les '
                    + 'bénéfices sanitaires de la pratique dépassent très largement son risque.',
            },
            {
                q: 'Ces accidents influencent-ils les itinéraires proposés à Paris ?',
                a: 'Ailleurs, oui : la couche pèse dans le score de sécurité. À Paris, la '
                    + 'question ne se pose pas encore, le calcul d’itinéraire ne couvrant pas '
                    + 'l’Île-de-France. La carte garde tout son intérêt pour repérer les '
                    + 'points noirs avant de choisir son parcours.',
            },
        ],
    },

    'paris/reparation-velo': {
        title: 'Réparer son vélo à Paris — ateliers et stations de gonflage',
        description: 'Carte des ateliers de réparation, vélocistes et stations de gonflage en libre '
            + 'accès à Paris et dans le Grand Paris.',
        h1: 'Réparation de vélo à Paris',
        intro: 'Une chambre à air à changer, un dérailleur qui saute, un pneu à regonfler : cette '
            + 'carte recense les ateliers, les vélocistes et les stations de gonflage en libre accès '
            + 'de Paris et de sa métropole.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Trois types de points cohabitent. Les vélocistes et ateliers professionnels, qui '
                    + 'réparent, entretiennent et vendent. Les ateliers associatifs d’auto-réparation, '
                    + 'nombreux en Île-de-France, où l’on répare soi-même son vélo avec l’outillage '
                    + 'et les conseils du lieu, souvent contre une adhésion modique. Et les stations '
                    + 'de gonflage et de petite réparation installées sur l’espace public, '
                    + 'librement accessibles.',
                    'Les horaires ne sont pas toujours renseignés : un atelier associatif n’ouvre '
                    + 'souvent que quelques après-midi par semaine. Vérifiez avant de vous déplacer '
                    + 'avec un vélo en panne.',
                ],
            },
            {
                h2: 'Ce qu’on peut réparer soi-même',
                p: [
                    'Une crevaison, un frein à régler, une chaîne à retendre ou à lubrifier sont à la '
                    + 'portée de tous avec un peu de méthode. Emporter une chambre à air de rechange, '
                    + 'deux démonte-pneus et une petite pompe évite la plupart des immobilisations.',
                    'Confiez en revanche à un professionnel tout ce qui touche à la sécurité '
                    + 'structurelle — fourche, cadre, roue voilée, direction — et le système '
                    + 'électrique d’un vélo à assistance, dont l’intervention sans outillage adapté '
                    + 'annule généralement la garantie.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les emplacements proviennent d’OpenStreetMap, resynchronisés automatiquement. '
                    + 'Un atelier récent peut manquer, un commerce fermé subsister quelque temps.',
                ],
            },
        ],
        faq: [
            {
                q: 'Où gonfler ses pneus gratuitement à Paris ?',
                a: 'Les stations de gonflage en libre accès installées sur l’espace public '
                    + 'apparaissent sur cette carte. Beaucoup de vélocistes acceptent également de '
                    + 'dépanner un cycliste de passage.',
            },
            {
                q: 'Qu’est-ce qu’un atelier d’auto-réparation ?',
                a: 'Un lieu, généralement associatif, qui met à disposition outillage, pièces '
                    + 'd’occasion et conseils pour que vous répariez vous-même votre vélo. '
                    + 'L’Île-de-France en compte un grand nombre, souvent ouverts quelques '
                    + 'demi-journées par semaine.',
            },
            {
                q: 'Existe-t-il une aide à la réparation ?',
                a: 'Des dispositifs d’aide à la réparation et à l’achat de vélo existent au niveau '
                    + 'national et local, avec des conditions qui évoluent régulièrement. '
                    + 'Renseignez-vous auprès de votre commune et de la Région.',
            },
            {
                q: 'Puis-je me faire guider jusqu’à l’atelier le plus proche ?',
                a: 'Pas depuis Sécu’Cycle dans le Grand Paris : le calcul d’itinéraire n’y '
                    + 'est pas encore disponible, faute de réseau routier chargé pour cette '
                    + 'emprise. La carte donne l’adresse et, quand elle est connue, la nature '
                    + 'de chaque point de réparation.',
            },
        ],
    },
    'lyon/stationnements-velo': {
        title: 'Stationnements vélo à Lyon — carte des arceaux et abris',
        description: 'Carte interactive des stationnements vélo de la Métropole de Lyon : arceaux, '
            + 'abris, consignes sécurisées et places déclarées, en données ouvertes.',
        h1: 'Stationnements vélo à Lyon',
        intro: 'Où attacher son vélo à Lyon ? Cette carte recense les arceaux, râteliers, abris et '
            + 'consignes des 58 communes de la Métropole, de la Presqu’île à Villeurbanne et de '
            + 'Vaulx-en-Velin à Sainte-Foy-lès-Lyon.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Chaque point correspond à un emplacement relevé sur le terrain par les '
                    + 'contributeurs OpenStreetMap. Les arceaux dominent largement : ce sont les '
                    + 'seuls équipements permettant d’attacher à la fois le cadre et une roue avec '
                    + 'un antivol en U, et ceux à privilégier dès que le vélo reste plus de quelques '
                    + 'minutes.',
                    'Les abris et consignes fermées apparaissent séparément. On les trouve surtout '
                    + 'autour des gares — Part-Dieu, Perrache, Vaise — et des grands pôles '
                    + 'd’échange, où ils permettent de laisser un vélo la journée sans le confier à '
                    + 'la rue.',
                ],
            },
            {
                h2: 'Stationner dans une ville en pente',
                p: [
                    'La topographie lyonnaise a une conséquence directe sur le stationnement : dans '
                    + 'les montées de la Croix-Rousse ou de Fourvière, un vélo mal calé se couche, et '
                    + 'un vélo couché s’abîme. Attachez-le au plus près de l’arceau, roue avant '
                    + 'braquée contre le trottoir, et évitez de le suspendre à sa seule roue.',
                    'Pour le reste, les règles habituelles s’appliquent : antivol en U certifié, '
                    + 'cadre attaché à un point fixe, emplacement fréquenté plutôt qu’une contre-allée '
                    + 'déserte. Le marquage Bicycode, obligatoire à la vente depuis 2021, améliore '
                    + 'nettement les chances de restitution.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Le recensement provient d’OpenStreetMap et est resynchronisé automatiquement. '
                    + 'Un arceau posé récemment peut manquer, un équipement retiré subsister quelques '
                    + 'semaines. Toute correction apportée sur OpenStreetMap se retrouve ici après la '
                    + 'synchronisation suivante.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien y a-t-il de stationnements vélo à Lyon ?',
                a: 'Le compteur en tête de carte affiche le total recensé sur les 58 communes de la '
                    + 'Métropole au moment où vous consultez la page, ainsi que le nombre de places '
                    + 'déclarées lorsque l’information existe.',
            },
            {
                q: 'Où trouver un parking à vélo sécurisé à Lyon ?',
                a: 'Les abris fermés et consignes apparaissent dans la catégorie « Abris et '
                    + 'consignes », principalement autour des gares et des pôles d’échange. L’accès '
                    + 'se fait généralement sur abonnement auprès de l’exploitant.',
            },
            {
                q: 'Quelle est la différence entre un arceau et un râtelier ?',
                a: 'Un arceau est un tube en U inversé auquel on attache le cadre et une roue : c’est '
                    + 'le dispositif recommandé. Un râtelier ne retient que la roue avant, ce qui '
                    + 'protège mal du vol et peut voiler la jante.',
            },
            {
                q: 'Peut-on calculer un itinéraire jusqu’à ces stationnements ?',
                a: 'Pas encore dans la métropole lyonnaise. Le calcul de trajet exige un '
                    + 'réseau routier chargé en mémoire par notre serveur, et Lyon n’y figure '
                    + 'pas pour l’instant — contrairement aux données de cette carte, '
                    + 'synchronisées automatiquement. Les villes navigables sont listées sur '
                    + 'la page Cartes.',
            },
        ],
    },

    'lyon/toilettes-publiques': {
        title: 'Toilettes publiques à Lyon — carte interactive',
        description: 'Carte des toilettes publiques de Lyon et de sa métropole : sanitaires '
            + 'gratuits, payants et accessibles en fauteuil roulant, localisés et à jour.',
        h1: 'Toilettes publiques à Lyon',
        intro: 'Cette carte localise les toilettes publiques recensées sur la Métropole de Lyon, en '
            + 'distinguant les sanitaires gratuits des sanitaires payants et en signalant ceux qui '
            + 'sont accessibles en fauteuil roulant.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Les sanitaires de voirie côtoient ici ceux des parcs et jardins — le parc de la '
                    + 'Tête d’Or en tête —, des berges aménagées du Rhône et de la Saône, et des '
                    + 'équipements publics. Les berges et le parc concentrent une part importante de '
                    + 'l’offre, ce qui est utile à connaître sur les itinéraires de promenade.',
                    'Beaucoup de ces sanitaires ferment avec le parc qui les abrite, souvent à la '
                    + 'tombée de la nuit et plus tôt en hiver. Les horaires apparaissent dans la '
                    + 'fiche de l’emplacement lorsqu’ils sont renseignés.',
                ],
            },
            {
                h2: 'Accessibilité',
                p: [
                    'Les toilettes signalées comme accessibles disposent d’un espace de rotation et '
                    + 'de barres d’appui. L’information provient des relevés OpenStreetMap et manque '
                    + 'sur une partie des équipements : l’absence de mention ne signifie pas '
                    + 'l’absence d’accessibilité, seulement que personne ne l’a encore renseignée.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les emplacements proviennent d’OpenStreetMap, resynchronisés automatiquement. Un '
                    + 'sanitaire fermé pour travaux peut rester affiché quelque temps.',
                ],
            },
        ],
        faq: [
            {
                q: 'Les toilettes publiques sont-elles gratuites à Lyon ?',
                a: 'La majorité des sanitaires de voirie recensés sont gratuits. Certains '
                    + 'équipements, notamment en gare, restent payants : la carte distingue les deux '
                    + 'lorsque l’information est renseignée.',
            },
            {
                q: 'Y a-t-il des toilettes le long des berges du Rhône ?',
                a: 'Oui, plusieurs sanitaires jalonnent les berges aménagées et le parc de la Tête '
                    + 'd’Or. Ils suivent en revanche les horaires d’ouverture des espaces verts.',
            },
            {
                q: 'Comment trouver les toilettes les plus proches à vélo ?',
                a: 'Zoomez sur votre position : la carte affiche les sanitaires recensés autour de '
                    + 'vous. Les berges du Rhône et de la Saône et les grands parcs concentrent '
                    + 'l’essentiel de l’offre : c’est là qu’il faut regarder en premier.',
            },
            {
                q: 'Ces sanitaires apparaissent-ils sur un calcul d’itinéraire ?',
                a: 'Pas à Lyon : la navigation de Sécu’Cycle ne couvre pas encore la '
                    + 'métropole. La carte se consulte seule, ce qui suffit pour repérer un '
                    + 'arrêt sur un parcours que l’on connaît.',
            },
        ],
    },

    'lyon/points-eau': {
        title: 'Points d’eau potable à Lyon — carte des fontaines',
        description: 'Carte des fontaines à boire et points d’eau potable de Lyon et de sa '
            + 'métropole, pour remplir sa gourde à vélo.',
        h1: 'Points d’eau potable à Lyon',
        intro: 'Où remplir sa gourde à Lyon ? Cette carte recense les fontaines à boire et points '
            + 'd’eau potable librement accessibles sur la Métropole, des places de la Presqu’île aux '
            + 'parcs de Villeurbanne.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Les fontaines lyonnaises se concentrent dans les parcs, sur les places et le '
                    + 'long des berges réaménagées du Rhône. Le parc de la Tête d’Or en compte '
                    + 'plusieurs, ce qui en fait un point de ravitaillement commode sur les '
                    + 'itinéraires nord de l’agglomération.',
                    'Une partie du réseau est coupée l’hiver pour éviter le gel : la carte affiche '
                    + 'l’équipement toute l’année, sans indiquer sa période de fermeture.',
                ],
            },
            {
                h2: 'Bien s’hydrater à vélo',
                p: [
                    'Le relief lyonnais fait grimper l’effort plus vite qu’on ne le croit : une '
                    + 'montée de la Croix-Rousse ou de Fourvière vaut un effort soutenu, même sur un '
                    + 'trajet quotidien court. Repérez un ou deux points d’eau sur les itinéraires '
                    + 'que vous répétez, plutôt que d’en chercher un dans l’urgence.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les emplacements proviennent d’OpenStreetMap, resynchronisés automatiquement. '
                    + 'Une fontaine hors service ou coupée pour la saison reste affichée : la donnée '
                    + 'décrit l’équipement, pas son état du jour.',
                ],
            },
        ],
        faq: [
            {
                q: 'L’eau des fontaines lyonnaises est-elle potable ?',
                a: 'Oui. Seuls les points délivrant de l’eau potable sont affichés ; ceux renseignés '
                    + 'comme non potables dans les données sont écartés.',
            },
            {
                q: 'Les fontaines fonctionnent-elles toute l’année ?',
                a: 'Une partie du réseau est fermée pendant les mois froids pour éviter le gel des '
                    + 'canalisations. Les fontaines situées dans des bâtiments publics restent '
                    + 'généralement en service.',
            },
            {
                q: 'Un point d’eau manque sur la carte, comment le signaler ?',
                a: 'Les données proviennent d’OpenStreetMap : ajoutez-le sur openstreetmap.org, il '
                    + 'sera repris à la synchronisation suivante. Vous pouvez aussi nous écrire via '
                    + 'la page Contact.',
            },
            {
                q: 'Le calculateur d’itinéraires peut-il passer par ces fontaines ?',
                a: 'Pas encore à Lyon. Le calcul de trajet s’appuie sur un réseau routier '
                    + 'chargé pour une emprise plus étroite que celle des données, dont la '
                    + 'métropole lyonnaise est absente. Repérez vos points de remplissage ici '
                    + 'avant de partir, en particulier avant les montées.',
            },
        ],
    },

    'lyon/velos-libre-service': {
        title: 'Stations Vélo’v à Lyon — disponibilité en temps réel',
        description: 'Carte des stations Vélo’v en temps réel : vélos mécaniques et électriques '
            + 'disponibles, places libres, station par station sur la Métropole de Lyon.',
        h1: 'Stations Vélo’v à Lyon',
        intro: 'Combien de vélos reste-t-il à la station la plus proche ? Cette carte affiche les '
            + 'stations Vélo’v avec, pour chacune, le nombre de vélos disponibles et de places '
            + 'libres, actualisé en continu depuis le flux ouvert du service.',
        sources: [SOURCE_GBFS_LYON],
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Lancé en 2005, Vélo’v est le premier grand système de vélos en libre-service '
                    + 'français : il a servi de modèle à la plupart de ceux qui ont suivi. Le réseau '
                    + 'couvre Lyon, Villeurbanne et une partie des communes de la Métropole.',
                    'Chaque station indique les vélos disponibles et les places libres. La flotte est '
                    + 'mixte : la fiche d’une station détaille les vélos mécaniques et les vélos à '
                    + 'assistance électrique lorsque le flux publie l’information. Une station '
                    + 'affichée à zéro l’est réellement — visez la voisine plutôt que de vous '
                    + 'déplacer pour rien.',
                ],
            },
            {
                h2: 'Le relief change la donne',
                p: [
                    'À Lyon plus qu’ailleurs, le sens du trajet compte. Les stations des hauteurs — '
                    + 'Croix-Rousse, Fourvière, Saint-Just — se vident vers le bas dans la journée et '
                    + 'se remplissent difficilement : trouver un vélo en haut est souvent plus '
                    + 'difficile que de rendre en bas. Les vélos à assistance électrique changent '
                    + 'beaucoup cette équation dans les montées.',
                    'Vérifiez l’état du vélo avant de partir — freins surtout, indispensables dans '
                    + 'les descentes — et signalez tout défaut depuis l’application : un vélo signalé '
                    + 'est retiré de la circulation.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les disponibilités proviennent du flux GBFS public du service, interrogé au '
                    + 'rythme qu’il publie lui-même. Sécu’Cycle n’est pas affilié à l’exploitant.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien y a-t-il de stations Vélo’v ?',
                a: 'Le réseau compte de l’ordre de 430 stations sur Lyon, Villeurbanne et les '
                    + 'communes voisines. La carte affiche celles qui sont actives au moment de la '
                    + 'consultation.',
            },
            {
                q: 'La disponibilité affichée est-elle en temps réel ?',
                a: 'Elle provient du flux officiel du service, rafraîchi en continu. Un décalage de '
                    + 'quelques instants reste possible, en particulier aux heures de pointe.',
            },
            {
                q: 'Y a-t-il des Vélo’v à assistance électrique ?',
                a: 'Oui, une partie de la flotte est électrique. La fiche de chaque station détaille '
                    + 'la répartition entre vélos mécaniques et électriques lorsque le flux la '
                    + 'publie.',
            },
            {
                q: 'Sécu’Cycle peut-il me guider depuis une station Vélo’v ?',
                a: 'Pas encore : les disponibilités sont bien affichées en direct, mais le '
                    + 'calcul d’itinéraire ne dessert pas la métropole de Lyon. Il dépend '
                    + 'd’un réseau routier chargé en mémoire, limité aux agglomérations '
                    + 'listées sur la page Cartes.',
            },
        ],
    },

    'lyon/accidents-velo': {
        title: 'Accidents de vélo à Lyon — carte des zones à risque',
        description: 'Carte des accidents corporels impliquant un cycliste sur la Métropole de Lyon, '
            + 'issue des données officielles BAAC, pour repérer les points noirs.',
        h1: 'Accidents de vélo à Lyon',
        intro: 'Cette carte localise les accidents corporels impliquant un cycliste recensés sur la '
            + 'Métropole de Lyon. Elle sert à repérer les carrefours et les axes où la vigilance '
            + 'doit être maximale, pas à décourager la pratique.',
        sources: [SOURCE_BAAC],
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Chaque point correspond à un accident corporel — ayant fait au moins un blessé — '
                    + 'enregistré par les forces de l’ordre dans le fichier BAAC. Les accidents '
                    + 'purement matériels et les chutes sans tiers impliqué n’y figurent pas.',
                    'Les concentrations apparaissent sur les grands axes et aux carrefours '
                    + 'structurants, ainsi qu’aux points de franchissement du Rhône et de la Saône, '
                    + 'où les flux se resserrent sur un nombre limité de ponts. Une zone dense '
                    + 'traduit d’abord un trafic cycliste élevé : c’est la comparaison entre '
                    + 'carrefours voisins qui est instructive.',
                ],
            },
            {
                h2: 'Les configurations les plus fréquentes',
                p: [
                    'Le tourne-à-droite d’un véhicule coupant la trajectoire d’un cycliste allant '
                    + 'tout droit reste le grand classique, particulièrement dangereux avec un poids '
                    + 'lourd ou un bus. L’ouverture de portière côté chaussée arrive juste derrière : '
                    + 'la seule parade est de rouler à un mètre des véhicules stationnés.',
                    'Le relief ajoute un facteur local : en descente, la vitesse d’un cycliste est '
                    + 'souvent sous-estimée par les automobilistes qui s’insèrent. Anticipez les '
                    + 'freinages et couvrez les leviers dans les pentes de la Croix-Rousse et de '
                    + 'Fourvière.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les données proviennent du fichier BAAC publié chaque année par l’ONISR sur '
                    + 'data.gouv.fr. Elles sont officielles mais rétrospectives, et les '
                    + 'localisations parfois approximatives, un accident pouvant être rattaché à '
                    + 'l’axe plutôt qu’au point exact.',
                ],
            },
        ],
        faq: [
            {
                q: 'Cette carte recense-t-elle tous les accidents de vélo ?',
                a: 'Non. Seuls les accidents corporels ayant donné lieu à un procès-verbal des forces '
                    + 'de l’ordre entrent dans le fichier BAAC. Les chutes seules et les accrochages '
                    + 'sans blessé n’y figurent pas.',
            },
            {
                q: 'Les données sont-elles à jour ?',
                a: 'Elles suivent le calendrier de publication de l’ONISR : le dernier millésime '
                    + 'disponible porte sur une année révolue.',
            },
            {
                q: 'Rouler à Lyon est-il dangereux ?',
                a: 'Le nombre d’accidents croît avec le nombre de cyclistes, mais le risque '
                    + 'individuel baisse à mesure que la pratique se répand — c’est l’effet de '
                    + 'sécurité par le nombre. Les bénéfices sanitaires du vélo dépassent très '
                    + 'largement son risque.',
            },
            {
                q: 'Ces accidents modifient-ils l’itinéraire proposé à Lyon ?',
                a: 'Là où la navigation fonctionne, oui : la couche pèse dans le score de '
                    + 'sécurité. La métropole lyonnaise n’est pas encore desservie par le '
                    + 'calcul d’itinéraire, donc la carte s’y consulte pour elle-même — utile '
                    + 'pour repérer les axes à éviter aux heures de pointe.',
            },
        ],
    },

    'lyon/reparation-velo': {
        title: 'Réparer son vélo à Lyon — ateliers et stations de gonflage',
        description: 'Carte des ateliers de réparation, vélocistes et stations de gonflage en libre '
            + 'accès sur la Métropole de Lyon.',
        h1: 'Réparation de vélo à Lyon',
        intro: 'Une chambre à air à changer, des freins à régler, un pneu à regonfler : cette carte '
            + 'recense les ateliers, les vélocistes et les stations de gonflage en libre accès de la '
            + 'Métropole de Lyon.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Trois types de points cohabitent : les vélocistes et ateliers professionnels, '
                    + 'les ateliers associatifs d’auto-réparation où l’on répare soi-même avec '
                    + 'l’outillage et les conseils du lieu, et les stations de gonflage installées '
                    + 'sur l’espace public, librement accessibles.',
                    'Les horaires ne sont pas toujours renseignés, et un atelier associatif n’ouvre '
                    + 'souvent que quelques après-midi par semaine : mieux vaut vérifier avant de se '
                    + 'déplacer avec un vélo en panne.',
                ],
            },
            {
                h2: 'Les freins, priorité lyonnaise',
                p: [
                    'Dans une ville en pente, l’usure des patins et des plaquettes est beaucoup plus '
                    + 'rapide qu’ailleurs. Contrôlez-les régulièrement : un patin usé jusqu’au témoin '
                    + 'perd l’essentiel de son mordant, et une descente de la Croix-Rousse n’est pas '
                    + 'le moment de s’en apercevoir.',
                    'Une crevaison, une chaîne à retendre ou un dérailleur à régler restent à la '
                    + 'portée de tous. Confiez en revanche à un professionnel tout ce qui touche à la '
                    + 'fourche, au cadre, à la direction ou au système électrique d’un vélo à '
                    + 'assistance.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les emplacements proviennent d’OpenStreetMap, resynchronisés automatiquement. Un '
                    + 'atelier récent peut manquer, un commerce fermé subsister quelque temps.',
                ],
            },
        ],
        faq: [
            {
                q: 'Où gonfler ses pneus gratuitement à Lyon ?',
                a: 'Les stations de gonflage en libre accès installées sur l’espace public '
                    + 'apparaissent sur cette carte. Beaucoup de vélocistes dépannent également un '
                    + 'cycliste de passage.',
            },
            {
                q: 'Qu’est-ce qu’un atelier d’auto-réparation ?',
                a: 'Un lieu, le plus souvent associatif, qui met à disposition outillage, pièces '
                    + 'd’occasion et conseils pour que vous répariez vous-même votre vélo, en général '
                    + 'contre une adhésion modique.',
            },
            {
                q: 'À quelle fréquence entretenir son vélo ?',
                a: 'Un contrôle rapide des freins, des pneus et de la chaîne tous les mois suffit '
                    + 'pour un usage quotidien. Dans une ville en pente, surveillez les freins plus '
                    + 'souvent : leur usure y est nettement accélérée.',
            },
            {
                q: 'Puis-je être guidé jusqu’à l’atelier le plus proche ?',
                a: 'Pas via Sécu’Cycle à Lyon : le calcul d’itinéraire n’y est pas encore '
                    + 'disponible. La carte donne en revanche l’emplacement des ateliers et '
                    + 'des stations de gonflage, ce qui compte quand on redescend de la '
                    + 'Croix-Rousse avec des freins fatigués.',
            },
        ],
    },
    'lille/stationnements-velo': {
        title: 'Stationnements vélo à Lille — carte des arceaux et abris',
        description: 'Carte interactive des stationnements vélo de la Métropole Européenne de '
            + 'Lille : arceaux, abris, consignes sécurisées et places déclarées.',
        h1: 'Stationnements vélo à Lille',
        intro: 'Où attacher son vélo à Lille ? Cette carte recense les arceaux, râteliers, abris et '
            + 'consignes des 95 communes de la Métropole Européenne de Lille, de Lille à Roubaix et '
            + 'de Tourcoing à Villeneuve-d’Ascq.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Chaque point correspond à un emplacement relevé sur le terrain par les '
                    + 'contributeurs OpenStreetMap. Les arceaux sont les plus nombreux : ce sont les '
                    + 'seuls équipements qui permettent d’attacher le cadre et une roue avec un '
                    + 'antivol en U, à privilégier dès que le vélo reste stationné un moment.',
                    'Les abris et consignes fermées apparaissent séparément. La métropole étant '
                    + 'organisée autour d’un réseau ferroviaire dense, on les trouve surtout aux '
                    + 'abords des gares — Lille-Flandres, Lille-Europe, Roubaix, Tourcoing — où ils '
                    + 'servent aux trajets combinant train et vélo.',
                ],
            },
            {
                h2: 'Stationner sur les pavés',
                p: [
                    'Le pavé, emblème de la région, n’est pas anodin pour un vélo stationné : sur une '
                    + 'chaussée irrégulière, une béquille tient mal et un vélo qui tombe abîme son '
                    + 'dérailleur. Préférez un arceau chaque fois que c’est possible plutôt qu’un '
                    + 'appui de fortune.',
                    'Pour le reste, les règles habituelles valent : antivol en U certifié, cadre '
                    + 'attaché à un point fixe, emplacement passant et éclairé. Le marquage '
                    + 'Bicycode, obligatoire à la vente depuis 2021, améliore nettement les chances '
                    + 'de restitution en cas de vol.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Le recensement provient d’OpenStreetMap et est resynchronisé automatiquement. Un '
                    + 'arceau posé récemment peut manquer, un équipement retiré subsister quelques '
                    + 'semaines. Toute correction apportée sur OpenStreetMap se retrouve ici après la '
                    + 'synchronisation suivante.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien y a-t-il de stationnements vélo à Lille ?',
                a: 'Le compteur en tête de carte affiche le total recensé sur les 95 communes de la '
                    + 'métropole au moment où vous consultez la page, ainsi que le nombre de places '
                    + 'déclarées lorsque l’information existe.',
            },
            {
                q: 'Où laisser son vélo près d’une gare dans la métropole lilloise ?',
                a: 'Les abris fermés et consignes apparaissent dans la catégorie « Abris et '
                    + 'consignes », principalement autour des gares et des pôles d’échange. L’accès '
                    + 'se fait généralement sur abonnement.',
            },
            {
                q: 'Quelle est la différence entre un arceau et un râtelier ?',
                a: 'Un arceau est un tube en U inversé auquel on attache le cadre et une roue : c’est '
                    + 'le dispositif recommandé. Un râtelier ne retient que la roue avant, ce qui '
                    + 'protège mal du vol et peut voiler la jante — d’autant plus sur pavés.',
            },
            {
                q: 'Sécu’Cycle calcule-t-il un itinéraire jusqu’à ces arceaux ?',
                a: 'Pas encore dans la métropole lilloise. La carte est alimentée par les '
                    + 'données ouvertes, mais le calcul de trajet exige un réseau routier '
                    + 'chargé en mémoire par le serveur, dont l’emprise est plus étroite. Les '
                    + 'villes navigables figurent sur la page Cartes.',
            },
        ],
    },

    'lille/toilettes-publiques': {
        title: 'Toilettes publiques à Lille — carte interactive',
        description: 'Carte des toilettes publiques de Lille et de la métropole : sanitaires '
            + 'gratuits, payants et accessibles en fauteuil roulant.',
        h1: 'Toilettes publiques à Lille',
        intro: 'Cette carte localise les toilettes publiques recensées sur la Métropole Européenne '
            + 'de Lille, en distinguant les sanitaires gratuits des sanitaires payants et en '
            + 'signalant ceux qui sont accessibles en fauteuil roulant.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Les sanitaires de voirie côtoient ceux des parcs et des équipements publics. La '
                    + 'métropole étant polycentrique, l’offre se répartit entre plusieurs centres '
                    + 'urbains — Lille, Roubaix, Tourcoing, Villeneuve-d’Ascq — plutôt que de se '
                    + 'concentrer sur un seul hypercentre.',
                    'Beaucoup de sanitaires de parcs ferment avec eux, plus tôt en hiver. Les '
                    + 'horaires apparaissent dans la fiche de l’emplacement lorsqu’ils sont '
                    + 'renseignés dans les données.',
                ],
            },
            {
                h2: 'Accessibilité',
                p: [
                    'Les toilettes signalées comme accessibles disposent d’un espace de rotation et '
                    + 'de barres d’appui. L’information provient des relevés OpenStreetMap et manque '
                    + 'sur une partie des équipements : l’absence de mention ne signifie pas '
                    + 'l’absence d’accessibilité.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les emplacements proviennent d’OpenStreetMap, resynchronisés automatiquement. Un '
                    + 'sanitaire fermé pour travaux peut rester affiché quelque temps.',
                ],
            },
        ],
        faq: [
            {
                q: 'Les toilettes publiques sont-elles gratuites à Lille ?',
                a: 'La majorité des sanitaires de voirie recensés sont gratuits. Certains '
                    + 'équipements, notamment en gare, restent payants : la carte distingue les deux '
                    + 'lorsque l’information est renseignée.',
            },
            {
                q: 'Comment trouver les toilettes les plus proches à vélo ?',
                a: 'Zoomez sur votre position : la carte affiche les sanitaires recensés autour de '
                    + 'vous. Les gares, les parcs et les grands équipements publics sont les points '
                    + 'les plus fiables : c’est par eux qu’il faut commencer.',
            },
            {
                q: 'Un sanitaire manque sur la carte, comment le signaler ?',
                a: 'Les données proviennent d’OpenStreetMap : ajoutez-le sur openstreetmap.org, il '
                    + 'sera repris à la synchronisation suivante. Vous pouvez aussi nous écrire via '
                    + 'la page Contact.',
            },
            {
                q: 'Ces toilettes sont-elles visibles pendant un calcul d’itinéraire ?',
                a: 'Pas à Lille : la navigation de Sécu’Cycle ne couvre pas encore la '
                    + 'Métropole Européenne de Lille. La carte se consulte seule, avant de '
                    + 'partir.',
            },
        ],
    },

    'lille/points-eau': {
        title: 'Points d’eau potable à Lille — carte des fontaines',
        description: 'Carte des fontaines à boire et points d’eau potable de Lille et de sa '
            + 'métropole, pour remplir sa gourde à vélo.',
        h1: 'Points d’eau potable à Lille',
        intro: 'Où remplir sa gourde dans la métropole lilloise ? Cette carte recense les fontaines '
            + 'à boire et points d’eau potable librement accessibles, des parcs lillois aux berges '
            + 'de la Deûle.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Les points d’eau se concentrent dans les parcs et sur les itinéraires de '
                    + 'promenade, en particulier le long de la Deûle, dont les berges constituent '
                    + 'l’un des axes cyclables les plus fréquentés de la métropole. La Citadelle et '
                    + 'les grands parcs urbains en comptent également.',
                    'Une partie du réseau est coupée l’hiver pour éviter le gel : la carte affiche '
                    + 'l’équipement toute l’année, sans indiquer sa période de fermeture.',
                ],
            },
            {
                h2: 'Bien s’hydrater à vélo',
                p: [
                    'Le terrain plat de la métropole rend les distances trompeuses : on enchaîne '
                    + 'facilement quinze ou vingt kilomètres sans s’en rendre compte, souvent avec du '
                    + 'vent de face sur les axes dégagés. Repérez un ou deux points d’eau sur les '
                    + 'itinéraires que vous répétez plutôt que d’en chercher un dans l’urgence.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les emplacements proviennent d’OpenStreetMap, resynchronisés automatiquement. '
                    + 'Une fontaine hors service ou coupée pour la saison reste affichée : la donnée '
                    + 'décrit l’équipement, pas son état du jour.',
                ],
            },
        ],
        faq: [
            {
                q: 'L’eau de ces fontaines est-elle potable ?',
                a: 'Oui. Seuls les points délivrant de l’eau potable sont affichés ; ceux renseignés '
                    + 'comme non potables dans les données sont écartés.',
            },
            {
                q: 'Les fontaines fonctionnent-elles toute l’année ?',
                a: 'Une partie du réseau est fermée pendant les mois froids pour éviter le gel des '
                    + 'canalisations.',
            },
            {
                q: 'Y a-t-il des points d’eau le long de la Deûle ?',
                a: 'Les parcs et haltes aménagés qui jalonnent les berges en comptent plusieurs. '
                    + 'Zoomez sur les berges pour repérer ceux qui sont recensés.',
            },
            {
                q: 'Puis-je faire passer un itinéraire par ces points d’eau ?',
                a: 'Pas encore dans la métropole lilloise, où le calcul d’itinéraire n’est '
                    + 'pas disponible : il repose sur un réseau routier chargé pour une '
                    + 'emprise plus restreinte que celle des données. Cette carte reste le '
                    + 'bon outil pour préparer un parcours estival.',
            },
        ],
    },

    'lille/velos-libre-service': {
        title: 'Stations V’Lille — disponibilité en temps réel',
        description: 'Carte des stations V’Lille en temps réel : vélos disponibles et places libres, '
            + 'station par station sur la Métropole Européenne de Lille.',
        h1: 'Stations V’Lille à Lille',
        intro: 'Combien de vélos reste-t-il à la station la plus proche ? Cette carte affiche les '
            + 'stations V’Lille avec, pour chacune, le nombre de vélos disponibles et de places '
            + 'libres, actualisé en continu depuis le flux ouvert du service.',
        sources: [SOURCE_GBFS_LILLE],
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'V’Lille couvre Lille et plusieurs communes de la métropole, avec un maillage '
                    + 'dense autour des gares, des universités et des centres-villes de Roubaix et '
                    + 'Tourcoing. Chaque station indique les vélos disponibles et les places libres '
                    + 'au moment de la consultation.',
                    'La flotte est entièrement mécanique : contrairement à d’autres réseaux, il n’y a '
                    + 'pas de distinction entre vélos classiques et vélos à assistance électrique — '
                    + 'la fiche d’une station affiche donc un total unique.',
                ],
            },
            {
                h2: 'Quelques réflexes utiles',
                p: [
                    'Aux heures de pointe, les stations des gares et des campus se vident et se '
                    + 'remplissent par vagues : repérez deux stations d’arrivée proches l’une de '
                    + 'l’autre pour ne pas rester avec un vélo sur les bras devant une station '
                    + 'pleine.',
                    'Vérifiez l’état du vélo avant de partir — freins, pneus, selle — et signalez '
                    + 'tout défaut depuis l’application : un vélo signalé est retiré de la '
                    + 'circulation.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les disponibilités proviennent du flux GBFS public publié par Ilévia, interrogé '
                    + 'au rythme qu’il annonce. Sur une partie des stations, l’horodatage transmis '
                    + 'par le flux est figé : la fraîcheur affichée est alors celle de notre propre '
                    + 'collecte. Sécu’Cycle n’est pas affilié à l’exploitant.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien y a-t-il de stations V’Lille ?',
                a: 'Le réseau compte plus de deux cents stations sur la métropole. La carte affiche '
                    + 'celles qui sont actives au moment de la consultation.',
            },
            {
                q: 'Y a-t-il des V’Lille à assistance électrique ?',
                a: 'Non : le parc en libre-service est mécanique. Le service propose par ailleurs de '
                    + 'la location longue durée, qui ne figure pas sur cette carte.',
            },
            {
                q: 'La disponibilité affichée est-elle en temps réel ?',
                a: 'Elle provient du flux officiel du service, rafraîchi en continu. Un décalage de '
                    + 'quelques instants reste possible, en particulier aux heures de pointe.',
            },
            {
                q: 'Peut-on calculer un trajet depuis une station V’Lille ?',
                a: 'Pas encore : les disponibilités sont affichées en direct, mais la '
                    + 'métropole lilloise n’est pas desservie par le calcul d’itinéraire, qui '
                    + 'dépend d’un réseau routier chargé en mémoire sur une emprise plus '
                    + 'étroite que celle des données.',
            },
        ],
    },

    'lille/accidents-velo': {
        title: 'Accidents de vélo à Lille — carte des zones à risque',
        description: 'Carte des accidents corporels impliquant un cycliste sur la Métropole '
            + 'Européenne de Lille, issue des données officielles BAAC.',
        h1: 'Accidents de vélo à Lille',
        intro: 'Cette carte localise les accidents corporels impliquant un cycliste recensés sur la '
            + 'Métropole Européenne de Lille. Elle sert à repérer les carrefours et les axes où la '
            + 'vigilance doit être maximale, pas à décourager la pratique.',
        sources: [SOURCE_BAAC],
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Chaque point correspond à un accident corporel — ayant fait au moins un blessé — '
                    + 'enregistré par les forces de l’ordre dans le fichier BAAC. Les accidents '
                    + 'purement matériels et les chutes sans tiers impliqué n’y figurent pas.',
                    'La métropole étant polycentrique, les concentrations ne se limitent pas au '
                    + 'centre de Lille : les axes reliant les communes et les grands boulevards '
                    + 'urbains de Roubaix et Tourcoing ressortent également. Une zone dense traduit '
                    + 'd’abord un trafic élevé ; c’est la comparaison entre carrefours voisins qui '
                    + 'est instructive.',
                ],
            },
            {
                h2: 'Les configurations les plus fréquentes',
                p: [
                    'Le tourne-à-droite d’un véhicule coupant la trajectoire d’un cycliste allant '
                    + 'tout droit reste la configuration la plus fréquente, et la plus grave avec un '
                    + 'poids lourd ou un bus. L’ouverture de portière côté chaussée suit de près : '
                    + 'roulez à un mètre des véhicules stationnés, quitte à occuper franchement la '
                    + 'voie.',
                    'Deux facteurs locaux méritent attention. Le pavé, qui allonge les distances de '
                    + 'freinage et déstabilise la trajectoire, surtout mouillé. Et les rails de '
                    + 'tramway et anciennes voies, à franchir toujours perpendiculairement : une roue '
                    + 'prise dans une rainure fait tomber sans prévenir.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les données proviennent du fichier BAAC publié chaque année par l’ONISR sur '
                    + 'data.gouv.fr. Elles sont officielles mais rétrospectives, et les '
                    + 'localisations parfois approximatives.',
                ],
            },
        ],
        faq: [
            {
                q: 'Cette carte recense-t-elle tous les accidents de vélo ?',
                a: 'Non. Seuls les accidents corporels ayant donné lieu à un procès-verbal des forces '
                    + 'de l’ordre entrent dans le fichier BAAC.',
            },
            {
                q: 'Les données sont-elles à jour ?',
                a: 'Elles suivent le calendrier de publication de l’ONISR : le dernier millésime '
                    + 'disponible porte sur une année révolue.',
            },
            {
                q: 'Comment franchir des pavés ou des rails en sécurité ?',
                a: 'Sur pavés, allégez le poids sur les mains, gardez les bras souples et freinez '
                    + 'plus tôt, surtout par temps humide. Les rails se franchissent toujours à '
                    + 'angle droit : les aborder en biais est la cause classique de la chute.',
            },
            {
                q: 'Ces accidents pèsent-ils sur les itinéraires proposés à Lille ?',
                a: 'Pas pour l’instant : le calcul d’itinéraire ne couvre pas encore la '
                    + 'métropole lilloise. Là où il fonctionne, cette couche pèse dans le '
                    + 'score de sécurité et fait préférer une rue parallèle à un axe '
                    + 'accidentogène.',
            },
        ],
    },

    'lille/reparation-velo': {
        title: 'Réparer son vélo à Lille — ateliers et stations de gonflage',
        description: 'Carte des ateliers de réparation, vélocistes et stations de gonflage en libre '
            + 'accès sur la Métropole Européenne de Lille.',
        h1: 'Réparation de vélo à Lille',
        intro: 'Une chambre à air à changer, une roue voilée, un pneu à regonfler : cette carte '
            + 'recense les ateliers, les vélocistes et les stations de gonflage en libre accès de la '
            + 'métropole lilloise.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Trois types de points cohabitent : les vélocistes et ateliers professionnels, '
                    + 'les ateliers associatifs d’auto-réparation où l’on répare soi-même avec '
                    + 'l’outillage et les conseils du lieu, et les stations de gonflage installées '
                    + 'sur l’espace public.',
                    'Les horaires ne sont pas toujours renseignés, et un atelier associatif n’ouvre '
                    + 'souvent que quelques après-midi par semaine : mieux vaut vérifier avant de se '
                    + 'déplacer avec un vélo en panne.',
                ],
            },
            {
                h2: 'Les roues, point faible local',
                p: [
                    'Rouler quotidiennement sur pavés met les roues à l’épreuve : rayons qui se '
                    + 'détendent, jantes qui se voilent, pneus qui s’usent plus vite. Un rayon cassé '
                    + 'ou une jante voilée se rattrapent en atelier tant qu’on s’y prend tôt ; une '
                    + 'roue laissée en l’état finit par ne plus se rattraper du tout.',
                    'Une crevaison, un frein à régler ou une chaîne à lubrifier restent à la portée '
                    + 'de tous. Confiez en revanche à un professionnel la fourche, le cadre, la '
                    + 'direction et le système électrique d’un vélo à assistance.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les emplacements proviennent d’OpenStreetMap, resynchronisés automatiquement. Un '
                    + 'atelier récent peut manquer, un commerce fermé subsister quelque temps.',
                ],
            },
        ],
        faq: [
            {
                q: 'Où gonfler ses pneus gratuitement à Lille ?',
                a: 'Les stations de gonflage en libre accès installées sur l’espace public '
                    + 'apparaissent sur cette carte. Beaucoup de vélocistes dépannent également un '
                    + 'cycliste de passage.',
            },
            {
                q: 'Qu’est-ce qu’un atelier d’auto-réparation ?',
                a: 'Un lieu, le plus souvent associatif, qui met à disposition outillage, pièces '
                    + 'd’occasion et conseils pour que vous répariez vous-même votre vélo, en général '
                    + 'contre une adhésion modique.',
            },
            {
                q: 'À quelle fréquence entretenir son vélo sur pavés ?',
                a: 'Plus souvent qu’ailleurs. Un contrôle mensuel des rayons, du voile de roue et de '
                    + 'la pression des pneus évite la plupart des dégâts durables : un pneu sous-gonflé '
                    + 'sur pavés abîme la jante et pince la chambre à air.',
            },
            {
                q: 'Sécu’Cycle peut-il me conduire jusqu’à un atelier ?',
                a: 'Pas à Lille : le calcul d’itinéraire ne couvre pas encore la métropole. '
                    + 'La carte donne les adresses, ce qui suffit à repérer le point de '
                    + 'gonflage le plus proche quand un pavé a eu raison d’un pneu.',
            },
        ],
    },
    'strasbourg/stationnements-velo': {
        title: 'Stationnements vélo à Strasbourg — carte des arceaux',
        description: 'Carte interactive des stationnements vélo de l’Eurométropole de Strasbourg : '
            + 'arceaux, abris, consignes sécurisées et places déclarées.',
        h1: 'Stationnements vélo à Strasbourg',
        intro: 'Où attacher son vélo à Strasbourg ? Cette carte recense les arceaux, râteliers, '
            + 'abris et consignes des 33 communes de l’Eurométropole, de la Grande Île aux communes '
            + 'de la deuxième couronne.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Strasbourg est la ville française où la part du vélo dans les déplacements est '
                    + 'la plus élevée, et cela se lit dans la densité du stationnement : les arceaux '
                    + 'y sont installés en nombre, y compris en dehors de l’hypercentre. Ce sont les '
                    + 'seuls équipements permettant d’attacher le cadre et une roue avec un antivol '
                    + 'en U.',
                    'Les abris et consignes fermées apparaissent séparément. On les trouve notamment '
                    + 'autour de la gare centrale et des pôles d’échange du tramway, où le '
                    + 'stationnement de longue durée est le plus demandé — au point que la saturation '
                    + 'y est fréquente aux heures de bureau.',
                ],
            },
            {
                h2: 'Stationner dans une ville très cyclable',
                p: [
                    'Le revers d’une pratique massive est un nombre de vols élevé en valeur absolue. '
                    + 'Les règles habituelles n’en sont que plus utiles : antivol en U certifié, '
                    + 'cadre attaché à un point fixe, jamais la roue seule, et emplacement fréquenté '
                    + 'plutôt qu’un recoin.',
                    'Sur la Grande Île, les arceaux sont souvent pleins aux heures de pointe. Plutôt '
                    + 'que d’attacher son vélo à une grille ou à un mobilier urbain, où il gêne et '
                    + 'où il est vulnérable, la carte permet de repérer un emplacement libre à une '
                    + 'ou deux rues de là.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Le recensement provient d’OpenStreetMap et est resynchronisé automatiquement. '
                    + 'La couverture strasbourgeoise est l’une des meilleures de France, la '
                    + 'communauté de contributeurs y étant particulièrement active. Toute correction '
                    + 'apportée sur OpenStreetMap se retrouve ici après la synchronisation suivante.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien y a-t-il de stationnements vélo à Strasbourg ?',
                a: 'Le compteur en tête de carte affiche le total recensé sur les 33 communes de '
                    + 'l’Eurométropole au moment où vous consultez la page, ainsi que le nombre de '
                    + 'places déclarées lorsque l’information existe.',
            },
            {
                q: 'Où trouver un parking à vélo sécurisé à Strasbourg ?',
                a: 'Les abris fermés et consignes apparaissent dans la catégorie « Abris et '
                    + 'consignes », principalement autour de la gare et des pôles d’échange. L’accès '
                    + 'se fait généralement sur abonnement.',
            },
            {
                q: 'Peut-on attacher son vélo n’importe où dans le centre ?',
                a: 'Le stationnement sur mobilier urbain est toléré tant qu’il ne gêne pas le '
                    + 'passage, mais il est déconseillé : une grille se scie et un poteau se démonte. '
                    + 'Mieux vaut chercher un arceau libre à proximité, ce que cette carte permet de '
                    + 'faire.',
            },
            {
                q: 'Peut-on demander un itinéraire jusqu’à ces stationnements ?',
                a: 'Pas encore dans l’Eurométropole. Le calcul de trajet s’appuie sur un '
                    + 'réseau routier chargé en mémoire par notre serveur, qui ne couvre pas '
                    + 'Strasbourg pour l’instant ; les données de cette carte, elles, sont '
                    + 'bien synchronisées. Les villes navigables sont listées sur la page '
                    + 'Cartes.',
            },
        ],
    },

    'strasbourg/toilettes-publiques': {
        title: 'Toilettes publiques à Strasbourg — carte interactive',
        description: 'Carte des toilettes publiques de Strasbourg et de l’Eurométropole : '
            + 'sanitaires gratuits, payants et accessibles en fauteuil roulant.',
        h1: 'Toilettes publiques à Strasbourg',
        intro: 'Cette carte localise les toilettes publiques recensées sur l’Eurométropole de '
            + 'Strasbourg, en distinguant les sanitaires gratuits des sanitaires payants et en '
            + 'signalant ceux qui sont accessibles en fauteuil roulant.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Les sanitaires de voirie côtoient ceux des parcs — l’Orangerie, le parc de la '
                    + 'Citadelle, les jardins des Deux Rives — et des équipements publics. Sur la '
                    + 'Grande Île, très fréquentée, l’offre est concentrée sur quelques points qu’il '
                    + 'vaut mieux connaître à l’avance.',
                    'Beaucoup de sanitaires de parcs ferment avec eux, plus tôt en hiver. Les '
                    + 'horaires apparaissent dans la fiche de l’emplacement lorsqu’ils sont '
                    + 'renseignés.',
                ],
            },
            {
                h2: 'Accessibilité',
                p: [
                    'Les toilettes signalées comme accessibles disposent d’un espace de rotation et '
                    + 'de barres d’appui. L’information provient des relevés OpenStreetMap et manque '
                    + 'sur une partie des équipements : l’absence de mention ne signifie pas '
                    + 'l’absence d’accessibilité.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les emplacements proviennent d’OpenStreetMap, resynchronisés automatiquement. Un '
                    + 'sanitaire fermé pour travaux peut rester affiché quelque temps.',
                ],
            },
        ],
        faq: [
            {
                q: 'Les toilettes publiques sont-elles gratuites à Strasbourg ?',
                a: 'La majorité des sanitaires de voirie recensés sont gratuits. Certains '
                    + 'équipements, notamment en gare, restent payants : la carte distingue les deux '
                    + 'lorsque l’information est renseignée.',
            },
            {
                q: 'Y a-t-il des toilettes dans les parcs strasbourgeois ?',
                a: 'Oui, les grands parcs en sont équipés. Ils suivent en revanche les horaires '
                    + 'd’ouverture des espaces verts, plus restreints en hiver.',
            },
            {
                q: 'Comment trouver les toilettes les plus proches à vélo ?',
                a: 'Zoomez sur votre position : la carte affiche les sanitaires recensés autour de '
                    + 'vous. La Grande Île et les abords des parcs sont les mieux pourvus.',
            },
            {
                q: 'Ces sanitaires s’affichent-ils pendant un calcul d’itinéraire ?',
                a: 'Pas à Strasbourg : la navigation ne couvre pas encore l’Eurométropole. La '
                    + 'carte se consulte pour elle-même, ce qui reste le plus utile avant une '
                    + 'sortie le long de l’Ill.',
            },
        ],
    },

    'strasbourg/points-eau': {
        title: 'Points d’eau potable à Strasbourg — carte des fontaines',
        description: 'Carte des fontaines à boire et points d’eau potable de Strasbourg et de '
            + 'l’Eurométropole, pour remplir sa gourde à vélo.',
        h1: 'Points d’eau potable à Strasbourg',
        intro: 'Où remplir sa gourde à Strasbourg ? Cette carte recense les fontaines à boire et '
            + 'points d’eau potable librement accessibles sur l’Eurométropole, des places de la '
            + 'Grande Île aux parcs de l’agglomération.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Les fontaines se répartissent entre les places du centre, les parcs et les '
                    + 'itinéraires de promenade le long de l’Ill et des canaux. Ces derniers '
                    + 'constituent l’ossature des trajets de loisir, et c’est là que le '
                    + 'ravitaillement est le plus utile.',
                    'Une partie du réseau est coupée l’hiver pour éviter le gel : la carte affiche '
                    + 'l’équipement toute l’année, sans indiquer sa période de fermeture.',
                ],
            },
            {
                h2: 'Bien s’hydrater à vélo',
                p: [
                    'Strasbourg connaît des étés chauds et des trajets quotidiens souvent plus longs '
                    + 'qu’ailleurs, la pratique dépassant largement le centre-ville. Repérez un ou '
                    + 'deux points d’eau sur les itinéraires que vous répétez, surtout si vous '
                    + 'rejoignez la deuxième couronne.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les emplacements proviennent d’OpenStreetMap, resynchronisés automatiquement. '
                    + 'Une fontaine hors service ou coupée pour la saison reste affichée : la donnée '
                    + 'décrit l’équipement, pas son état du jour.',
                ],
            },
        ],
        faq: [
            {
                q: 'L’eau de ces fontaines est-elle potable ?',
                a: 'Oui. Seuls les points délivrant de l’eau potable sont affichés ; ceux renseignés '
                    + 'comme non potables dans les données sont écartés.',
            },
            {
                q: 'Les fontaines fonctionnent-elles toute l’année ?',
                a: 'Une partie du réseau est fermée pendant les mois froids pour éviter le gel des '
                    + 'canalisations.',
            },
            {
                q: 'Un point d’eau manque sur la carte, comment le signaler ?',
                a: 'Les données proviennent d’OpenStreetMap : ajoutez-le sur openstreetmap.org, il '
                    + 'sera repris à la synchronisation suivante. Vous pouvez aussi nous écrire via '
                    + 'la page Contact.',
            },
            {
                q: 'Le calculateur peut-il faire passer mon trajet par une fontaine ?',
                a: 'Pas encore à Strasbourg, où le calcul d’itinéraire n’est pas disponible : '
                    + 'il dépend d’un réseau routier chargé pour une emprise plus étroite que '
                    + 'celle des données affichées ici.',
            },
        ],
    },

    'strasbourg/velos-libre-service': {
        title: 'Stations Vélhop à Strasbourg — disponibilité en temps réel',
        description: 'Carte des stations Vélhop en temps réel : vélos disponibles et places libres, '
            + 'station par station sur l’Eurométropole de Strasbourg.',
        h1: 'Stations Vélhop à Strasbourg',
        intro: 'Combien de vélos reste-t-il à la station la plus proche ? Cette carte affiche les '
            + 'stations Vélhop avec, pour chacune, le nombre de vélos disponibles et de places '
            + 'libres, actualisé en continu depuis le flux ouvert du service.',
        sources: [SOURCE_GBFS_STRASBOURG],
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Vélhop se distingue des autres réseaux du site : au-delà des stations en '
                    + 'libre-service, le service repose largement sur la location de moyenne et '
                    + 'longue durée, en boutique. Cette carte n’affiche que les stations, seules '
                    + 'données publiées en temps réel.',
                    'Chaque station indique les vélos disponibles et les places libres au moment de '
                    + 'la consultation. Le flux publie également des vélos hors station, que cette '
                    + 'carte n’affiche pas : la couche est volontairement limitée aux emplacements '
                    + 'fixes, plus fiables à repérer.',
                ],
            },
            {
                h2: 'Quelques réflexes utiles',
                p: [
                    'Autour de la gare et du campus, les stations se vident et se remplissent par '
                    + 'vagues aux heures de pointe : repérez deux stations d’arrivée proches l’une '
                    + 'de l’autre. Une station affichée à zéro l’est réellement.',
                    'Vérifiez l’état du vélo avant de partir — freins, pneus, éclairage — et signalez '
                    + 'tout défaut à l’exploitant. L’éclairage compte particulièrement ici : les '
                    + 'trajets d’hiver se font largement de nuit.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les disponibilités proviennent du flux GBFS public du service, hébergé sur '
                    + 'l’infrastructure nextbike et interrogé au rythme qu’il annonce. Sécu’Cycle '
                    + 'n’est pas affilié à l’exploitant.',
                ],
            },
        ],
        faq: [
            {
                q: 'Vélhop est-il un service en libre-service ou de la location ?',
                a: 'Les deux. Des stations en libre-service permettent des trajets ponctuels, et des '
                    + 'boutiques proposent de la location de moyenne et longue durée. Seules les '
                    + 'stations figurent sur cette carte.',
            },
            {
                q: 'La disponibilité affichée est-elle en temps réel ?',
                a: 'Elle provient du flux officiel du service, rafraîchi en continu. Un décalage de '
                    + 'quelques instants reste possible.',
            },
            {
                q: 'Peut-on passer en Allemagne avec un vélo du service ?',
                a: 'Les conditions d’utilisation relèvent de l’exploitant, à qui il faut se référer. '
                    + 'La passerelle des Deux Rives et le pont de l’Europe permettent en tout cas de '
                    + 'rejoindre Kehl à vélo en quelques minutes depuis le centre.',
            },
            {
                q: 'Sécu’Cycle propose-t-il un itinéraire depuis une station Vélhop ?',
                a: 'Pas encore : les stations et leurs disponibilités sont affichées, mais '
                    + 'l’Eurométropole n’est pas desservie par le calcul d’itinéraire, faute '
                    + 'de réseau routier chargé pour cette emprise.',
            },
        ],
    },

    'strasbourg/accidents-velo': {
        title: 'Accidents de vélo à Strasbourg — carte des zones à risque',
        description: 'Carte des accidents corporels impliquant un cycliste sur l’Eurométropole de '
            + 'Strasbourg, issue des données officielles BAAC.',
        h1: 'Accidents de vélo à Strasbourg',
        intro: 'Cette carte localise les accidents corporels impliquant un cycliste recensés sur '
            + 'l’Eurométropole de Strasbourg. Elle sert à repérer les carrefours et les axes où la '
            + 'vigilance doit être maximale, pas à décourager la pratique.',
        sources: [SOURCE_BAAC],
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Chaque point correspond à un accident corporel — ayant fait au moins un blessé — '
                    + 'enregistré par les forces de l’ordre dans le fichier BAAC. Les accidents '
                    + 'purement matériels et les chutes sans tiers impliqué n’y figurent pas.',
                    'Strasbourg illustre bien la limite de lecture de ce type de carte : c’est la '
                    + 'ville française où l’on pédale le plus, donc celle où le nombre absolu '
                    + 'd’accidents impliquant un cycliste est mécaniquement élevé, sans que le '
                    + 'risque par kilomètre parcouru le soit. C’est la comparaison entre carrefours '
                    + 'voisins qui est instructive, pas le total.',
                ],
            },
            {
                h2: 'Les configurations les plus fréquentes',
                p: [
                    'Le tourne-à-droite d’un véhicule coupant la trajectoire d’un cycliste allant '
                    + 'tout droit reste la configuration la plus fréquente, et la plus grave avec un '
                    + 'poids lourd ou un tramway. L’ouverture de portière côté chaussée suit de '
                    + 'près : roulez à un mètre des véhicules stationnés.',
                    'Deux facteurs locaux comptent. Les rails de tramway, omniprésents, se '
                    + 'franchissent impérativement à angle droit : une roue prise dans la rainure '
                    + 'fait tomber sans prévenir. Et les intersections entre pistes cyclables et '
                    + 'voies motorisées, très nombreuses dans une ville aussi aménagée, demandent de '
                    + 'ne jamais présumer que l’on a été vu, même sur un aménagement prioritaire.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les données proviennent du fichier BAAC publié chaque année par l’ONISR sur '
                    + 'data.gouv.fr. Elles sont officielles mais rétrospectives, et les '
                    + 'localisations parfois approximatives.',
                ],
            },
        ],
        faq: [
            {
                q: 'Cette carte recense-t-elle tous les accidents de vélo ?',
                a: 'Non. Seuls les accidents corporels ayant donné lieu à un procès-verbal des forces '
                    + 'de l’ordre entrent dans le fichier BAAC.',
            },
            {
                q: 'Comment franchir des rails de tramway en sécurité ?',
                a: 'Toujours perpendiculairement, en se déportant si nécessaire pour aborder le rail '
                    + 'à angle droit, et sans freiner sur le rail lui-même — particulièrement '
                    + 'glissant par temps humide.',
            },
            {
                q: 'Rouler à Strasbourg est-il dangereux ?',
                a: 'C’est au contraire l’une des villes françaises où la pratique est la plus '
                    + 'sécurisée, précisément parce que les cyclistes y sont nombreux et attendus. '
                    + 'Le nombre d’accidents suit le nombre d’usagers, pas le niveau de risque '
                    + 'individuel.',
            },
            {
                q: 'Ces accidents influencent-ils les itinéraires proposés à Strasbourg ?',
                a: 'Pas encore : le calcul d’itinéraire ne couvre pas l’Eurométropole. '
                    + 'Ailleurs, la couche pèse dans le score de sécurité ; ici, elle sert à '
                    + 'repérer soi-même les carrefours et les traversées de rails à aborder '
                    + 'avec prudence.',
            },
        ],
    },

    'strasbourg/reparation-velo': {
        title: 'Réparer son vélo à Strasbourg — ateliers et gonflage',
        description: 'Carte des ateliers de réparation, vélocistes et stations de gonflage en libre '
            + 'accès sur l’Eurométropole de Strasbourg.',
        h1: 'Réparation de vélo à Strasbourg',
        intro: 'Une chambre à air à changer, un dérailleur qui saute, un pneu à regonfler : cette '
            + 'carte recense les ateliers, les vélocistes et les stations de gonflage en libre accès '
            + 'de l’Eurométropole.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Trois types de points cohabitent : les vélocistes et ateliers professionnels, '
                    + 'nombreux dans une ville où le vélo est un mode de transport principal, les '
                    + 'ateliers associatifs d’auto-réparation, et les stations de gonflage '
                    + 'installées sur l’espace public.',
                    'Les horaires ne sont pas toujours renseignés, et un atelier associatif n’ouvre '
                    + 'souvent que quelques après-midi par semaine : mieux vaut vérifier avant de se '
                    + 'déplacer avec un vélo en panne.',
                ],
            },
            {
                h2: 'Rouler toute l’année',
                p: [
                    'À Strasbourg, on pédale aussi l’hiver, et c’est ce qui use le matériel : sel de '
                    + 'déneigement sur la chaîne et les câbles, humidité dans les gaines, éclairage '
                    + 'sollicité tous les jours. Un nettoyage et un graissage de chaîne après les '
                    + 'périodes de salage prolongent nettement la transmission.',
                    'Une crevaison, un frein à régler ou un éclairage à remplacer restent à la portée '
                    + 'de tous. Confiez à un professionnel la fourche, le cadre, la direction et le '
                    + 'système électrique d’un vélo à assistance.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les emplacements proviennent d’OpenStreetMap, resynchronisés automatiquement. Un '
                    + 'atelier récent peut manquer, un commerce fermé subsister quelque temps.',
                ],
            },
        ],
        faq: [
            {
                q: 'Où gonfler ses pneus gratuitement à Strasbourg ?',
                a: 'Les stations de gonflage en libre accès installées sur l’espace public '
                    + 'apparaissent sur cette carte. Beaucoup de vélocistes dépannent également un '
                    + 'cycliste de passage.',
            },
            {
                q: 'Qu’est-ce qu’un atelier d’auto-réparation ?',
                a: 'Un lieu, le plus souvent associatif, qui met à disposition outillage, pièces '
                    + 'd’occasion et conseils pour que vous répariez vous-même votre vélo.',
            },
            {
                q: 'Comment protéger son vélo en hiver ?',
                a: 'Rincez la transmission après les épisodes de salage, graissez la chaîne, '
                    + 'vérifiez l’éclairage avant chaque sortie nocturne et surveillez la pression '
                    + 'des pneus, qui baisse avec le froid.',
            },
            {
                q: 'Puis-je me faire guider jusqu’à l’atelier le plus proche ?',
                a: 'Pas depuis Sécu’Cycle à Strasbourg, la navigation n’y étant pas encore '
                    + 'disponible. La carte donne les adresses des ateliers et des stations '
                    + 'de gonflage, utiles après un hiver de sel et de gravillons.',
            },
        ],
    },
    'bruxelles/stationnements-velo': {
        title: 'Stationnements vélo à Bruxelles — carte des arceaux et abris',
        description: 'Carte interactive des stationnements vélo des 19 communes de '
            + 'Bruxelles-Capitale : arceaux, abris, box et places déclarées.',
        h1: 'Stationnements vélo à Bruxelles',
        intro: 'Où attacher son vélo à Bruxelles ? Cette carte recense les arceaux, râteliers, '
            + 'abris et box des 19 communes de la Région de Bruxelles-Capitale, du Pentagone à '
            + 'Uccle et de Molenbeek à Woluwe-Saint-Pierre.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Chaque point correspond à un emplacement relevé sur le terrain par les '
                    + 'contributeurs OpenStreetMap. Les arceaux dominent : ce sont les seuls '
                    + 'équipements permettant d’attacher le cadre et une roue avec un antivol en U. '
                    + 'La Région a fortement densifié le stationnement de voirie ces dernières '
                    + 'années, souvent en remplacement de places automobiles.',
                    'Les abris et box fermés apparaissent séparément. À Bruxelles, ils prennent '
                    + 'souvent la forme de box de rue installés dans les quartiers résidentiels, où '
                    + 'les logements anciens n’offrent aucun rangement, ainsi que de parkings vélo '
                    + 'aux abords des gares.',
                ],
            },
            {
                h2: 'Stationner à Bruxelles',
                p: [
                    'Le vol de vélo est fréquent dans la capitale, en particulier autour des gares et '
                    + 'des quartiers de sortie. Antivol en U certifié, cadre attaché à un point fixe, '
                    + 'jamais la roue seule, et emplacement passant et éclairé : les règles '
                    + 'habituelles s’appliquent avec d’autant plus de rigueur.',
                    'Le relief mérite une attention particulière. Entre le bas de la ville et les '
                    + 'hauteurs d’Ixelles ou de Saint-Gilles, les rues en pente sont nombreuses : '
                    + 'un vélo attaché en travers d’une pente forte finit souvent au sol. Calez la '
                    + 'roue avant contre la bordure.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Le recensement provient d’OpenStreetMap et est resynchronisé automatiquement. La '
                    + 'communauté belge de contributeurs est très active, et la couverture '
                    + 'bruxelloise particulièrement bonne. Toute correction apportée sur '
                    + 'OpenStreetMap se retrouve ici après la synchronisation suivante.',
                ],
            },
        ],
        faq: [
            {
                q: 'Combien y a-t-il de stationnements vélo à Bruxelles ?',
                a: 'Le compteur en tête de carte affiche le total recensé sur les 19 communes au '
                    + 'moment où vous consultez la page, ainsi que le nombre de places déclarées '
                    + 'lorsque l’information existe.',
            },
            {
                q: 'Qu’est-ce qu’un box vélo bruxellois ?',
                a: 'Un abri fermé installé sur la voirie, mutualisé entre riverains sur inscription '
                    + 'auprès de la commune ou de la Région. Il apparaît sur la carte dans la '
                    + 'catégorie « Abris et consignes ».',
            },
            {
                q: 'Quelle est la différence entre un arceau et un râtelier ?',
                a: 'Un arceau est un tube en U inversé auquel on attache le cadre et une roue : c’est '
                    + 'le dispositif recommandé. Un râtelier ne retient que la roue avant, ce qui '
                    + 'protège mal du vol et peut voiler la jante.',
            },
            {
                q: 'Sécu’Cycle calcule-t-il un itinéraire jusqu’à ces stationnements ?',
                a: 'Pas encore en Région bruxelloise. Le calcul de trajet exige un réseau '
                    + 'routier chargé en mémoire par le serveur, dont l’emprise est plus '
                    + 'étroite que celle des données : côté belge, seule la région de Tournai '
                    + 'est navigable aujourd’hui.',
            },
        ],
    },

    'bruxelles/toilettes-publiques': {
        title: 'Toilettes publiques à Bruxelles — carte interactive',
        description: 'Carte des toilettes publiques des 19 communes de Bruxelles-Capitale : '
            + 'sanitaires gratuits, payants et accessibles en fauteuil roulant.',
        h1: 'Toilettes publiques à Bruxelles',
        intro: 'Cette carte localise les toilettes publiques recensées dans les 19 communes de la '
            + 'Région de Bruxelles-Capitale, en distinguant les sanitaires gratuits des sanitaires '
            + 'payants et en signalant ceux qui sont accessibles en fauteuil roulant.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'L’offre bruxelloise mêle sanitaires de voirie, toilettes de parcs — Bois de la '
                    + 'Cambre, parc du Cinquantenaire, parc Josaphat — et équipements de gares. Une '
                    + 'partie des sanitaires du centre est payante, usage courant en Belgique, y '
                    + 'compris dans certains lieux publics.',
                    'Beaucoup de sanitaires de parcs ferment avec eux, plus tôt en hiver. Les '
                    + 'horaires apparaissent dans la fiche de l’emplacement lorsqu’ils sont '
                    + 'renseignés dans les données.',
                ],
            },
            {
                h2: 'Accessibilité',
                p: [
                    'Les toilettes signalées comme accessibles disposent d’un espace de rotation et '
                    + 'de barres d’appui. L’information provient des relevés OpenStreetMap et manque '
                    + 'sur une partie des équipements : l’absence de mention ne signifie pas '
                    + 'l’absence d’accessibilité.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les emplacements proviennent d’OpenStreetMap, resynchronisés automatiquement. Un '
                    + 'sanitaire fermé pour travaux peut rester affiché quelque temps.',
                ],
            },
        ],
        faq: [
            {
                q: 'Les toilettes publiques sont-elles payantes à Bruxelles ?',
                a: 'Une partie l’est, en particulier dans le centre et les gares — l’usage est '
                    + 'courant en Belgique. La carte distingue les sanitaires gratuits des '
                    + 'sanitaires payants lorsque l’information est renseignée.',
            },
            {
                q: 'Y a-t-il des toilettes dans les parcs bruxellois ?',
                a: 'Les grands parcs en sont équipés, avec des horaires calés sur ceux des espaces '
                    + 'verts, plus restreints en hiver.',
            },
            {
                q: 'Comment trouver les toilettes les plus proches à vélo ?',
                a: 'Zoomez sur votre position : la carte affiche les sanitaires recensés autour de '
                    + 'vous. Les parcs et les pôles d’échange sont les mieux pourvus.',
            },
            {
                q: 'Ces toilettes apparaissent-elles pendant un calcul d’itinéraire ?',
                a: 'Pas à Bruxelles : la navigation ne couvre pas encore la Région de '
                    + 'Bruxelles-Capitale. La carte se consulte seule, avant de partir.',
            },
        ],
    },

    'bruxelles/points-eau': {
        title: 'Points d’eau potable à Bruxelles — carte des fontaines',
        description: 'Carte des fontaines à boire et points d’eau potable des 19 communes de '
            + 'Bruxelles-Capitale, pour remplir sa gourde à vélo.',
        h1: 'Points d’eau potable à Bruxelles',
        intro: 'Où remplir sa gourde à Bruxelles ? Cette carte recense les fontaines à boire et '
            + 'points d’eau potable librement accessibles dans les 19 communes de la Région, des '
            + 'places du centre aux grands parcs.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Les fontaines bruxelloises se concentrent dans les parcs et sur les places. La '
                    + 'Région a installé ces dernières années des fontaines à boire supplémentaires '
                    + 'sur l’espace public, notamment le long des axes de promenade et près des '
                    + 'aires de jeux.',
                    'Une partie du réseau est coupée l’hiver pour éviter le gel : la carte affiche '
                    + 'l’équipement toute l’année, sans indiquer sa période de fermeture.',
                ],
            },
            {
                h2: 'Bien s’hydrater à vélo',
                p: [
                    'Le relief bruxellois se fait sentir dès qu’on quitte la vallée de la Senne : '
                    + 'remonter vers Ixelles, Uccle ou Woluwe demande un effort réel, même sur un '
                    + 'trajet court. Repérez un ou deux points d’eau sur les itinéraires que vous '
                    + 'répétez, en particulier si vous rentrez par les hauteurs.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les emplacements proviennent d’OpenStreetMap, resynchronisés automatiquement. '
                    + 'Une fontaine hors service ou coupée pour la saison reste affichée : la donnée '
                    + 'décrit l’équipement, pas son état du jour.',
                ],
            },
        ],
        faq: [
            {
                q: 'L’eau de ces fontaines est-elle potable ?',
                a: 'Oui. Seuls les points délivrant de l’eau potable sont affichés ; ceux renseignés '
                    + 'comme non potables dans les données sont écartés.',
            },
            {
                q: 'Les fontaines fonctionnent-elles toute l’année ?',
                a: 'Une partie du réseau est fermée pendant les mois froids pour éviter le gel des '
                    + 'canalisations.',
            },
            {
                q: 'Un point d’eau manque sur la carte, comment le signaler ?',
                a: 'Les données proviennent d’OpenStreetMap : ajoutez-le sur openstreetmap.org, il '
                    + 'sera repris à la synchronisation suivante. Vous pouvez aussi nous écrire via '
                    + 'la page Contact.',
            },
            {
                q: 'Puis-je faire passer mon itinéraire par ces points d’eau ?',
                a: 'Pas encore à Bruxelles, où le calcul d’itinéraire n’est pas disponible : '
                    + 'il repose sur un réseau routier chargé pour une emprise plus '
                    + 'restreinte que celle des données. Sur une ville en pente, repérer un '
                    + 'point de remplissage à l’avance a d’autant plus d’intérêt.',
            },
        ],
    },

    'bruxelles/velos-libre-service': {
        title: 'Stations Villo! à Bruxelles — disponibilité en temps réel',
        description: 'Carte des stations Villo! et Blue-bike en temps réel : vélos disponibles et '
            + 'places libres, station par station à Bruxelles.',
        h1: 'Stations de vélos en libre-service à Bruxelles',
        intro: 'Combien de vélos reste-t-il à la station la plus proche ? Cette carte affiche les '
            + 'stations Villo! et les points Blue-bike de la Région bruxelloise, avec le nombre de '
            + 'vélos disponibles et de places libres, actualisé en continu.',
        sources: [SOURCE_GBFS_BRUXELLES, SOURCE_GBFS_BLUEBIKE],
        sections: [
            {
                h2: 'Deux services, deux usages',
                p: [
                    'Villo! est le système de vélos en libre-service de la Région : des stations '
                    + 'réparties dans les 19 communes, pour des trajets ponctuels de quelques '
                    + 'minutes. Sa flotte est aujourd’hui très largement électrifiée, ce qui change '
                    + 'beaucoup l’équation dans une ville aussi vallonnée.',
                    'Blue-bike répond à un autre besoin : ses points se trouvent en gare et servent '
                    + 'le dernier kilomètre après un trajet en train, sur réservation et pour une '
                    + 'durée plus longue. Les deux réseaux apparaissent ensemble sur la carte, '
                    + 'chacun identifié dans sa fiche.',
                ],
            },
            {
                h2: 'Quelques réflexes utiles',
                p: [
                    'Le relief pèse sur la disponibilité : les stations du bas de la ville se '
                    + 'remplissent, celles des hauteurs se vident. L’assistance électrique atténue '
                    + 'le phénomène sans le supprimer, et il reste plus facile de trouver un vélo en '
                    + 'bas qu’en haut.',
                    'Une station affichée à zéro vélo ou à zéro place libre l’est réellement : visez '
                    + 'une station voisine plutôt que de vous déplacer pour rien. Vérifiez freins et '
                    + 'pneus avant de partir, et signalez tout défaut à l’exploitant.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les disponibilités proviennent des flux GBFS publics des deux services, '
                    + 'interrogés au rythme qu’ils annoncent. Sur une partie des points Blue-bike, '
                    + 'l’horodatage transmis est figé : la fraîcheur affichée est alors celle de '
                    + 'notre propre collecte. Sécu’Cycle n’est affilié à aucun des deux exploitants.',
                ],
            },
        ],
        faq: [
            {
                q: 'Quelle différence entre Villo! et Blue-bike ?',
                a: 'Villo! est un service de vélos en libre-service en station, pour des trajets '
                    + 'courts dans la Région. Blue-bike est un service de location en gare, sur '
                    + 'réservation, pensé pour le dernier kilomètre après le train.',
            },
            {
                q: 'Les Villo! sont-ils électriques ?',
                a: 'La flotte est aujourd’hui très largement électrifiée. La fiche de chaque station '
                    + 'détaille la répartition entre vélos mécaniques et électriques lorsque le flux '
                    + 'la publie.',
            },
            {
                q: 'La disponibilité affichée est-elle en temps réel ?',
                a: 'Elle provient des flux officiels des services, rafraîchis en continu. Un décalage '
                    + 'de quelques instants reste possible, en particulier aux heures de pointe.',
            },
            {
                q: 'Peut-on calculer un trajet depuis une station Villo! ?',
                a: 'Pas encore : les disponibilités Villo! et Blue-bike sont affichées en '
                    + 'direct, mais la Région bruxelloise n’est pas desservie par le calcul '
                    + 'd’itinéraire, faute de réseau routier chargé pour cette emprise.',
            },
        ],
    },

    'bruxelles/accidents-velo': {
        title: 'Accidents de vélo à Bruxelles — carte des zones à risque',
        description: 'Carte des accidents corporels impliquant un cycliste dans les 19 communes de '
            + 'Bruxelles-Capitale, issue des données officielles de Statbel.',
        h1: 'Accidents de vélo à Bruxelles',
        intro: 'Cette carte localise les accidents corporels impliquant un cycliste recensés dans la '
            + 'Région de Bruxelles-Capitale. Elle sert à repérer les carrefours et les axes où la '
            + 'vigilance doit être maximale, pas à décourager la pratique.',
        sources: [SOURCE_STATBEL],
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Chaque point correspond à un accident corporel enregistré par la police et '
                    + 'publié par Statbel, l’office belge de statistique. Comme pour les données '
                    + 'françaises, les accidents purement matériels et les chutes sans tiers '
                    + 'impliqué n’y figurent pas.',
                    'Les concentrations apparaissent sur les grands axes de pénétration, autour de la '
                    + 'petite ceinture et aux carrefours à forte circulation. Une zone dense traduit '
                    + 'd’abord un trafic élevé : c’est la comparaison entre carrefours voisins qui '
                    + 'est instructive, pas le total.',
                ],
            },
            {
                h2: 'Les configurations les plus fréquentes',
                p: [
                    'Le tourne-à-droite d’un véhicule coupant la trajectoire d’un cycliste allant '
                    + 'tout droit reste la configuration la plus fréquente, et la plus grave avec un '
                    + 'poids lourd, un bus ou un tram. L’ouverture de portière côté chaussée suit de '
                    + 'près : roulez à un mètre des véhicules stationnés.',
                    'Trois facteurs locaux méritent attention. Les rails de tram, à franchir toujours '
                    + 'à angle droit. Les pavés, glissants et déstabilisants par temps humide. Et les '
                    + 'descentes, rapides depuis les hauteurs, où la vitesse d’un cycliste est '
                    + 'régulièrement sous-estimée par les automobilistes qui s’insèrent.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les données proviennent des statistiques d’accidents de la circulation publiées '
                    + 'par Statbel. Elles sont officielles mais rétrospectives, et les localisations '
                    + 'parfois approximatives, un accident pouvant être rattaché à l’axe plutôt qu’au '
                    + 'point exact.',
                ],
            },
        ],
        faq: [
            {
                q: 'Cette carte recense-t-elle tous les accidents de vélo ?',
                a: 'Non. Seuls les accidents corporels ayant donné lieu à un constat de police entrent '
                    + 'dans les statistiques de Statbel. Les chutes seules et les accrochages sans '
                    + 'blessé n’y figurent pas.',
            },
            {
                q: 'Les données sont-elles à jour ?',
                a: 'Elles suivent le calendrier de publication de Statbel : le dernier millésime '
                    + 'disponible porte sur une année révolue.',
            },
            {
                q: 'La zone 30 a-t-elle changé quelque chose ?',
                a: 'La généralisation du 30 km/h dans la Région, entrée en vigueur en 2021, agit sur '
                    + 'la gravité des chocs plus que sur leur nombre : à cette vitesse, les '
                    + 'conséquences d’une collision pour un cycliste sont sans commune mesure avec '
                    + 'celles d’un choc à 50 km/h.',
            },
            {
                q: 'Ces accidents modifient-ils les itinéraires proposés à Bruxelles ?',
                a: 'Pas encore, le calcul d’itinéraire ne couvrant pas la Région bruxelloise. '
                    + 'Là où il fonctionne, la couche pèse dans le score de sécurité ; ici, '
                    + 'elle sert à identifier soi-même les carrefours les plus exposés.',
            },
        ],
    },

    'bruxelles/reparation-velo': {
        title: 'Réparer son vélo à Bruxelles — ateliers et gonflage',
        description: 'Carte des ateliers de réparation, vélocistes et stations de gonflage en libre '
            + 'accès dans les 19 communes de Bruxelles-Capitale.',
        h1: 'Réparation de vélo à Bruxelles',
        intro: 'Une chambre à air à changer, des freins à régler, un pneu à regonfler : cette carte '
            + 'recense les ateliers, les vélocistes et les stations de gonflage en libre accès des '
            + '19 communes bruxelloises.',
        sections: [
            {
                h2: 'Ce que montre la carte',
                p: [
                    'Trois types de points cohabitent : les vélocistes et ateliers professionnels, '
                    + 'les ateliers associatifs d’auto-réparation — bien implantés à Bruxelles, où '
                    + 'plusieurs associations cyclistes en animent —, et les stations de gonflage '
                    + 'installées sur l’espace public.',
                    'Les horaires ne sont pas toujours renseignés, et un atelier associatif n’ouvre '
                    + 'souvent que quelques après-midi par semaine : mieux vaut vérifier avant de se '
                    + 'déplacer avec un vélo en panne.',
                ],
            },
            {
                h2: 'Freins et pneus, priorité bruxelloise',
                p: [
                    'Entre les pentes et les pavés, deux organes s’usent vite ici. Les freins '
                    + 'd’abord : les descentes depuis les hauteurs sollicitent patins et plaquettes '
                    + 'bien plus qu’en terrain plat, et un frein fatigué se découvre au mauvais '
                    + 'moment. Les pneus ensuite : sur pavés, une pression trop basse pince la '
                    + 'chambre à air contre la jante et multiplie les crevaisons.',
                    'Une crevaison, un frein à régler ou une chaîne à lubrifier restent à la portée '
                    + 'de tous. Confiez à un professionnel la fourche, le cadre, la direction et le '
                    + 'système électrique d’un vélo à assistance.',
                ],
            },
            {
                h2: 'D’où viennent les données',
                p: [
                    'Les emplacements proviennent d’OpenStreetMap, resynchronisés automatiquement. Un '
                    + 'atelier récent peut manquer, un commerce fermé subsister quelque temps.',
                ],
            },
        ],
        faq: [
            {
                q: 'Où gonfler ses pneus gratuitement à Bruxelles ?',
                a: 'Les stations de gonflage en libre accès installées sur l’espace public '
                    + 'apparaissent sur cette carte. Beaucoup de vélocistes dépannent également un '
                    + 'cycliste de passage.',
            },
            {
                q: 'Qu’est-ce qu’un atelier d’auto-réparation ?',
                a: 'Un lieu, le plus souvent associatif, qui met à disposition outillage, pièces '
                    + 'd’occasion et conseils pour que vous répariez vous-même votre vélo, en général '
                    + 'contre une adhésion modique.',
            },
            {
                q: 'Quelle pression pour rouler sur pavés ?',
                a: 'Plutôt en bas de la fourchette indiquée sur le flanc du pneu, sans descendre '
                    + 'sous le minimum : cela absorbe les vibrations sans risquer de pincer la '
                    + 'chambre à air. Des pneus un peu larges apportent bien plus de confort que '
                    + 'n’importe quel réglage.',
            },
            {
                q: 'Sécu’Cycle peut-il me guider jusqu’à un atelier ?',
                a: 'Pas à Bruxelles : la navigation n’y est pas encore disponible. La carte '
                    + 'reste utile pour repérer l’atelier ou la station de gonflage la plus '
                    + 'proche, notamment dans les communes hautes.',
            },
        ],
    },
};

/* -------------------------------------------------------------------------- dérivés */

export const CITY_BY_SLUG = Object.fromEntries(CITIES.map(c => [c.slug, c]));

export const PAGES = CITIES.flatMap(city => city.themes
    .filter(slug => THEMES[slug] && PAGE_CONTENT[`${city.slug}/${slug}`])
    .map(slug => ({
        key: `${city.slug}/${slug}`,
        path: `/carte/${city.slug}/${slug}`,
        city,
        themeSlug: slug,
        theme: THEMES[slug],
        content: PAGE_CONTENT[`${city.slug}/${slug}`],
        // Les sources d'un thème ne sont pas les mêmes partout : le trafic vient de la
        // métropole concernée, les vélos en libre-service de l'opérateur local, les accidents
        // des BAAC en France et de Statbel en Belgique. Une page peut donc les redéfinir ;
        // à défaut, celles du thème s'appliquent.
        sources: PAGE_CONTENT[`${city.slug}/${slug}`].sources ?? THEMES[slug].sources,
    })));

// Villes réellement navigables, dans l'ordre de CITIES. Les pages des villes non couvertes
// pointent vers cette liste plutôt que de la répéter dans leur texte : le jour où une ville
// bascule, il n'y a que `routing` à changer.
export const ROUTABLE_CITIES = CITIES.filter(c => c.routing !== false);

// « Bordeaux, Rennes et Nantes » — énumération française, avec « et » avant le dernier terme.
export const routableCitiesLabel = () => {
    const noms = ROUTABLE_CITIES.map(c => c.name);
    if (noms.length <= 1) return noms.join('');
    return `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]}`;
};

export const findPage = (citySlug, themeSlug) => PAGES.find(
    p => p.city.slug === citySlug && p.themeSlug === themeSlug
);

export const pagesForCity = (citySlug) => PAGES.filter(p => p.city.slug === citySlug);

export const pagesForTheme = (themeSlug) => PAGES.filter(p => p.themeSlug === themeSlug);

// Toutes les routes publiques du module, dans l'ordre où on veut les voir crawlées.
export const ROUTES = [
    '/carte',
    ...CITIES.map(c => `/carte/${c.slug}`),
    ...PAGES.map(p => p.path),
];

export { plural };
