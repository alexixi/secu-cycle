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
        slug: 'tournai',
        name: 'Tournai',
        prep: 'à Tournai',
        de: 'de Tournai',
        label: 'Tournai, Mouscron et le Tournaisis',
        center: [3.3878, 50.6056],
        zoom: 10.6,
        bbox: [3.10, 50.48, 3.70, 50.82],
        communes: 'Tournai, Antoing, Leuze-en-Hainaut, Estaimpuis, Mont-de-l’Enclus et Mouscron',
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
        legend: [
            { label: 'Densité de points lumineux', color: '#ffc12d' },
            { label: 'Rue éclairée (relevé)', color: '#ffcf3d' },
            { label: 'Rue éclairée (déduite)', color: '#ffe39a' },
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
                    'Cette carte est un sous-produit de Sécu’Cycle, un calculateur d’itinéraires cyclables '
                    + 'sécurisés. Sur un trajet le long de la Vilaine ou du canal d’Ille-et-Rance, savoir '
                    + 'où se trouve le prochain sanitaire ouvert évite un détour hasardeux — la couche est '
                    + 'donc aussi disponible directement sur la carte d’itinéraire.',
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
                q: 'Puis-je voir ces toilettes pendant le calcul d’un itinéraire ?',
                a: 'Oui. La couche « Toilettes » est disponible dans le menu Points d’intérêt de la carte '
                    + 'd’itinéraire, et le bouton en haut de cette page l’active directement.',
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
                    'Concrètement, on peut y comparer deux traversées possibles du centre plutôt que '
                    + 'de constater l’état de la rocade. C’est aussi ce qui permet au calcul '
                    + 'd’itinéraire d’arbitrer finement : à durée voisine, il écarte les axes chargés '
                    + 'au profit d’une parallèle apaisée, souvent le long de la Vilaine ou du canal '
                    + 'd’Ille-et-Rance.',
                ],
            },
            {
                h2: 'Dense n’est pas dangereux, fluide n’est pas sûr',
                p: [
                    'La congestion multiplie les remontées de file et les ouvertures de portière, deux '
                    + 'causes majeures de chute en ville. Mais un axe fluide où les voitures roulent '
                    + 'vite reste souvent le plus redoutable des deux : la gravité d’un choc dépend '
                    + 'davantage de la vitesse que de la densité.',
                    'Le score de sécurité de Sécu’Cycle croise donc l’état du trafic avec la vitesse '
                    + 'autorisée et la présence d’un aménagement cyclable, plutôt que de fuir '
                    + 'mécaniquement tout ce qui est rouge.',
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
                q: 'Le trafic influence-t-il les itinéraires proposés ?',
                a: 'Oui, la couche est intégrée au calcul : à trajet comparable, Sécu’Cycle privilégie '
                    + 'les parcours qui évitent les axes les plus chargés.',
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
                    'Chaque accident applique un malus au score de sécurité des tronçons situés dans '
                    + 'un rayon de 25 mètres. Ce malus s’atténue avec l’ancienneté et reste plafonné : '
                    + 'l’objectif est d’infléchir un itinéraire vers une alternative comparable, pas de '
                    + 'condamner une rue sur un événement isolé.',
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
                q: 'Ces accidents modifient-ils les itinéraires proposés ?',
                a: 'Oui, à la marge. Ils dégradent le score de sécurité des tronçons proches, avec un '
                    + 'poids décroissant dans le temps et plafonné, de sorte qu’un accident ancien ne '
                    + 'pèse presque plus.',
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
                    'Cette carte dérive du calculateur d’itinéraires cyclables de Sécu’Cycle. Sur la '
                    + 'Loire à Vélo ou le long de l’Erdre, la même couche s’affiche directement '
                    + 'par-dessus le tracé calculé : le prochain sanitaire se repère alors sans quitter '
                    + 'son trajet.',
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
                q: 'Comment afficher ces toilettes sur mon itinéraire ?',
                a: 'Le bouton en haut de cette page ouvre le calculateur avec la couche « Toilettes » '
                    + 'déjà activée. Elle reste ensuite accessible depuis le menu Points d’intérêt de '
                    + 'la carte d’itinéraire.',
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
                q: 'Puis-je demander un itinéraire qui passe par des rues éclairées ?',
                a: 'C’est déjà le cas la nuit : l’éclairage entre dans le score de sécurité des '
                    + 'tronçons, et pèse donc sur le tracé proposé. La densité de l’inventaire nantais '
                    + 'rend cet arbitrage nettement plus fin ici qu’ailleurs.',
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
                q: 'Comment afficher ces stations sur un itinéraire ?',
                a: 'Le bouton en haut de page ouvre le calculateur avec la couche « Vélos en '
                    + 'libre-service » déjà active ; elle reste ensuite disponible depuis la carte '
                    + 'd’itinéraire.',
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
                    'La couche alimente directement le score de sécurité. À trajet comparable, '
                    + 'Sécu’Cycle écarte les axes rouges quand une alternative crédible existe. Notez '
                    + 'la nuance : un axe dense mais lent est souvent préférable à un axe fluide où les '
                    + 'voitures roulent vite — la fluidité n’est pas la sécurité.',
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
                q: 'Le trafic modifie-t-il l’itinéraire proposé ?',
                a: 'Oui. La congestion dégrade le score de sécurité des tronçons concernés, et le '
                    + 'calcul privilégie les parcours qui les évitent lorsque le détour reste '
                    + 'raisonnable.',
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
                    'Chaque accident est rattaché aux tronçons du graphe routier situés dans un rayon '
                    + 'de 25 mètres, où il applique un malus au score de sécurité. Le malus s’efface '
                    + 'progressivement avec l’ancienneté et reste plafonné : un accident ne suffit '
                    + 'jamais, à lui seul, à faire basculer le tracé proposé.',
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
