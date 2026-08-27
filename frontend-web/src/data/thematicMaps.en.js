// English editorial content for the thematic maps.
//
// Mirrors thematicMaps.fr.js. The contract between languages is the set of
// PAGE_CONTENT keys, not the list of fields: French carries `prep` and `de`,
// which encode French grammar and have no equivalent here.
//
// A city or a page missing from this file simply does not exist in English —
// buildRegistry filters them out. That is what allows English to be published
// city by city, without ever exposing a half-written page.
//
// Same constraint as the rest of the registry: plain JavaScript, importable by
// Node as well as by Vite.

import {
    SOURCE_BAAC,
    SOURCE_GBFS,
    SOURCE_GBFS_BLUEBIKE,
    SOURCE_GBFS_BRUXELLES,
    SOURCE_GBFS_LILLE,
    SOURCE_GBFS_LYON,
    SOURCE_GBFS_NANTES,
    SOURCE_GBFS_PARIS,
    SOURCE_GBFS_RENNES,
    SOURCE_GBFS_STRASBOURG,
    SOURCE_LUM_NANTES,
    SOURCE_OSM,
    SOURCE_PTLUM,
    SOURCE_STATBEL,
    SOURCE_TRAFIC_BM,
    SOURCE_TRAFIC_NANTES,
    SOURCE_TRAFIC_RENNES,
} from './thematicMapsCore.js';

export const LANG = 'en';

// « A, B and C » — Intl.ListFormat carries each language's own rule, including
// the placement and form of the conjunction.
export const listFormat = (noms) =>
    new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(noms);

// English builds its city titles with a preposition that never inflects, so the
// template is simpler than its French counterpart.
export const cityHubTitle = (city) => `Cycling maps in ${city.name}`;

/* ------------------------------------------------------------- cities (editorial) */

export const CITIES_CONTENT = {
    bordeaux: {
        label: 'Bordeaux and its metropolitan area',
        communes: 'the 28 municipalities of Bordeaux Métropole and around fifteen more in southern Gironde',
        metaDescription: 'Every cycling map for Bordeaux Métropole: bike parking, toilets, '
            + 'drinking water, street lighting, live traffic and accidents, from open data.',
        intro: 'Sécu’Cycle covers Bordeaux Métropole and the south of the urban area, from '
            + 'Blanquefort to La Brède by way of Mérignac, Pessac, Talence and Bègles. Every map '
            + 'below draws on the same data as the route planner.',
    },

    rennes: {
        label: 'Rennes and its metropolitan area',
        communes: 'the 43 municipalities of Rennes Métropole',
        metaDescription: 'Every cycling map for Rennes Métropole: bike parking, toilets, drinking '
            + 'water, LE vélo STAR stations, live traffic and cycling accidents.',
        intro: 'Sécu’Cycle covers Rennes Métropole, from Betton to Bruz and from Mordelles to '
            + 'Cesson-Sévigné. Rennes is one of the densest urban areas in France, and one of the best '
            + 'served by open data.',
        routingNote: 'Route planning does not cover Rennes Métropole for the time being: the road '
            + 'network is held in memory for Bordeaux and the Tournai area only.',
        excludedThemes: {
            'eclairage-public': 'Rennes Métropole does not publish an inventory of street lights: only '
                + 'the 9,800 or so recorded in OpenStreetMap are available, against 97,473 official '
                + 'units — too partial a survey to be published as a map.',
        },
    },
    nantes: {
        label: 'Nantes and its metropolitan area',
        communes: 'the 24 municipalities of Nantes Métropole',
        metaDescription: 'Every cycling map for Nantes Métropole: bike parking, toilets, drinking '
            + 'water, street lighting, Naolib stations, live traffic and accidents.',
        intro: 'Sécu’Cycle covers Nantes Métropole, from both banks of the Loire to the Erdre and the '
            + 'Sèvre. It is the best served by open data of any area on the service: Nantes Métropole '
            + 'publishes a full inventory of its street lighting, which allows a map of rare precision.',
        routingNote: 'Route planning does not cover Nantes Métropole for the time being: the road '
            + 'network is held in memory for Bordeaux and the Tournai area only. The Nantes data shown '
            + 'here does remain synchronised.',
    },
    paris: {
        label: 'Paris and Greater Paris',
        communes: 'the 130 municipalities of the Métropole du Grand Paris',
        metaDescription: 'Every cycling map for Greater Paris: bike parking, toilets, drinking water, '
            + 'Vélib’ stations, accidents and repair workshops.',
        intro: 'Sécu’Cycle covers the Métropole du Grand Paris, from central Paris to the inner suburbs, '
            + 'from Saint-Denis to Montrouge and from Boulogne to Montreuil. The maps below draw on open '
            + 'data, resynchronised automatically.',
        routingNote: 'Route planning does not yet cover Greater Paris: the Île-de-France data shown here '
            + 'is synchronised, but the road network needed to plan a journey is not loaded for this area.',
        excludedThemes: {
            'eclairage-public': 'No official street light inventory is available for Greater Paris: only '
                + 'the units recorded in OpenStreetMap would be, far short of the real estate. The map '
                + 'would give a false picture, so it is not published.',
            'trafic-routier': 'The traffic layer is computed on the road network loaded by the route '
                + 'planner, which does not yet cover Île-de-France.',
        },
    },
    lyon: {
        label: 'Lyon and its metropolitan area',
        communes: 'the 58 municipalities of the Métropole de Lyon',
        metaDescription: 'Every cycling map for the Métropole de Lyon: bike parking, toilets, drinking '
            + 'water, Vélo’v stations, accidents and repair workshops.',
        intro: 'Sécu’Cycle covers the Métropole de Lyon, from the Presqu’île to Villeurbanne and from '
            + 'Vaulx-en-Velin to Sainte-Foy-lès-Lyon. An urban area where the terrain matters as much as '
            + 'the infrastructure: the maps below draw on open data, resynchronised automatically.',
        routingNote: 'Route planning does not yet cover the Métropole de Lyon: the Lyon data shown here '
            + 'is synchronised, but the road network needed to plan a journey is not loaded for this area.',
        excludedThemes: {
            'eclairage-public': 'The Métropole de Lyon does not publish a street light inventory usable '
                + 'here: only the units recorded in OpenStreetMap would be, far short of the real estate.',
            'trafic-routier': 'The traffic layer is computed on the road network loaded by the route '
                + 'planner, which does not yet cover the Lyon metropolitan area.',
        },
    },
    lille: {
        label: 'Lille and its metropolitan area',
        communes: 'the 95 municipalities of the Métropole Européenne de Lille',
        metaDescription: 'Every cycling map for the Métropole Européenne de Lille: bike parking, '
            + 'toilets, drinking water, V’Lille stations, accidents and workshops.',
        intro: 'Sécu’Cycle covers the Métropole Européenne de Lille, from Lille to Roubaix and from '
            + 'Tourcoing to Villeneuve-d’Ascq. A flat, polycentric area where cobbles are part of daily '
            + 'life: the maps below draw on open data, resynchronised automatically.',
        routingNote: 'Route planning does not yet cover the Métropole Européenne de Lille: the Lille '
            + 'data shown here is synchronised, but the road network needed to plan a journey is not '
            + 'loaded for this area.',
        excludedThemes: {
            'eclairage-public': 'The Lille metropolitan area does not publish a street light inventory '
                + 'usable here: only the units recorded in OpenStreetMap would be, far short of the real '
                + 'estate.',
            'trafic-routier': 'The traffic layer is computed on the road network loaded by the route '
                + 'planner, which does not yet cover the Lille metropolitan area.',
        },
    },
    strasbourg: {
        label: 'Strasbourg and the Eurométropole',
        communes: 'the 33 municipalities of the Eurométropole de Strasbourg',
        metaDescription: 'Every cycling map for the Eurométropole de Strasbourg: bike parking, toilets, '
            + 'drinking water, Vélhop stations, accidents and workshops.',
        intro: 'Sécu’Cycle covers the Eurométropole de Strasbourg, from the Grande Île to the outer '
            + 'municipalities. It is the French city with the highest share of journeys made by bike: '
            + 'the maps below draw on open data, resynchronised automatically.',
        routingNote: 'Route planning does not yet cover the Eurométropole de Strasbourg: the Strasbourg '
            + 'data shown here is synchronised, but the road network needed to plan a journey is not '
            + 'loaded for this area.',
        excludedThemes: {
            'eclairage-public': 'The Eurométropole does not publish a street light inventory usable '
                + 'here: only the units recorded in OpenStreetMap would be, far short of the real estate.',
            'trafic-routier': 'The traffic layer is computed on the road network loaded by the route '
                + 'planner, which does not yet cover the Eurométropole.',
        },
    },
    tournai: {
        label: 'Tournai, Mouscron and the Tournaisis',
        communes: 'Tournai, Antoing, Leuze-en-Hainaut, Estaimpuis, Mont-de-l’Enclus and Mouscron',
        metaDescription: 'Cycling maps for the Tournaisis and the Mouscron area: bike parking, cycling '
            + 'accidents, toilets and drinking water, from Belgian open data.',
        intro: 'On the Belgian side, Sécu’Cycle covers the Tournaisis and the Mouscron area, up to the '
            + 'French border. Open data coverage there is patchier than in Bordeaux: we only publish the '
            + 'maps for which the survey is substantial enough.',
        excludedThemes: {
            'eclairage-public': 'Patchy survey: around 640 street lights for six municipalities, against '
                + 'some 38,000 for Bordeaux Métropole. The map would give a false picture of an area that '
                + 'is in fact lit.',
            'velos-libre-service': 'The stations picked up within this area belong to V’Lille, on the '
                + 'French side, not to a Tournai service. Publishing a “Tournai” page built on Lille '
                + 'stations would mislead the visitor.',
        },
    },
    bruxelles: {
        label: 'Brussels and its 19 municipalities',
        communes: 'the 19 municipalities of the Brussels-Capital Region',
        metaDescription: 'Every cycling map for Brussels-Capital: bike parking, toilets, drinking water, '
            + 'Villo! and Blue-bike stations, accidents and workshops.',
        intro: 'Sécu’Cycle covers the 19 municipalities of the Brussels-Capital Region, from the Pentagon '
            + 'to Uccle and from Molenbeek to Woluwe-Saint-Pierre. A city of hills and cobbles, where a '
            + '30 km/h limit has applied city-wide since 2021: the maps below draw on open data, '
            + 'resynchronised automatically.',
        routingNote: 'Route planning does not yet cover the Brussels-Capital Region: the Brussels data '
            + 'shown here is synchronised, but the road network needed to plan a journey is not loaded '
            + 'for this area.',
        excludedThemes: {
            'eclairage-public': 'The Region does not publish a street light inventory usable here: only '
                + 'the units recorded in OpenStreetMap would be, far short of the real estate.',
            'trafic-routier': 'The traffic layer is computed on the road network loaded by the route '
                + 'planner, which does not yet cover Brussels.',
        },
    },
};

/* ------------------------------------------------------------------ editorial content */
//
// One entry per city/theme pair. `intro` is the standfirst shown under the H1,
// `sections` the indexable body copy, `faq` feeds both the FAQ block and the
// FAQPage structured data.

export const PAGE_CONTENT = {
    'bordeaux/stationnements-velo': {
        title: 'Bike parking in Bordeaux — map of stands and shelters',
        description: 'Interactive map of the 3,800 bike parking spots in Bordeaux Métropole: '
            + 'stands, racks, shelters and secure lockers, with their capacity.',
        h1: 'Bike parking in Bordeaux',
        intro: 'Where can you lock your bike in Bordeaux? This map lists the stands, racks, shelters '
            + 'and lockers across the whole metropolitan area, with the type of equipment and, where '
            + 'it is known, the number of spaces.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Each point marks a bike parking spot surveyed on the ground by OpenStreetMap '
                    + 'contributors. Stands, by far the most common, are the only equipment that lets you '
                    + 'lock both the frame and a wheel with a U-lock: they are the ones to look for when '
                    + 'leaving a bike for any length of time.',
                    'Racks and wheel benders, which hold the front wheel only, leave a bike more exposed '
                    + 'to theft and can buckle the rim. Shelters and lockers, shown separately, keep the '
                    + 'rain off and — for enclosed lockers of the Ma Ligne / Vélo-Box type — allow '
                    + 'long-stay parking near stations and tram termini.',
                ],
            },
            {
                h2: 'Parking without getting your bike stolen',
                p: [
                    'Bike theft remains the main reason people give up cycling. Always lock the frame to '
                    + 'a fixed point, never the wheel alone, and use a certified U-lock. In the city '
                    + 'centre and around tram stops, choose a visible, busy spot over a deserted street.',
                    'Bicycle marking (Bicycode), mandatory on new bikes sold in France since 2021, '
                    + 'markedly improves the odds of getting a stolen bike back: remember to register yours.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The survey comes from OpenStreetMap and is resynchronised automatically. It is '
                    + 'therefore live but imperfect: a recently installed stand may be missing, and one '
                    + 'that has been removed may linger for a few weeks. Any correction made on '
                    + 'OpenStreetMap will show up here after the next sync.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many bike parking spots are there in Bordeaux?',
                a: 'Around 3,800 spots are recorded across Bordeaux Métropole and the south of the urban '
                    + 'area, representing close to 37,000 declared spaces. The vast majority are stands; '
                    + 'there are also several hundred shelters and lockers.',
            },
            {
                q: 'What is the difference between a stand and a rack?',
                a: 'A stand is an inverted U-shaped bar that lets you lock both the frame and a wheel: it '
                    + 'is the recommended design. A rack (or wheel bender) holds only the front wheel, '
                    + 'which offers poor protection against theft and can buckle the rim.',
            },
            {
                q: 'Are there secure bike lockers in Bordeaux?',
                a: 'Yes. Enclosed shelters and individual lockers exist, particularly around stations and '
                    + 'transport hubs. They appear on the map under the “Shelters and lockers” category.',
            },
            {
                q: 'A parking spot is missing from the map — how do I report it?',
                a: 'The data comes from OpenStreetMap: you can add the location directly on '
                    + 'openstreetmap.org and it will be picked up at the next sync. You can also write to '
                    + 'us through the Contact page.',
            },
        ],
    },

    'bordeaux/toilettes-publiques': {
        title: 'Public toilets in Bordeaux — interactive map',
        description: 'Map of public toilets in Bordeaux and its metropolitan area: free, paid and '
            + 'wheelchair-accessible facilities, located and kept up to date.',
        h1: 'Public toilets in Bordeaux',
        intro: 'Finding a public toilet in Bordeaux should not be a treasure hunt. This map locates the '
            + 'facilities recorded across the metropolitan area, telling free toilets apart from paid '
            + 'ones and flagging those that are wheelchair accessible.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Public toilets are covered in the broad sense: automatic street units, blocks in '
                    + 'parks and gardens, those at markets, stations and transport hubs, and facilities '
                    + 'open to the public in municipal buildings.',
                    'Some locations also carry opening hours. Many park blocks close at nightfall and '
                    + 'follow the seasonal hours of the grounds they stand in, which the data does not '
                    + 'always capture.',
                ],
            },
            {
                h2: 'Free, paid and accessible',
                p: [
                    'Most of the toilets recorded in Bordeaux are free. Paid facilities are in the '
                    + 'minority and concentrated in stations and a few large venues.',
                    'Wheelchair accessibility is shown where it has been surveyed. That field is less '
                    + 'thoroughly filled in than the position itself: its absence does not mean a facility '
                    + 'is inaccessible, only that nobody has recorded it yet.',
                ],
            },
            {
                h2: 'Useful on a bike as well as on foot',
                p: [
                    'This map is a by-product of Sécu’Cycle, a safer cycling route planner. On a bike ride, '
                    + 'knowing where the next open facility is saves a detour — and the layer can be '
                    + 'switched on directly over your route.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many public toilets are there in Bordeaux?',
                a: 'Around 250 locations are mapped across Bordeaux Métropole and the south of the urban '
                    + 'area, close to 150 of them explicitly free. About a hundred are recorded as '
                    + 'wheelchair accessible.',
            },
            {
                q: 'Are public toilets free in Bordeaux?',
                a: 'The vast majority are. Automatic street units and those in municipal parks are free. '
                    + 'Only a few venues, mainly stations, charge for access.',
            },
            {
                q: 'Are the opening hours reliable?',
                a: 'They come from OpenStreetMap and are only filled in for some locations. Park blocks '
                    + 'generally follow the opening hours of the grounds, which vary with the season.',
            },
            {
                q: 'Can I see these toilets while planning a route?',
                a: 'Yes. The “Toilets” layer is available from the Points of interest menu on the route '
                    + 'map, and the button at the top of this page switches it on directly.',
            },
        ],
    },

    'bordeaux/points-eau': {
        title: 'Drinking water in Bordeaux — map of fountains',
        description: 'Map of drinking fountains and water points across Bordeaux Métropole, useful for '
            + 'cyclists, runners and walkers refilling a bottle in summer.',
        h1: 'Drinking water in Bordeaux',
        intro: 'Where can you refill a bottle in Bordeaux? This map lists the freely accessible drinking '
            + 'fountains and water points across the metropolitan area — a useful habit on a bike, on a '
            + 'run, or simply during a heatwave.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Each marker is a water point declared drinkable: a park fountain, a street standpipe, '
                    + 'a tap in a playground or a cemetery. Points recorded as not drinkable are excluded.',
                    'A word of caution: many Bordeaux fountains are shut off in winter to prevent freezing, '
                    + 'and some are seasonal by design. The map shows whether a point is seasonal where '
                    + 'that has been recorded.',
                ],
            },
            {
                h2: 'Staying hydrated on summer rides',
                p: [
                    'On a summer ride across the urban area, plan to drink before you feel thirsty: '
                    + 'dehydration dulls your alertness, which matters all the more in traffic.',
                    'Heatwaves are becoming frequent in the Gironde: during an alert, ride early in the '
                    + 'morning or in the evening, and pick out two or three refill points along your route '
                    + 'in advance.',
                ],
            },
            {
                h2: 'How reliable the data is',
                p: [
                    'The survey comes from OpenStreetMap. A fountain may have been decommissioned without '
                    + 'the database being updated, and conversely recent installations may still be '
                    + 'missing. Treat the map as a strong indication rather than a guarantee.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many drinking water points are there in Bordeaux?',
                a: 'More than 300 water points are recorded across Bordeaux Métropole and the south of the '
                    + 'urban area, the vast majority of them freely accessible.',
            },
            {
                q: 'Do Bordeaux fountains run all year round?',
                a: 'No. Part of the network is shut off during winter to prevent freezing, and some points '
                    + 'are explicitly seasonal. That is shown on the map where it has been recorded.',
            },
            {
                q: 'Is the water from these fountains drinkable?',
                a: 'Only points declared drinkable in the open data are shown. Ornamental fountains and '
                    + 'non-potable water points are excluded.',
            },
            {
                q: 'Can I see the water points along my route?',
                a: 'Yes. The “Drinking water” layer is available from the Points of interest menu on the '
                    + 'route map, and the button at the top of this page switches it on directly.',
            },
        ],
    },

    'bordeaux/eclairage-public': {
        title: 'Street lighting in Bordeaux — map of street lights',
        description: 'Map of street lighting across Bordeaux Métropole: street light density and lit '
            + 'streets, to help you plan night rides.',
        h1: 'Street lighting in Bordeaux',
        intro: 'Which streets are lit at night in Bordeaux? This map combines close to 38,000 recorded '
            + 'street lights with the streets identified as lit, so you can see at a glance which routes '
            + 'are workable after dark.',
        sections: [
            {
                h2: 'Two complementary layers',
                p: [
                    'The first layer is a density map: the brighter and more yellow an area, the more '
                    + 'street lights it has. It gives an overall reading of the network — a dense city '
                    + 'centre, thinning out towards the edges of the urban area.',
                    'The second layer draws the streets themselves. A solid line marks a street whose '
                    + 'lighting is explicitly recorded; a paler line marks lighting inferred from nearby '
                    + 'street lights or from an adjacent lit street.',
                ],
            },
            {
                h2: 'Riding safely at night',
                p: [
                    'Street lighting is no substitute for bike lights, which remain compulsory: a white '
                    + 'light at the front, a red one at the rear, reflectors, and a reflective vest '
                    + 'outside built-up areas at night.',
                    'In Bordeaux as elsewhere, several municipalities switch their lighting off in the '
                    + 'middle of the night, to save energy and protect wildlife. A street marked as lit '
                    + 'may therefore be dark at two in the morning.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'Street lights come from OpenStreetMap, densified by the “Points lumineux” dataset '
                    + 'published by Bordeaux Métropole. Duplicates between the two sources are discarded '
                    + 'automatically.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many street lights does Bordeaux Métropole have?',
                a: 'Close to 38,000 street lights are mapped across the area covered, combining '
                    + 'OpenStreetMap with Bordeaux Métropole open data.',
            },
            {
                q: 'What does a pale yellow street mean?',
                a: 'That its lighting is inferred rather than recorded: there are street lights nearby, '
                    + 'but the street itself is not explicitly described as lit in the data.',
            },
            {
                q: 'Is lighting taken into account when planning a route?',
                a: 'Yes. Sécu’Cycle factors lighting into each segment\'s safety score, which shapes the '
                    + 'routes it suggests, particularly for night-time journeys.',
            },
            {
                q: 'Do street lights stay on all night?',
                a: 'Not everywhere. Several municipalities switch off some or all of their lighting in the '
                    + 'middle of the night. The map shows where street lights are, not when they are on.',
            },
        ],
    },

    'bordeaux/velos-libre-service': {
        title: 'Bike share in Bordeaux — live Le Vélo stations',
        description: 'Live map of the bike-share stations across Bordeaux Métropole (Le Vélo, formerly '
            + 'V³ / TBM): mechanical bikes, electric bikes and free docks.',
        h1: 'Bike share in Bordeaux',
        intro: 'How many bikes are left at the nearest station? This map shows the stations of the Bordeaux '
            + 'Métropole Le Vélo service — formerly V³ — in real time, with the number of mechanical and '
            + 'electric bikes available and the free docks.',
        sections: [
            {
                h2: 'A continuously refreshed map',
                p: [
                    'Availability comes from the GBFS feed published by the operator and is refreshed '
                    + 'automatically. Each station\'s dot shows its state at a glance: bikes available, '
                    + 'station almost empty, empty, full, or out of service.',
                    'The number on the dot is the count of bikes available. Opening a station shows the '
                    + 'split between mechanical and electrically assisted bikes, along with the network '
                    + 'name and the time of the last reading.',
                ],
            },
            {
                h2: 'Bike share or your own bike?',
                p: [
                    'Bike share works best for short trips and one-way journeys — tram out, bike back. '
                    + 'For a daily commute, a well-parked personal bike is usually simpler and cheaper.',
                    'One useful habit: check the state of the destination station before setting off. A '
                    + 'full station in the city centre at rush hour is common, and means riding on to the '
                    + 'next one.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many Le Vélo stations does Bordeaux have?',
                a: 'The service operated for Bordeaux Métropole has around 230 stations across the urban '
                    + 'area, all of them shown on this map.',
            },
            {
                q: 'Is the data live?',
                a: 'Yes, it comes from the official GBFS feed and is refreshed continuously. The time of '
                    + 'the last reading is shown on the map; if a reading is stale, a warning says so.',
            },
            {
                q: 'Are V³ and Le Vélo the same service?',
                a: 'Yes. The Bordeaux Métropole bike-share service, long known as V³, is now marketed '
                    + 'under the Le Vélo brand as part of the TBM offer.',
            },
            {
                q: 'Can I see the stations while planning a route?',
                a: 'Yes, the “Bike share” layer is available on the route map. The button at the top of '
                    + 'this page switches it on directly.',
            },
        ],
    },

    'bordeaux/trafic-routier': {
        title: 'Live traffic in Bordeaux — congestion map',
        description: 'Live road traffic map for Bordeaux Métropole: free-flowing, heavy and congested '
            + 'roads, read through a cyclist\'s eyes.',
        h1: 'Live road traffic in Bordeaux',
        intro: 'Where is Bordeaux jammed right now? This map shows the state of traffic on the city\'s '
            + 'main roads, updated continuously from Bordeaux Métropole open data.',
        sections: [
            {
                h2: 'Reading the map',
                p: [
                    'Each section is coloured by its state: green for free-flowing traffic, orange for '
                    + 'heavy traffic, red for a congested road, grey when the sensor reports nothing.',
                    'The information is refreshed automatically every few minutes. The sharpest peaks are '
                    + 'on the ring road, the Garonne bridges and the main boulevards.',
                ],
            },
            {
                h2: 'What traffic changes for a cyclist',
                p: [
                    'A congested road is not a safe road for a cyclist. Congestion multiplies close '
                    + 'overtakes, filtering, and above all the risk of dooring — a door opened without '
                    + 'looking.',
                    'Conversely, heavy but slow traffic can be more bearable than a free-flowing road '
                    + 'where cars move fast. Sécu’Cycle accounts for this: its routes avoid the busiest '
                    + 'roads without ever ruling them out entirely.',
                ],
            },
        ],
        faq: [
            {
                q: 'Where does the traffic data come from?',
                a: 'From the Bordeaux Métropole open dataset describing the state of traffic on main '
                    + 'roads, published under the Licence Ouverte and refreshed continuously.',
            },
            {
                q: 'Are all roads covered?',
                a: 'No. The system covers main roads fitted with sensors — around 700 sections. '
                    + 'Residential streets are not included.',
            },
            {
                q: 'Does traffic influence the routes suggested?',
                a: 'Yes, the layer feeds into the calculation: for a comparable journey, Sécu’Cycle '
                    + 'favours routes that avoid the busiest roads.',
            },
        ],
    },

    'bordeaux/accidents-velo': {
        sources: [SOURCE_BAAC],
        title: 'Cycling accidents in Bordeaux — accident map',
        description: 'Map of injury accidents involving a cyclist across Bordeaux Métropole, from 2015 to '
            + '2023, from the ONISR BAAC records.',
        h1: 'Cycling accidents in Bordeaux',
        intro: 'Where are cyclists involved in accidents in Bordeaux? This map records injury accidents '
            + 'involving a bicycle across the metropolitan area between 2015 and 2023, from the reports '
            + 'filed by the police.',
        sections: [
            {
                h2: 'Reading the map without over-reading it',
                p: [
                    'Zoomed out, the map shows a density: hot areas mark where accidents cluster. Zooming '
                    + 'in, each accident appears individually, coloured by its severity.',
                    'One caveat matters: a cluster of accidents reflects how much cycling traffic there is '
                    + 'as much as how dangerous a place inherently is. A busy junction mechanically '
                    + 'accumulates accidents.',
                ],
            },
            {
                h2: 'What the data covers',
                p: [
                    'Only injury accidents that led to police involvement are recorded. Falls without a '
                    + 'third party, minor collisions settled amicably and the vast majority of near '
                    + 'misses are absent.',
                    'The severity shown is that of the most seriously injured casualty. Each record gives, '
                    + 'where available, the light conditions, the weather, the type of collision and the '
                    + 'kind of road.',
                ],
            },
            {
                h2: 'How Sécu’Cycle uses it',
                p: [
                    'These accidents are not there for illustration alone: they are attached to road graph '
                    + 'segments within a 25-metre radius and apply a penalty to the safety score. That '
                    + 'penalty is capped, precisely because the data carries no exposure denominator.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many cycling accidents are recorded in Bordeaux?',
                a: 'Around 460 injury accidents involving a cyclist are mapped across the area covered '
                    + 'between 2015 and 2023, close to 90 of which led to hospitalisation.',
            },
            {
                q: 'Where does this data come from?',
                a: 'From the injury accident reports (BAAC) filed by the police and published by ONISR, '
                    + 'via the derived “Accidents de vélo” dataset.',
            },
            {
                q: 'Does a red area mean the place is dangerous?',
                a: 'Not mechanically. It marks a cluster of accidents, which also depends on how many '
                    + 'cyclists pass through. Without traffic counts, the two cannot be told apart.',
            },
            {
                q: 'Is the data up to date?',
                a: 'BAAC records are published several years in arrears. The data currently available '
                    + 'covers the period 2015 to 2023.',
            },
        ],
    },

    'bordeaux/reparation-velo': {
        title: 'Bike repair in Bordeaux — stations and workshops',
        description: 'Map of self-service repair stations and bike workshops across Bordeaux Métropole: '
            + 'pumps, tools, repairs and servicing.',
        h1: 'Bike repair in Bordeaux',
        intro: 'A punctured inner tube, a soft tyre, a derailleur out of adjustment: this map lists the '
            + 'self-service repair stations and the bike workshops and shops across the metropolitan area.',
        sections: [
            {
                h2: 'Self-service stations and workshops',
                p: [
                    'Self-service stations are the posts installed in public space, usually fitted with a '
                    + 'pump and a set of tools on a cable: enough to reinflate a tyre, tighten a bolt or '
                    + 'adjust a brake.',
                    'Workshops and shops cover both conventional bike shops and community self-repair '
                    + 'workshops, where you do the work yourself with the advice and tools of volunteers.',
                ],
            },
            {
                h2: 'What you can do yourself',
                p: [
                    'Punctures, brake adjustment and chain lubrication are within everyone\'s reach and '
                    + 'cover most everyday failures. Carrying a spare inner tube and two tyre levers turns '
                    + 'a ruined journey into a ten-minute stop.',
                    'A buckled wheel, a headset or a hydraulic braking system, on the other hand, call for '
                    + 'specific tools: a workshop is the better bet.',
                ],
            },
        ],
        faq: [
            {
                q: 'Are self-service repair stations free?',
                a: 'Yes, the posts installed in public space are free and available at all times. Their '
                    + 'tools may, however, be damaged or missing.',
            },
            {
                q: 'Where can I pump up my tyres in Bordeaux?',
                a: 'Self-service repair stations almost always include a pump. They appear in light orange '
                    + 'on the map.',
            },
            {
                q: 'What is the difference between a community workshop and a bike shop?',
                a: 'At a community workshop you do the repair yourself, with the tools and advice of '
                    + 'volunteers, in exchange for a membership. At a bike shop, the repair is done for '
                    + 'you and invoiced.',
            },
        ],
    },

    'rennes/stationnements-velo': {
        title: 'Bike parking in Rennes — map of stands and shelters',
        description: 'Interactive map of bike parking across Rennes Métropole: stands, racks, shelters '
            + 'and secure lockers, with their capacity where it is known.',
        h1: 'Bike parking in Rennes',
        intro: 'Where can you lock your bike in Rennes? This map lists the stands, racks, shelters and '
            + 'lockers across the 43 municipalities of the metropolitan area, from the inner ring road to '
            + 'the outlying towns, with the type of equipment and the number of spaces where recorded.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Each point is a parking spot surveyed by OpenStreetMap contributors. Stands dominate '
                    + 'by a wide margin: they are the only equipment that lets you lock both the frame and '
                    + 'a wheel with a U-lock.',
                    'Racks and wheel benders, which hold only the front wheel, leave a bike exposed to '
                    + 'theft and can buckle the rim. Shelters and enclosed lockers appear as a separate '
                    + 'category; they cluster around the station, the metro stops and the park-and-ride sites.',
                ],
            },
            {
                h2: 'A dense area, unevenly served',
                p: [
                    'Close to 2,900 spots are recorded across Rennes Métropole, but their distribution '
                    + 'follows that of the activity hubs: the city centre, the Beaulieu and Villejean '
                    + 'campuses, and the areas around metro stations. In the outlying towns, provision '
                    + 'thins out quickly.',
                    'Cycling to a metro station or a railway station is the use that weighs most on '
                    + 'parking demand: that is where enclosed shelters make the difference, covering a '
                    + 'full day of parking without leaving a bike in the open.',
                ],
            },
            {
                h2: 'Parking without getting your bike stolen',
                p: [
                    'Lock the frame to a fixed point, never the wheel alone, and use a certified U-lock. '
                    + 'Bicycle marking (Bicycode), mandatory on new bikes sold in France since 2021, '
                    + 'markedly improves the odds of recovering a stolen bike.',
                    'The data comes from OpenStreetMap and is resynchronised automatically: a recently '
                    + 'installed stand may be missing, and one that has been removed may linger for a few '
                    + 'weeks. Any correction made on OpenStreetMap shows up here after the next sync.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many bike parking spots are there in Rennes?',
                a: 'Close to 2,900 spots are recorded across the 43 municipalities of Rennes Métropole, '
                    + 'the vast majority of them stands. Several hundred shelters and enclosed lockers are '
                    + 'added to that, mainly around the station and the metro stops.',
            },
            {
                q: 'What is the difference between a stand and a rack?',
                a: 'A stand is an inverted U-shaped bar that lets you lock the frame and a wheel: it is '
                    + 'the recommended design. A rack, or wheel bender, holds only the front wheel, which '
                    + 'offers poor protection against theft.',
            },
            {
                q: 'Where can I find secure bike parking in Rennes?',
                a: 'Enclosed shelters and individual lockers cluster around Rennes station, the metro '
                    + 'stops and the park-and-ride sites. They appear on the map under the “Shelters and '
                    + 'lockers” category.',
            },
            {
                q: 'A parking spot is missing from the map — how do I report it?',
                a: 'The data comes from OpenStreetMap: you can add the location directly on '
                    + 'openstreetmap.org and it will be picked up at the next sync. You can also write to '
                    + 'us through the Contact page.',
            },
            {
                q: 'Can Sécu’Cycle plan a route to these parking spots?',
                a: 'Not for the time being: route planning relies on a road network held in memory by our '
                    + 'server, currently limited to Bordeaux and the Tournai area. The Rennes data shown '
                    + 'here remains fully browsable on the map.',
            },
        ],
    },

    'rennes/toilettes-publiques': {
        title: 'Public toilets in Rennes — interactive map',
        description: 'Map of public toilets in Rennes and its metropolitan area: free, paid and '
            + 'wheelchair-accessible facilities, located and kept up to date.',
        h1: 'Public toilets in Rennes',
        intro: 'This map locates the public toilets recorded across Rennes Métropole — street units, '
            + 'blocks in parks and gardens, facilities at stations and markets — telling free toilets '
            + 'apart from paid ones and flagging those that are wheelchair accessible.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Around 260 locations are mapped across the metropolitan area. The colour of the '
                    + 'marker shows the fee: free, paid, or unspecified where the open data is silent. '
                    + 'Purple therefore means “unknown”, not “paid”.',
                    'Some locations carry opening hours. Park blocks — Thabor, Gayeulles, prairies '
                    + 'Saint-Martin — follow the hours of the grounds themselves, which vary sharply '
                    + 'between winter and summer: check before relying on them.',
                ],
            },
            {
                h2: 'Free and accessible',
                p: [
                    'The vast majority of the facilities recorded in Rennes are free. The few paid ones '
                    + 'are mainly at the station and in a handful of shopping hubs. Wheelchair '
                    + 'accessibility is shown where it has been surveyed.',
                ],
            },
            {
                h2: 'Useful on a bike as well as on foot',
                p: [
                    'This map is a by-product of Sécu’Cycle, a safer cycling route planner. On a ride '
                    + 'along the Vilaine or the Ille-et-Rance canal, knowing where the next open facility '
                    + 'is saves a risky detour.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many public toilets are recorded in Rennes?',
                a: 'Around 260 locations are mapped across the 43 municipalities of Rennes Métropole, '
                    + 'from city-centre street units to park blocks and sports facilities in the outer ring.',
            },
            {
                q: 'Are public toilets free in Rennes?',
                a: 'The vast majority are. Street units and those in municipal parks are free; only a few '
                    + 'venues, mainly at the station, charge for access.',
            },
            {
                q: 'Are the opening hours reliable?',
                a: 'They come from OpenStreetMap and are only filled in for some locations. Park blocks '
                    + 'follow the hours of the grounds, which vary with the season. Treat them as '
                    + 'indicative.',
            },
            {
                q: 'Do these toilets appear while planning a route?',
                a: 'Not in Rennes for the time being: route planning relies on a road network held in '
                    + 'memory, now limited to Bordeaux and the Tournai area. The layer exists on those '
                    + 'areas.',
            },
        ],
    },

    'rennes/points-eau': {
        title: 'Drinking water in Rennes — map of fountains',
        description: 'Map of drinking fountains and water points across Rennes Métropole, useful for '
            + 'cyclists, runners and walkers refilling a bottle.',
        h1: 'Drinking water in Rennes',
        intro: 'Where can you refill a bottle in Rennes? This map lists the freely accessible drinking '
            + 'fountains and water points across the metropolitan area — a useful habit on a bike, on a '
            + 'run, or during a heatwave.',
        sections: [
            {
                h2: 'A survey to be read for what it is',
                p: [
                    'Close to 90 water points are mapped across the metropolitan area. That figure is '
                    + 'modest, and should be read as a lower bound: it describes the state of '
                    + 'contributions to OpenStreetMap, not what the municipalities actually provide.',
                    'In other words, the absence of a marker in a neighbourhood proves nothing. The '
                    + 'presence of one, on the other hand, is reliable: only points explicitly declared '
                    + 'drinkable are kept, and ornamental fountains are excluded.',
                ],
            },
            {
                h2: 'Parks and waterways',
                p: [
                    'What has been recorded clusters where you would expect it: the Thabor, the Gayeulles, '
                    + 'the prairies Saint-Martin, and the banks of the Ille-et-Rance canal. These are also '
                    + 'the routes cyclists naturally take.',
                    'A point sometimes carries an access restriction — private grounds, or reserved for '
                    + 'users of a facility. That is flagged, to save you a detour that ends at a locked gate.',
                ],
            },
            {
                h2: 'Drink before you are thirsty',
                p: [
                    'Dehydration dulls your alertness well before it makes you thirsty, and alertness is '
                    + 'exactly what riding in traffic demands. On a summer ride, drink ahead of need '
                    + 'rather than on demand.',
                    'On a long ride, do not plan your refills from this map alone: some fountains are '
                    + 'drained in winter against frost, others are seasonal, and not all are documented. '
                    + 'A full bottle at the start remains the safest bet.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many drinking water points are there in Rennes?',
                a: 'Close to 90 are recorded across Rennes Métropole, almost all freely accessible. That '
                    + 'total reflects how far the collaborative survey has got, and grows with each '
                    + 'contribution.',
            },
            {
                q: 'Why so few compared with other cities?',
                a: 'Because the Rennes survey in OpenStreetMap is less advanced, not because the city is '
                    + 'less well equipped. The map measures the data available here, not what is on the '
                    + 'ground.',
            },
            {
                q: 'Do Rennes fountains run in winter?',
                a: 'Not all of them: part of the network is shut off to prevent freezing, and some points '
                    + 'only run in the warmer months. The record says so where that is known.',
            },
            {
                q: 'Can I route my ride past these fountains?',
                a: 'Not in Rennes for the time being. Route planning now covers only Bordeaux and the '
                    + 'Tournai area. Pick out your refill points on this map before setting off.',
            },
        ],
    },

    'rennes/reparation-velo': {
        title: 'Bike repair in Rennes — stations and workshops',
        description: 'Map of self-service repair stations and bike workshops across Rennes Métropole: '
            + 'pumps, tools, repairs and servicing.',
        h1: 'Bike repair in Rennes',
        intro: 'A flat tyre outside the university, a derailleur skipping on the climb up rue de '
            + 'Fougères: this map lists the bike repair points across Rennes Métropole, from street posts '
            + 'to community workshops.',
        sections: [
            {
                h2: 'A self-repair culture',
                p: [
                    'Rennes is a young city, and its network shows it: self-repair workshops, where you '
                    + 'fix your own bike with the tools and advice of volunteers, hold an unusually large '
                    + 'place for an urban area of this size.',
                    'Alongside them, bike shops take the work on at an hourly rate, and the posts '
                    + 'installed in the street handle immediate fixes: a floor pump, spanners and '
                    + 'screwdrivers on a cable, free and available at any hour.',
                ],
            },
            {
                h2: 'Anticipate rather than react',
                p: [
                    'Punctures account for most everyday failures, and can be dealt with at the roadside '
                    + 'with a spare inner tube, two tyre levers and a pocket pump. A multi-tool covers '
                    + 'almost everything else: a rubbing brake pad, a loose saddle, a stem to realign.',
                    'A buckled wheel, a worn headset or a hydraulic brake needing a bleed call for '
                    + 'specific tools. That is precisely where a community workshop earns its place: the '
                    + 'tools are there, and the repair stays within your reach.',
                ],
            },
        ],
        faq: [
            {
                q: 'Where can I pump up my tyres for free in Rennes?',
                a: 'At the repair posts installed in public space: almost all have a floor pump, usable '
                    + 'without formality or payment. They appear in light orange on the map.',
            },
            {
                q: 'How does a self-repair workshop work?',
                a: 'You take out a membership, then do the repair yourself at a bench made available to '
                    + 'you, with the workshop\'s tools and the help of volunteers. The cost is usually '
                    + 'limited to the membership and the parts.',
            },
            {
                q: 'Are the street posts always in working order?',
                a: 'No. They are free and permanently available, but their tools are exposed to vandalism '
                    + 'and theft. Best not to rely on them alone for a journey you cannot afford to miss.',
            },
            {
                q: 'Can Sécu’Cycle guide me to a workshop?',
                a: 'Not in Rennes for the time being, as route planning is no longer available there. The '
                    + 'map gives the addresses and, where the information exists, the nature of each '
                    + 'repair point.',
            },
        ],
    },

    'rennes/velos-libre-service': {
        sources: [SOURCE_GBFS_RENNES],
        title: 'LE vélo STAR in Rennes — live stations',
        description: 'Live map of the LE vélo STAR bike-share stations across Rennes Métropole: bikes '
            + 'available and free docks, station by station.',
        h1: 'Bike share in Rennes',
        intro: 'How many bikes are left at the nearest station? This map shows the LE vélo STAR stations '
            + 'in real time — the Rennes Métropole bike-share service operated by STAR — with the number '
            + 'of bikes available and free docks.',
        sections: [
            {
                h2: 'A continuously refreshed map',
                p: [
                    'Availability comes from the GBFS feed published by the operator and is refreshed '
                    + 'automatically. Each station\'s dot shows its state at a glance: bikes available, '
                    + 'station almost empty, empty, full, or out of service.',
                    'The Rennes feed follows an older version of the GBFS standard, which does not '
                    + 'describe vehicle types. A station record therefore shows the total number of bikes '
                    + 'available, without splitting mechanical from electric.',
                ],
            },
            {
                h2: 'An inner-ring service, and unapologetically so',
                p: [
                    'The sixty or so stations cluster inside the ring road, close to the centre and the '
                    + 'campuses. That choice makes the service formidable on its own ground — short trips, '
                    + 'one-way journeys, tram out and bike back — and largely absent elsewhere.',
                    'The dividing line is sharp, and worth knowing before building a daily commute on it. '
                    + 'From the outer ring, a personal bike has no competition; within the ring road, the '
                    + 'opposite often holds.',
                ],
            },
        ],
        faq: [
            {
                q: 'Does the service cover the whole of Rennes Métropole?',
                a: 'No. The sixty or so published stations sit almost entirely within the municipality of '
                    + 'Rennes, inside the ring road. The outlying towns are not served.',
            },
            {
                q: 'Why is the split between mechanical and electric bikes missing?',
                a: 'Because the Rennes feed follows a version of the GBFS standard that predates vehicle '
                    + 'type descriptions. Only the total is published, and we would rather show that than '
                    + 'invent a breakdown.',
            },
            {
                q: 'How do I know whether I will be able to return my bike?',
                a: 'A station\'s dot flags the “full” state, meaning no free dock. Check the destination '
                    + 'station before setting off: in the city centre at rush hour, a full station is common.',
            },
            {
                q: 'Is this availability reliable?',
                a: 'It comes from the operator\'s official feed, refreshed continuously. The time of the '
                    + 'last reading is shown, and a warning appears if it starts to age.',
            },
            {
                q: 'Can I plan a route from a LE vélo STAR station?',
                a: 'Not for now: availability is shown live, but route planning covers only Bordeaux and '
                    + 'the Tournai area.',
            },
        ],
    },

    'rennes/trafic-routier': {
        sources: [SOURCE_TRAFIC_RENNES],
        title: 'Live traffic in Rennes — congestion map',
        description: 'Live road traffic map for Rennes Métropole: ring road, radial and urban roads, '
            + 'free-flowing, heavy or congested, read through a cyclist\'s eyes.',
        h1: 'Live road traffic in Rennes',
        intro: 'Where is Rennes jammed right now? This map shows the state of traffic across the '
            + 'metropolitan area, updated continuously from Rennes Métropole open data — and what that '
            + 'means when you are on a bike.',
        sections: [
            {
                h2: 'Reading the map',
                p: [
                    'Each section is coloured by its state: green for free-flowing traffic, orange for '
                    + 'heavy traffic, red for a congested road, grey when the reading is unusable.',
                    'Peaks concentrate on the ring road, its interchanges and the radial roads feeding '
                    + 'into it, at the times people enter and leave the urban area. Inside, the roads '
                    + 'along the Vilaine and the main boulevards take the strain.',
                ],
            },
            {
                h2: 'A level of detail that helps cyclists',
                p: [
                    'With close to 2,900 sections described, against a few hundred elsewhere, the Rennes '
                    + 'survey is not limited to fast roads: it goes down to the urban streets people '
                    + 'actually cycle on.',
                    'In practice you can compare two possible ways across the centre rather than merely '
                    + 'noting the state of the ring road, and prefer a calmer parallel street of similar '
                    + 'length — often along the Vilaine or the canal.',
                ],
            },
            {
                h2: 'Heavy is not dangerous, free-flowing is not safe',
                p: [
                    'Congestion multiplies filtering and opening doors, two major causes of urban falls. '
                    + 'But a free-flowing road where cars move fast often remains the more formidable of '
                    + 'the two.',
                    'Where Sécu’Cycle plans routes, its safety score combines traffic state with the '
                    + 'speed limit and the presence of cycling infrastructure, rather than mechanically '
                    + 'avoiding every busy road.',
                ],
            },
        ],
        faq: [
            {
                q: 'Where does the Rennes traffic data come from?',
                a: 'From the “État du trafic en temps réel” dataset published by Rennes Métropole on its '
                    + 'open data portal, under the ODbL licence, and refreshed continuously.',
            },
            {
                q: 'Is the Rennes coverage complete?',
                a: 'It is unusually broad — close to 2,900 sections, from fast roads to urban streets — '
                    + 'without going down to the residential street, which is not instrumented.',
            },
            {
                q: 'Does traffic influence the routes suggested in Rennes?',
                a: 'Not for now: route planning covers only Bordeaux and the Tournai area. Where it does '
                    + 'work, the layer feeds into the calculation and, for a comparable journey, favours '
                    + 'the quieter roads.',
            },
        ],
    },

    'rennes/accidents-velo': {
        sources: [SOURCE_BAAC],
        title: 'Cycling accidents in Rennes — accident map',
        description: 'Map of injury accidents involving a cyclist across Rennes Métropole, from 2015 to '
            + '2023, from the BAAC records published by ONISR.',
        h1: 'Cycling accidents in Rennes',
        intro: 'Where are cyclists in Rennes involved in accidents? This map plots the injury accidents '
            + 'involving a bicycle across the metropolitan area between 2015 and 2023, as recorded by the '
            + 'police.',
        sections: [
            {
                h2: 'The denominator trap',
                p: [
                    'Rennes is a student city with a high level of cycling, and that distorts how the map '
                    + 'reads. The areas around the Beaulieu and Villejean campuses, the Vilaine '
                    + 'embankments and the city-centre junctions accumulate accidents partly because they '
                    + 'carry far more cyclists than anywhere else.',
                    'Without exposure data — how many cyclists pass through — a cluster cannot be told '
                    + 'apart from an inherently dangerous place. Read the map as a picture of where '
                    + 'cycling happens as much as of where it goes wrong.',
                ],
            },
            {
                h2: 'What the data covers',
                p: [
                    'Only injury accidents that led to police involvement are recorded. Falls without a '
                    + 'third party and minor collisions settled amicably are absent, as are near misses.',
                    'The severity shown is that of the most seriously injured casualty. Each record gives, '
                    + 'where available, the light conditions, the weather, the type of collision and the '
                    + 'kind of road.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many cycling accidents are recorded in Rennes?',
                a: 'Several hundred injury accidents involving a cyclist are mapped across the area '
                    + 'covered between 2015 and 2023, a minority of which led to hospitalisation.',
            },
            {
                q: 'Where does this data come from?',
                a: 'From the injury accident reports (BAAC) filed by the police and published by ONISR, '
                    + 'via the derived “Accidents de vélo” dataset.',
            },
            {
                q: 'Does a red area mean the place is dangerous?',
                a: 'Not mechanically. It marks a cluster of accidents, which also depends on how many '
                    + 'cyclists pass through — and in Rennes, that number is high.',
            },
            {
                q: 'Is the data up to date?',
                a: 'BAAC records are published several years in arrears. The data currently available '
                    + 'covers the period 2015 to 2023.',
            },
        ],
    },

    'nantes/stationnements-velo': {
        title: 'Bike parking in Nantes — map of stands and shelters',
        description: 'Interactive map of the 5,000 bike parking spots across Nantes Métropole: stands, '
            + 'racks, shelters and secure lockers.',
        h1: 'Bike parking in Nantes',
        intro: 'Where can you lock your bike in Nantes? This map lists the stands, racks, shelters and '
            + 'lockers across the 24 municipalities of the metropolitan area, from both banks of the '
            + 'Loire to the Erdre and Sèvre valleys.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Each point is a parking spot surveyed by OpenStreetMap contributors. With more than '
                    + '5,000 spots recorded, Nantes Métropole is the best-served area on the service.',
                    'Stands dominate: they are the only equipment that lets you lock the frame and a wheel '
                    + 'with a U-lock. Racks and wheel benders hold only the front wheel, which offers poor '
                    + 'protection against theft.',
                ],
            },
            {
                h2: 'A network that follows the Loire',
                p: [
                    'The distribution tells the geography of Nantes: high density in the centre, on the '
                    + 'île de Nantes and around the university districts, thinning out as soon as you '
                    + 'leave the tram corridors.',
                    'The Loire crossings concentrate cycling flows and, with them, parking demand on '
                    + 'either side of the bridges. That is also where enclosed shelters make the difference.',
                ],
            },
            {
                h2: 'A live map, and therefore sometimes behind',
                p: [
                    'The survey comes from OpenStreetMap and resynchronises automatically. It therefore '
                    + 'lives at the pace of contributions: a stand installed last month may be missing, '
                    + 'and one removed may linger.',
                    'The capacity shown carries the same limitation: it is only filled in for some spots. '
                    + 'Its absence does not mean a single space, only that nobody has recorded the number.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many bike parking spots are there in Nantes?',
                a: 'More than 5,000 spots are recorded across the 24 municipalities of Nantes Métropole, '
                    + 'the vast majority of them stands, with several hundred shelters and lockers on top.',
            },
            {
                q: 'What is the difference between a stand and a rack?',
                a: 'A stand is an inverted U-shaped bar that lets you lock the frame and a wheel: it is '
                    + 'the recommended design. A rack, or wheel bender, holds only the front wheel.',
            },
            {
                q: 'Where can I find secure bike parking in Nantes?',
                a: 'Enclosed shelters and individual lockers cluster around Nantes station, the transport '
                    + 'hubs and the park-and-ride sites. They appear under the “Shelters and lockers” '
                    + 'category.',
            },
            {
                q: 'A parking spot is missing from the map — how do I report it?',
                a: 'The data comes from OpenStreetMap: you can add the location directly on '
                    + 'openstreetmap.org and it will be picked up at the next sync.',
            },
            {
                q: 'Can Sécu’Cycle plan a route to these parking spots?',
                a: 'Not for the time being: route planning relies on a road network held in memory, '
                    + 'currently limited to Bordeaux and the Tournai area.',
            },
        ],
    },

    'nantes/toilettes-publiques': {
        title: 'Public toilets in Nantes — interactive map',
        description: 'Map of public toilets in Nantes and its metropolitan area: free, paid and '
            + 'wheelchair-accessible facilities.',
        h1: 'Public toilets in Nantes',
        intro: 'Close to 350 public toilet locations are recorded across Nantes Métropole: the densest '
            + 'survey on the whole of Sécu’Cycle. This map places them and shows, where the information '
            + 'exists, the fee and the accessibility.',
        sections: [
            {
                h2: 'Three colours, one of which says nothing',
                p: [
                    'The marker is coloured by fee: free, paid, or purple. That purple is the one to '
                    + 'understand — it does not mean “paid”, it means nobody has recorded the fee.',
                    'The same holds for wheelchair accessibility: it is flagged where it has been '
                    + 'surveyed, and that field is filled in far less often than the position. An absence '
                    + 'is not a “no”.',
                ],
            },
            {
                h2: 'Opening hours follow the parks',
                p: [
                    'A good share of the Nantes facilities sit in green spaces: the Jardin des plantes, '
                    + 'parc de Procé, île de Versailles, the Erdre banks. Their hours are those of the '
                    + 'grounds, which vary sharply with the season.',
                    'Each location shows the hours where known. Where nothing is given, assume a park '
                    + 'facility closes when the park does.',
                ],
            },
            {
                h2: 'On a route, not only on a map',
                p: [
                    'This map comes from the Sécu’Cycle cycling route planner. On the Loire à Vélo or '
                    + 'along the Erdre, spotting the next facility before setting off saves a detour.',
                ],
            },
        ],
        faq: [
            {
                q: 'What does a purple marker mean?',
                a: 'That the fee is not recorded in the open data, and nothing more. It is not a paid '
                    + 'facility: it is one whose fee nobody has documented.',
            },
            {
                q: 'Are public toilets free in Nantes?',
                a: 'The vast majority are. Street units and those in municipal parks are free; the few '
                    + 'paid ones are concentrated in stations and large venues.',
            },
            {
                q: 'Can the opening hours be trusted?',
                a: 'As an indication only. They come from OpenStreetMap and cover just some locations; '
                    + 'those in parks vary greatly with the season.',
            },
            {
                q: 'Do these toilets appear while planning a route?',
                a: 'Not in Nantes for the time being: route planning covers only Bordeaux and the Tournai '
                    + 'area, for want of a road network loaded beyond that.',
            },
        ],
    },

    'nantes/points-eau': {
        title: 'Drinking water in Nantes — map of fountains',
        description: 'Map of drinking fountains and water points across Nantes Métropole, useful for '
            + 'cyclists, runners and walkers refilling a bottle.',
        h1: 'Drinking water in Nantes',
        intro: 'More than 300 drinking water points are recorded across Nantes Métropole. This map places '
            + 'them so that refilling a bottle does not become a detour — on a bike, on a run, or simply '
            + 'in the heat.',
        sections: [
            {
                h2: 'What counts as a water point',
                p: [
                    'The map keeps only water declared drinkable: street standpipes, taps in parks, '
                    + 'playgrounds, cemeteries and sports facilities. Ornamental fountains are excluded.',
                    'Some points are accessible but conditionally — private grounds, reserved for users of '
                    + 'a facility, open on request. They carry a distinct mark, to save you the detour.',
                ],
            },
            {
                h2: 'The density stops at the metropolitan boundary',
                p: [
                    'Nantes offers one of the tightest networks on the whole service: the Erdre banks, the '
                    + 'île de Nantes, the large parks and the tree-lined squares of the centre hold most '
                    + 'of it.',
                    'That abundance evaporates as soon as you leave. Setting off towards the Loire à Vélo, '
                    + 'pick out your next two refills before leaving the metropolitan area: the density '
                    + 'drops sharply.',
                ],
            },
            {
                h2: 'The network shrinks in winter',
                p: [
                    'Some fountains are drained in the colder months to prevent freezing, and others are '
                    + 'seasonal by design. The map says so where the information exists, but the field is '
                    + 'not always filled in.',
                ],
            },
        ],
        faq: [
            {
                q: 'Where can I refill a bottle in Nantes?',
                a: 'More than 300 drinking water points are mapped across the metropolitan area, the vast '
                    + 'majority freely accessible. The Erdre banks, the île de Nantes and the large parks '
                    + 'hold most of them.',
            },
            {
                q: 'Is the water from these fountains really drinkable?',
                a: 'Only points explicitly declared drinkable in the open data are shown; decorative '
                    + 'fountains are excluded.',
            },
            {
                q: 'Do Nantes fountains run in winter?',
                a: 'Not all of them. Part of the network is shut off to prevent freezing and some points '
                    + 'only run in summer. The record says so where that is known.',
            },
            {
                q: 'Can I rely on these water points beyond the metropolitan area?',
                a: 'No. The survey stops at the 24 municipalities of Nantes Métropole, and the real '
                    + 'density of water points drops markedly outside it in any case.',
            },
            {
                q: 'Can I route my ride past these water points?',
                a: 'Not in Nantes for the time being. Route planning covers only Bordeaux and the Tournai '
                    + 'area; this map remains the right tool for planning ahead.',
            },
        ],
    },

    'nantes/reparation-velo': {
        title: 'Bike repair in Nantes — stations and workshops',
        description: 'Map of self-service repair stations and bike workshops across Nantes Métropole: '
            + 'pumps, tools, repairs and servicing.',
        h1: 'Bike repair in Nantes',
        intro: 'A puncture on the way back from the Loire à Vélo, brakes rubbing at rush hour: this map '
            + 'shows where to repair your bike, or have it repaired, across the 24 municipalities of the '
            + 'metropolitan area.',
        sections: [
            {
                h2: 'Three options, three uses',
                p: [
                    'The street post gets you going again. A floor-mounted pump, spanners and screwdrivers '
                    + 'on a cable, free and available at any hour: it settles a tyre pressure, a slipping '
                    + 'saddle, a rubbing brake.',
                    'The bike shop takes the work on and charges for the time spent. The self-repair '
                    + 'workshop lends you the bench, the tools and the advice in exchange for a '
                    + 'membership: the slow route, and the one that teaches you something.',
                ],
            },
            {
                h2: 'What gets you to the next stop',
                p: [
                    'A spare inner tube, two tyre levers and a pocket pump handle the most common failure '
                    + 'and fit under a saddle. A multi-tool settles the rest of everyday trouble.',
                    'A buckled wheel, a knocking headset or a hydraulic brake needing a bleed call for '
                    + 'dedicated tools and method. Pressing on with what you have usually costs more than '
                    + 'the repair itself.',
                ],
            },
        ],
        faq: [
            {
                q: 'Do the Nantes repair posts charge?',
                a: 'No. Installed in public space, they can be used without formality, day or night. '
                    + 'Nothing guarantees the tools are intact, however.',
            },
            {
                q: 'How do I pump up a tyre in Nantes without a pump?',
                a: 'By heading to the nearest post: almost all carry a floor pump. They stand out in light '
                    + 'orange on the map.',
            },
            {
                q: 'Community workshop or bike shop?',
                a: 'The community workshop if you have time and want to learn: you do the repair yourself, '
                    + 'and the membership opens access to the tools. The bike shop when the repair has to '
                    + 'be done, well and quickly.',
            },
            {
                q: 'Why do some bike shops not appear?',
                a: 'The survey only keeps a shop if it explicitly declares a repair service in '
                    + 'OpenStreetMap. A shop that repairs bikes without saying so stays invisible.',
            },
            {
                q: 'Can I be guided to the nearest workshop?',
                a: 'Not from Sécu’Cycle in Nantes for the time being: route planning covers only Bordeaux '
                    + 'and the Tournai area. The map does give the addresses.',
            },
        ],
    },

    'nantes/eclairage-public': {
        sources: [SOURCE_OSM, SOURCE_LUM_NANTES],
        title: 'Street lighting in Nantes — map of street lights',
        description: 'Map of street lighting across Nantes Métropole: close to 100,000 recorded units '
            + 'and lit streets, to help you plan night rides.',
        h1: 'Street lighting in Nantes',
        intro: 'Which streets are lit at night in Nantes? This map draws on the complete inventory of '
            + 'street lights opened up by Nantes Métropole — close to 100,000 points — to show where the '
            + 'light actually falls.',
        sections: [
            {
                h2: 'The most complete inventory on the service',
                p: [
                    'Nantes Métropole publishes its entire street lighting estate as open data: 97,473 '
                    + 'units at the last count, two and a half times what we have from OpenStreetMap alone.',
                    'These official units are complemented by the points recorded in OpenStreetMap. '
                    + 'Duplicates between the two sources are discarded automatically when two points sit '
                    + 'within a few metres of each other.',
                ],
            },
            {
                h2: 'Where the light stops',
                p: [
                    'At this resolution, it is the breaks that become readable. The Loire, the Erdre and '
                    + 'the green corridors trace sharp discontinuities in the sheet of light: riverbanks '
                    + 'and park paths are pleasant by day and dark by night.',
                    'Street lighting is no substitute for bike lights, which remain compulsory. And '
                    + 'several municipalities switch their lighting off in the middle of the night: a '
                    + 'street marked as lit may be dark at two in the morning.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many street lights does Nantes Métropole have?',
                a: 'The official inventory records 97,473 units, published as open data by Nantes '
                    + 'Métropole, complemented by those recorded in OpenStreetMap.',
            },
            {
                q: 'Why is the Nantes map more precise than elsewhere?',
                a: 'Because Nantes Métropole is one of the few authorities to publish its complete '
                    + 'lighting inventory. Elsewhere we rely mainly on OpenStreetMap, which is patchier.',
            },
            {
                q: 'Does a lit street stay lit all night?',
                a: 'Not everywhere. Several municipalities switch off some or all of their lighting in the '
                    + 'middle of the night. The map shows where the lights are, not when they are on.',
            },
            {
                q: 'Is lighting taken into account when planning a route?',
                a: 'Where Sécu’Cycle plans routes, yes — lighting feeds into each segment\'s safety score. '
                    + 'Route planning is not available in Nantes for the time being.',
            },
        ],
    },

    'nantes/velos-libre-service': {
        sources: [SOURCE_GBFS_NANTES],
        title: 'Bike share in Nantes — live Naolib stations',
        description: 'Live map of the bike-share stations across Nantes Métropole: bikes available and '
            + 'free docks, station by station.',
        h1: 'Bike share in Nantes',
        intro: 'How many bikes are left at the nearest station? This map shows the stations of the Nantes '
            + 'Métropole bike-share service in real time, with the bikes available and the free docks.',
        sections: [
            {
                h2: 'An entirely muscle-powered fleet',
                p: [
                    'The official feed declares no electrically assisted bikes at all: in Nantes, bike '
                    + 'share is pedalled. You feel that in your legs more than on the map — worth knowing '
                    + 'before planning a hilly ride on it.',
                    'Each station therefore shows the two numbers that matter: bikes ready to go and docks '
                    + 'still free. The dot sums them up — available, almost empty, empty, full, or out of '
                    + 'service.',
                ],
            },
            {
                h2: 'Check the arrival, not just the departure',
                p: [
                    'The classic mistake is to look only at the departure station. A full city-centre '
                    + 'station at the end of the day is an ordinary occurrence, and means riding on to the '
                    + 'next one.',
                    'The 120 or so stations concentrate on Nantes and its neighbouring municipalities, '
                    + 'supporting the tram lines. The service shines on the one-way trip — tram out, bike '
                    + 'back.',
                ],
            },
        ],
        faq: [
            {
                q: 'Are there electric bikes in the Nantes bike-share fleet?',
                a: 'No. The official feed declares mechanical bikes only, so the map shows no split '
                    + 'between mechanical and electric.',
            },
            {
                q: 'How many stations are mapped?',
                a: 'Around 120, spread across Nantes and the neighbouring municipalities. Every station '
                    + 'published in the official feed appears on this map.',
            },
            {
                q: 'How often is availability updated?',
                a: 'Continuously, from the operator\'s GBFS feed. The time of the last reading is shown, '
                    + 'and a warning appears if it starts to age.',
            },
            {
                q: 'Can I plan a route from a station?',
                a: 'Not for the time being: availability is shown live, but route planning covers only '
                    + 'Bordeaux and the Tournai area.',
            },
        ],
    },

    'nantes/trafic-routier': {
        sources: [SOURCE_TRAFIC_NANTES],
        title: 'Live traffic in Nantes — congestion map',
        description: 'Live road traffic map for Nantes Métropole: ring road, Loire bridges and urban '
            + 'roads, free-flowing, heavy or congested.',
        h1: 'Live road traffic in Nantes',
        intro: 'Traffic in Nantes turns on a small number of crossing points. This map shows their state, '
            + 'refreshed continuously from Nantes Métropole open data.',
        sections: [
            {
                h2: 'An area held by its crossings',
                p: [
                    'Green marks a free-flowing road, orange heavy traffic, red congestion, grey an '
                    + 'unusable reading. Around 860 main sections are instrumented.',
                    'The Loire governs the rest. The crossings are few relative to the flows they absorb: '
                    + 'when they turn red, it is not one congestion among others — it is the whole area '
                    + 'that seizes up.',
                ],
            },
            {
                h2: 'The cyclist\'s problem: you cannot go around a bridge',
                p: [
                    'On a saturated urban road, a cyclist almost always has an alternative — a parallel '
                    + 'street, a quieter route. On a crossing, no: the structure is the only way through.',
                    'Hence the value of checking the map before setting off rather than once committed. '
                    + 'Shifting your departure by twenty minutes, or aiming for another crossing, costs '
                    + 'less than a bridge at a standstill.',
                ],
            },
            {
                h2: 'What the planner does with it',
                p: [
                    'Where Sécu’Cycle plans routes, this layer feeds directly into the safety score: for a '
                    + 'comparable journey, it steers away from red roads when a credible alternative exists.',
                ],
            },
        ],
        faq: [
            {
                q: 'Where does the Nantes traffic data come from?',
                a: 'From the “Fluidité des axes routiers” dataset published by Nantes Métropole on its '
                    + 'open data portal, under the ODbL licence, and refreshed continuously.',
            },
            {
                q: 'Why does my street not appear on the map?',
                a: 'Because only main roads are instrumented, around 860 sections. Residential streets are '
                    + 'not measured.',
            },
            {
                q: 'Can a red bridge be avoided by bike?',
                a: 'Rarely without lengthening the journey noticeably. That is why checking before you '
                    + 'leave beats adapting en route.',
            },
            {
                q: 'Does traffic change the route suggested in Nantes?',
                a: 'Not for now, as route planning covers only Bordeaux and the Tournai area. Where it '
                    + 'works, congestion feeds into the calculation.',
            },
        ],
    },

    'nantes/accidents-velo': {
        sources: [SOURCE_BAAC],
        title: 'Cycling accidents in Nantes — accident map',
        description: 'Map of injury accidents involving a cyclist across Nantes Métropole, from 2015 to '
            + '2023, from the BAAC records.',
        h1: 'Cycling accidents in Nantes',
        intro: 'This map places the injury accidents involving a cyclist recorded across Nantes Métropole '
            + 'between 2015 and 2023. It is instructive provided you know what it leaves out.',
        sections: [
            {
                h2: 'The Nantes blind spot: tram rails',
                p: [
                    'The BAAC register only records an accident that led to police involvement. An '
                    + 'isolated fall, with no third-party vehicle, falls outside it. Yet in Nantes, a wheel '
                    + 'caught in a tram rail is one of the classic ways to come off a bike.',
                    'Along the tram lines, the map is therefore systematically optimistic. Cross rails at '
                    + 'right angles, widening your line if you must, particularly on wet ground.',
                ],
            },
            {
                h2: 'Hot spots that are first of all forced passages',
                p: [
                    'Zoomed out, the map aggregates accidents into a density; zooming in, each point '
                    + 'separates and takes the colour of its severity — slight injury, hospitalised '
                    + 'injury, fatal accident.',
                    'The sharpest clusters read where geography forces the passage. The Loire bridges and '
                    + 'the Erdre crossings channel every cycling flow, and accumulate accidents in '
                    + 'proportion.',
                ],
            },
            {
                h2: 'From a red dot to route planning',
                p: [
                    'Where Sécu’Cycle plans routes, each accident is attached to the road graph segments '
                    + 'within a 25-metre radius, where it applies a penalty to the safety score. That '
                    + 'penalty is capped, precisely because the data carries no exposure denominator.',
                ],
            },
        ],
        faq: [
            {
                q: 'Why so few accidents along the tram lines?',
                a: 'Because a fall on a rail most often happens without a third-party vehicle, and '
                    + 'therefore generates no injury accident report.',
            },
            {
                q: 'How many cycling accidents does the map really record?',
                a: 'Only those that led to police involvement. Falls on their own, minor collisions '
                    + 'settled amicably and near misses are all absent.',
            },
            {
                q: 'Does a red area mean the place is dangerous?',
                a: 'Not necessarily. It marks a cluster of accidents, which also depends on how many '
                    + 'cyclists pass through. A busy bridge accumulates them mechanically.',
            },
            {
                q: 'How recent is the data?',
                a: 'It runs to 2023. ONISR publishes the injury accident reports several years in arrears.',
            },
            {
                q: 'Do these accidents change the routes suggested in Nantes?',
                a: 'Not for the time being, as route planning covers only Bordeaux and the Tournai area. '
                    + 'Where it works, they lower the safety score of the segments concerned.',
            },
        ],
    },

    'paris/stationnements-velo': {
        title: 'Bike parking in Paris — map of stands and shelters',
        description: 'Interactive map of bike parking across the Métropole du Grand Paris: stands, '
            + 'shelters and Véligo lockers, with their capacity.',
        h1: 'Bike parking in Paris',
        intro: 'Where can you lock your bike in Paris? This map lists the stands, racks, shelters and '
            + 'lockers across the capital and the 130 municipalities of Greater Paris, with the type of '
            + 'equipment and, where known, the number of spaces.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Each point is a spot surveyed on the ground by OpenStreetMap contributors. Paris has '
                    + 'converted car parking spaces into bike stands on a large scale, and the density in '
                    + 'the central arrondissements reflects that.',
                    'Shelters and enclosed lockers appear separately. In Île-de-France these are mainly '
                    + 'the Véligo lockers installed around railway and metro stations, designed for '
                    + 'long-stay parking.',
                ],
            },
            {
                h2: 'Parking in Paris without losing your bike',
                p: [
                    'Paris accounts for most of the bike thefts reported in Île-de-France. The rule '
                    + 'matters more than anywhere: lock the frame to a fixed point, never the wheel alone, '
                    + 'and use a certified U-lock.',
                    'Choose busy, lit spots over dead ends and quiet underground car parks. For anything '
                    + 'longer than a few hours, an enclosed locker is worth the detour.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The survey comes from OpenStreetMap and is resynchronised automatically. It is live '
                    + 'but imperfect: a recently installed stand may be missing, and one that has been '
                    + 'removed may linger.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many bike parking spots are there in Paris?',
                a: 'The counter at the top of the map gives the total recorded at the moment you consult '
                    + 'it, together with the number of declared spaces.',
            },
            {
                q: 'Where can I find a secure bike locker in Île-de-France?',
                a: 'Enclosed shelters and lockers, mainly Véligo units installed near railway stations and '
                    + 'transport hubs, appear on the map under the “Shelters and lockers” category.',
            },
            {
                q: 'Can I lock my bike to a post or a railing?',
                a: 'Nothing forbids it as long as the bike does not block the way, but a smooth post can '
                    + 'be lifted off and a railing sawn through: these are makeshift points, not parking.',
            },
            {
                q: 'A parking spot is missing from the map — how do I report it?',
                a: 'The data comes from OpenStreetMap: you can add the location directly on '
                    + 'openstreetmap.org and it will be picked up at the next sync.',
            },
            {
                q: 'Can Sécu’Cycle plan a route to these parking spots?',
                a: 'Not in Greater Paris yet. Route planning relies on a road network held in memory by '
                    + 'our server, which does not cover Île-de-France.',
            },
        ],
    },

    'paris/toilettes-publiques': {
        title: 'Public toilets in Paris — interactive map',
        description: 'Map of public toilets in Paris and Greater Paris: free sanisettes, paid facilities '
            + 'and wheelchair-accessible units.',
        h1: 'Public toilets in Paris',
        intro: 'This map locates the public toilets recorded in Paris and the municipalities of the '
            + 'metropolitan area, telling free facilities apart from paid ones and flagging those that '
            + 'are wheelchair accessible.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Paris is one of the few cities where street toilets are free: the automatic '
                    + 'sanisettes, spread across every arrondissement, have been free of charge since 2006.',
                    'Opening hours are not always recorded in the data: many facilities in squares and '
                    + 'parks close with them, often at nightfall.',
                ],
            },
            {
                h2: 'Accessibility',
                p: [
                    'Toilets flagged as accessible have a turning space and grab rails. Parisian '
                    + 'sanisettes are designed for wheelchair access, but the field is not always filled '
                    + 'in for other facilities.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The locations come from OpenStreetMap, resynchronised automatically. A facility '
                    + 'closed for works or permanently removed may linger for a while.',
                ],
            },
        ],
        faq: [
            {
                q: 'Are public toilets free in Paris?',
                a: 'The City of Paris automatic sanisettes have been free since 2006. Other facilities, '
                    + 'particularly in stations and some large venues, may charge.',
            },
            {
                q: 'Are Parisian sanisettes open at night?',
                a: 'Most run continuously, unlike the facilities installed in parks and squares, which '
                    + 'close with them.',
            },
            {
                q: 'How do I find the nearest toilets while cycling?',
                a: 'Zoom in on your position: the map shows the facilities recorded around you, with '
                    + 'whether they are free and accessible.',
            },
            {
                q: 'Do these toilets appear while planning a route?',
                a: 'Not in Île-de-France. Sécu’Cycle navigation relies on a road network held in memory, '
                    + 'which does not yet cover the region.',
            },
        ],
    },

    'paris/points-eau': {
        title: 'Drinking water in Paris — map of fountains',
        description: 'Map of drinking fountains and water points in Paris and Greater Paris: Wallace '
            + 'fountains, sparkling water fountains and street standpipes.',
        h1: 'Drinking water in Paris',
        intro: 'Where can you refill a bottle while cycling in Greater Paris? This map lists the freely '
            + 'accessible drinking fountains and water points, from the Wallace fountains of the centre '
            + 'to the standpipes of the inner suburbs.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Paris has one of the densest networks of public fountains in the world, descended '
                    + 'from the Wallace fountains given to the city in 1872 and still in service.',
                    'A large part of that network is seasonal: the Wallace fountains, vulnerable to '
                    + 'frost, are traditionally shut from mid-November to mid-March. Newer standpipes '
                    + 'often run all year.',
                ],
            },
            {
                h2: 'Staying hydrated on a bike',
                p: [
                    'In the city, dehydration sets in without being felt, especially in warm weather and '
                    + 'on journeys broken up by traffic lights. Pick out one or two water points along '
                    + 'your route before setting off.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The locations come from OpenStreetMap, resynchronised automatically. A fountain out '
                    + 'of service or shut for the cold season stays on the map: the survey records the '
                    + 'installation, not its current state.',
                ],
            },
        ],
        faq: [
            {
                q: 'Is the water from Parisian fountains drinkable?',
                a: 'Yes. The public fountains recorded here deliver controlled drinking water. Points '
                    + 'flagged as non-potable in the data are excluded.',
            },
            {
                q: 'Do Wallace fountains run in winter?',
                a: 'No: they are generally shut from mid-November to mid-March to prevent the pipes '
                    + 'freezing. Newer standpipes often stay in service.',
            },
            {
                q: 'Are there sparkling water fountains in Paris?',
                a: 'Yes, several fountains dispense carbonated water free of charge. Where they are '
                    + 'recorded as such in the data, they appear on this map.',
            },
            {
                q: 'Can I route my ride past these water points?',
                a: 'Not in Paris yet: the route planner does not cover Île-de-France, for want of a road '
                    + 'network loaded for that area.',
            },
        ],
    },

    'paris/velos-libre-service': {
        sources: [SOURCE_GBFS_PARIS],
        title: 'Vélib’ stations in Paris — live availability',
        description: 'Live map of Vélib’ Métropole stations: mechanical and electric bikes available, '
            + 'free docks, station by station.',
        h1: 'Bike share in Paris',
        intro: 'How many bikes are left at the nearest station? This map shows the Vélib’ Métropole '
            + 'stations with, for each one, the number of bikes available and free docks.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Each station shows the bikes available and the free docks at the moment you consult '
                    + 'it. Vélib’ Métropole runs a mixed fleet: mechanical bikes alongside electrically '
                    + 'assisted ones.',
                    'The service extends well beyond central Paris: the network covers much of the '
                    + 'metropolitan area, which makes suburb-to-suburb journeys possible without passing '
                    + 'through the centre.',
                ],
            },
            {
                h2: 'A few useful habits',
                p: [
                    'At rush hour, station stocks empty in the morning and fill in the evening: plan '
                    + 'ahead by picking out two arrival stations close to each other.',
                    'Check the state of the bike before setting off — brakes, tyres, saddle — and report '
                    + 'any fault from the app: a reported bike is taken out of service.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'Availability comes from the public Vélib’ Métropole GBFS feed, queried at the pace '
                    + 'it publishes. The map therefore reflects the last known state of the service.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many Vélib’ stations are there?',
                a: 'The network has around 1,400 stations across Paris and a hundred or so municipalities '
                    + 'of the metropolitan area. The map shows those published in the official feed.',
            },
            {
                q: 'Is the availability shown live?',
                a: 'It comes from the service\'s official feed, refreshed continuously. A lag of a few '
                    + 'moments between the display and the ground is possible.',
            },
            {
                q: 'How do I tell mechanical bikes from electric ones?',
                a: 'Each station record breaks the two categories down where the feed publishes them.',
            },
            {
                q: 'Can I return a bike to any station?',
                a: 'Yes, subject to free docks. If the station you are aiming for is full, the map lets '
                    + 'you spot another nearby.',
            },
            {
                q: 'Does Sécu’Cycle plan routes from a Vélib’ station?',
                a: 'Not yet. The station map is up to date across the whole Vélib’ area, but route '
                    + 'planning does not cover Île-de-France.',
            },
        ],
    },

    'paris/accidents-velo': {
        sources: [SOURCE_BAAC],
        title: 'Cycling accidents in Paris — risk area map',
        description: 'Map of injury accidents involving a cyclist in Paris and Greater Paris, from '
            + 'official data.',
        h1: 'Cycling accidents in Paris',
        intro: 'This map locates the injury accidents involving a cyclist recorded in Paris and the '
            + 'municipalities of the metropolitan area. It is there to spot the junctions and roads where '
            + 'vigilance matters most.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Each point is an injury accident — one with at least one casualty — recorded by the '
                    + 'police in the BAAC file. The colour shows the severity.',
                    'In Paris, clusters appear unsurprisingly on the main roads and the gyratory squares, '
                    + 'where flows cross in numbers.',
                ],
            },
            {
                h2: 'The most common configurations',
                p: [
                    'Two situations dominate in the city. A vehicle turning right across the path of a '
                    + 'cyclist going straight on, particularly dangerous with a lorry. And dooring — a '
                    + 'door opened without looking.',
                    'At junctions, bike boxes let you position yourself ahead of the traffic and be seen. '
                    + 'Turning right on red, where a sign allows it, gets you clear of the pack.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The data comes from the BAAC file published each year by ONISR on data.gouv.fr. It '
                    + 'is therefore official but retrospective: the most recent year available lags '
                    + 'behind the present.',
                ],
            },
        ],
        faq: [
            {
                q: 'Does this map record every cycling accident?',
                a: 'No. Only injury accidents that led to a police report enter the BAAC file. Falls on '
                    + 'their own and near misses are absent.',
            },
            {
                q: 'Is the data up to date?',
                a: 'It follows the ONISR publication schedule: the latest year available covers a '
                    + 'completed calendar year.',
            },
            {
                q: 'Is cycling in Paris dangerous?',
                a: 'The number of accidents rises mechanically with the number of cyclists, but studies '
                    + 'converge on the safety-in-numbers effect: the more people cycle, the lower the risk '
                    + 'per kilometre ridden.',
            },
            {
                q: 'Do these accidents influence the routes suggested in Paris?',
                a: 'Elsewhere, yes: the layer weighs on the safety score. In Paris the question does not '
                    + 'arise yet, as route planning is not available there.',
            },
        ],
    },

    'paris/reparation-velo': {
        title: 'Bike repair in Paris — workshops and pumps',
        description: 'Map of repair workshops, bike shops and public pumping stations in Paris and '
            + 'Greater Paris.',
        h1: 'Bike repair in Paris',
        intro: 'An inner tube to change, a derailleur skipping, a tyre to reinflate: this map lists the '
            + 'workshops, bike shops and freely accessible pumping stations of Paris and the metropolitan '
            + 'area.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Three kinds of point sit side by side. Bike shops and professional workshops, which '
                    + 'repair, service and sell. Community self-repair workshops. And the pumping and '
                    + 'repair stations installed in public space.',
                    'Opening hours are not always recorded: a community workshop often opens only a few '
                    + 'afternoons a week. Check before making the trip.',
                ],
            },
            {
                h2: 'What you can repair yourself',
                p: [
                    'A puncture, a brake to adjust, a chain to tension or lubricate are within everyone\'s '
                    + 'reach with a little method. Carrying a spare inner tube and two tyre levers turns a '
                    + 'ruined journey into a short stop.',
                    'Leave to a professional anything touching structural safety — fork, frame, buckled '
                    + 'wheel, headset — and the electrical system of an assisted bike.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The locations come from OpenStreetMap, resynchronised automatically. A recent '
                    + 'workshop may be missing, and a closed shop may linger for a while.',
                ],
            },
        ],
        faq: [
            {
                q: 'Where can I pump up my tyres for free in Paris?',
                a: 'The freely accessible pumping stations installed in public space appear on this map. '
                    + 'Many bike shops also let you use a pump.',
            },
            {
                q: 'What is a self-repair workshop?',
                a: 'A place, usually run by a non-profit, that provides tools, second-hand parts and '
                    + 'advice so that you can repair your own bike.',
            },
            {
                q: 'Is there financial help for repairs?',
                a: 'National and local schemes supporting bike repair and purchase exist, with conditions '
                    + 'that change over time.',
            },
            {
                q: 'Can I be guided to the nearest workshop?',
                a: 'Not from Sécu’Cycle in Greater Paris: route planning is not available there yet, for '
                    + 'want of a road network loaded for the area.',
            },
        ],
    },

    'lyon/stationnements-velo': {
        title: 'Bike parking in Lyon — map of stands and shelters',
        description: 'Interactive map of bike parking across the Métropole de Lyon: stands, shelters and '
            + 'secure lockers.',
        h1: 'Bike parking in Lyon',
        intro: 'Where can you lock your bike in Lyon? This map lists the stands, racks, shelters and '
            + 'lockers across the 58 municipalities of the metropolitan area, from the Presqu’île to '
            + 'Villeurbanne and from Vaulx-en-Velin to Sainte-Foy-lès-Lyon.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Each point is a spot surveyed on the ground by OpenStreetMap contributors. Stands '
                    + 'dominate by a wide margin: they are the only equipment that lets you lock the frame '
                    + 'and a wheel with a U-lock.',
                    'Shelters and enclosed lockers appear separately. They are found mainly around the '
                    + 'stations — Part-Dieu, Perrache, Vaise — and the major transport hubs.',
                ],
            },
            {
                h2: 'Parking in a hilly city',
                p: [
                    'Lyon\'s topography has a direct consequence for parking: on the climbs of the '
                    + 'Croix-Rousse or Fourvière, a poorly secured bike tips over and drags its neighbours '
                    + 'with it. Check that the frame is properly held, not just resting.',
                    'Otherwise the usual rules apply: a certified U-lock, the frame attached to a fixed '
                    + 'point, and a busy spot rather than a quiet side street.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The survey comes from OpenStreetMap and is resynchronised automatically. A recently '
                    + 'installed stand may be missing, and one that has been removed may linger.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many bike parking spots are there in Lyon?',
                a: 'The counter at the top of the map shows the total recorded across the 58 '
                    + 'municipalities of the metropolitan area at the moment you consult it.',
            },
            {
                q: 'Where can I find secure bike parking in Lyon?',
                a: 'Enclosed shelters and lockers appear under the “Shelters and lockers” category, mainly '
                    + 'around the stations and transport hubs.',
            },
            {
                q: 'What is the difference between a stand and a rack?',
                a: 'A stand is an inverted U-shaped bar that lets you lock the frame and a wheel: it is '
                    + 'the recommended design. A rack holds only the front wheel.',
            },
            {
                q: 'Can a route be planned to these parking spots?',
                a: 'Not in the Lyon metropolitan area yet. Route planning requires a road network held in '
                    + 'memory by our server, whose extent is narrower than that of the data.',
            },
        ],
    },

    'lyon/toilettes-publiques': {
        title: 'Public toilets in Lyon — interactive map',
        description: 'Map of public toilets in Lyon and its metropolitan area: free, paid and '
            + 'wheelchair-accessible facilities.',
        h1: 'Public toilets in Lyon',
        intro: 'This map locates the public toilets recorded across the Métropole de Lyon, telling free '
            + 'facilities apart from paid ones and flagging those that are wheelchair accessible.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Street facilities sit alongside those in parks and gardens — the parc de la Tête d’Or '
                    + 'above all — on the redeveloped banks of the Rhône and the Saône, and in transport hubs.',
                    'Many of these close with the park that houses them, often at nightfall and earlier in '
                    + 'winter. Opening hours appear on the record where they have been surveyed.',
                ],
            },
            {
                h2: 'Accessibility',
                p: [
                    'Toilets flagged as accessible have a turning space and grab rails. The information '
                    + 'comes from OpenStreetMap surveys and is not filled in everywhere: an absence is not '
                    + 'a “no”.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The locations come from OpenStreetMap, resynchronised automatically. A facility '
                    + 'closed for works may stay on the map for a while.',
                ],
            },
        ],
        faq: [
            {
                q: 'Are public toilets free in Lyon?',
                a: 'Most of the street facilities recorded are free. Some venues, particularly in '
                    + 'stations, still charge: the record says so where the information exists.',
            },
            {
                q: 'Are there toilets along the banks of the Rhône?',
                a: 'Yes, several facilities line the redeveloped banks and the parc de la Tête d’Or. They '
                    + 'do follow the opening hours of the grounds.',
            },
            {
                q: 'How do I find the nearest toilets while cycling?',
                a: 'Zoom in on your position: the map shows the facilities recorded around you. The banks '
                    + 'of the Rhône and the Saône are well provided for.',
            },
            {
                q: 'Do these facilities appear on a planned route?',
                a: 'Not in Lyon: Sécu’Cycle navigation does not yet cover the metropolitan area. The map '
                    + 'stands on its own, which is enough to plan ahead.',
            },
        ],
    },

    'lyon/points-eau': {
        title: 'Drinking water in Lyon — map of fountains',
        description: 'Map of drinking fountains and water points in Lyon and its metropolitan area, for '
            + 'refilling a bottle.',
        h1: 'Drinking water in Lyon',
        intro: 'Where can you refill a bottle in Lyon? This map lists the freely accessible drinking '
            + 'fountains and water points across the metropolitan area, from the squares of the '
            + 'Presqu’île to the parks.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Lyon\'s fountains cluster in the parks, on the squares and along the redeveloped '
                    + 'banks of the Rhône. The parc de la Tête d’Or holds several on its own.',
                    'Part of the network is shut off in winter to prevent freezing: the map shows the '
                    + 'installation all year round, without indicating when it is closed.',
                ],
            },
            {
                h2: 'Staying hydrated on a bike',
                p: [
                    'Lyon\'s terrain raises the effort faster than you would think: a climb up the '
                    + 'Croix-Rousse or Fourvière is a sustained effort, even over a short distance. Plan '
                    + 'your refills before the climb rather than after it.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The locations come from OpenStreetMap, resynchronised automatically. A fountain out '
                    + 'of service or shut for the season stays on the map: the survey records the '
                    + 'installation, not its current state.',
                ],
            },
        ],
        faq: [
            {
                q: 'Is the water from Lyon fountains drinkable?',
                a: 'Yes. Only points delivering drinking water are shown; those recorded as non-potable in '
                    + 'the data are excluded.',
            },
            {
                q: 'Do the fountains run all year round?',
                a: 'Part of the network is closed during the cold months to prevent the pipes freezing. '
                    + 'Fountains inside buildings or heated facilities are less affected.',
            },
            {
                q: 'A water point is missing from the map — how do I report it?',
                a: 'The data comes from OpenStreetMap: add it on openstreetmap.org and it will be picked '
                    + 'up at the next sync.',
            },
            {
                q: 'Can the route planner take me past these fountains?',
                a: 'Not in Lyon yet. Route planning relies on a road network loaded for a narrower area '
                    + 'than that of the data.',
            },
        ],
    },

    'lyon/velos-libre-service': {
        sources: [SOURCE_GBFS_LYON],
        title: 'Vélo’v stations in Lyon — live availability',
        description: 'Live map of Vélo’v stations: mechanical and electric bikes available, free docks.',
        h1: 'Bike share in Lyon',
        intro: 'How many bikes are left at the nearest station? This map shows the Vélo’v stations with, '
            + 'for each one, the number of bikes available and free docks.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Launched in 2005, Vélo’v was the first large French bike-share system and served as '
                    + 'the model for most of those that followed. The network covers Lyon, Villeurbanne '
                    + 'and the neighbouring municipalities.',
                    'Each station shows the bikes available and the free docks. The fleet is mixed: a '
                    + 'station record breaks down mechanical bikes and electrically assisted ones.',
                ],
            },
            {
                h2: 'The terrain changes everything',
                p: [
                    'In Lyon more than anywhere, the direction of travel matters. Stations on the heights '
                    + '— Croix-Rousse, Fourvière, Saint-Just — empty downhill over the course of the day, '
                    + 'and refill by lorry rather than by pedal.',
                    'Check the state of the bike before setting off — the brakes above all, essential on '
                    + 'the descents — and report any fault from the app: a reported bike is taken out of '
                    + 'service.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'Availability comes from the service\'s public GBFS feed, queried at the pace it '
                    + 'publishes. Sécu’Cycle is not affiliated with the operator.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many Vélo’v stations are there?',
                a: 'The network has on the order of 430 stations across Lyon, Villeurbanne and the '
                    + 'neighbouring municipalities. The map shows those published in the official feed.',
            },
            {
                q: 'Is the availability shown live?',
                a: 'It comes from the service\'s official feed, refreshed continuously. A lag of a few '
                    + 'moments remains possible, particularly at rush hour.',
            },
            {
                q: 'Are there electrically assisted Vélo’v bikes?',
                a: 'Yes, part of the fleet is electric. Each station record breaks down the split between '
                    + 'mechanical and electric bikes where the feed publishes it.',
            },
            {
                q: 'Can Sécu’Cycle guide me from a Vélo’v station?',
                a: 'Not yet: availability is shown live, but route planning does not cover the Lyon '
                    + 'metropolitan area.',
            },
        ],
    },

    'lyon/accidents-velo': {
        sources: [SOURCE_BAAC],
        title: 'Cycling accidents in Lyon — risk area map',
        description: 'Map of injury accidents involving a cyclist across the Métropole de Lyon, from '
            + 'official data.',
        h1: 'Cycling accidents in Lyon',
        intro: 'This map locates the injury accidents involving a cyclist recorded across the Métropole '
            + 'de Lyon. It is there to spot the junctions and roads where vigilance matters most.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Each point is an injury accident — one with at least one casualty — recorded by the '
                    + 'police in the BAAC file. Accidents are coloured by severity.',
                    'Clusters appear on the main roads and at major junctions, as well as at the crossing '
                    + 'points of the Rhône and the Saône, where flows converge.',
                ],
            },
            {
                h2: 'The most common configurations',
                p: [
                    'A vehicle turning right across the path of a cyclist going straight on remains the '
                    + 'great classic, particularly dangerous with a heavy vehicle.',
                    'The terrain adds a local factor: on a descent, a cyclist\'s speed is often '
                    + 'underestimated by drivers pulling out. Anticipate that, and make yourself visible '
                    + 'well ahead.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The data comes from the BAAC file published each year by ONISR on data.gouv.fr. It is '
                    + 'official but retrospective, and the locations carry the precision of the original '
                    + 'report.',
                ],
            },
        ],
        faq: [
            {
                q: 'Does this map record every cycling accident?',
                a: 'No. Only injury accidents that led to a police report enter the BAAC file. Falls on '
                    + 'their own and near misses are absent.',
            },
            {
                q: 'Is the data up to date?',
                a: 'It follows the ONISR publication schedule: the latest year available covers a '
                    + 'completed calendar year.',
            },
            {
                q: 'Is cycling in Lyon dangerous?',
                a: 'The number of accidents rises with the number of cyclists, but individual risk falls '
                    + 'as cycling becomes more widespread.',
            },
            {
                q: 'Do these accidents change the route suggested in Lyon?',
                a: 'Where navigation works, yes: the layer weighs on the safety score. The Lyon '
                    + 'metropolitan area is not covered yet.',
            },
        ],
    },

    'lyon/reparation-velo': {
        title: 'Bike repair in Lyon — workshops and pumps',
        description: 'Map of repair workshops, bike shops and public pumping stations across the '
            + 'Métropole de Lyon.',
        h1: 'Bike repair in Lyon',
        intro: 'An inner tube to change, brakes to adjust, a tyre to reinflate: this map lists the '
            + 'workshops, bike shops and freely accessible pumping stations across the metropolitan area.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Three kinds of point sit side by side: bike shops and professional workshops, '
                    + 'community self-repair workshops where you do the work yourself with the tools and '
                    + 'advice of volunteers, and the pumping stations installed in public space.',
                    'Opening hours are not always recorded, and a community workshop often opens only a '
                    + 'few afternoons a week: best to check before making the trip.',
                ],
            },
            {
                h2: 'Brakes, a Lyon priority',
                p: [
                    'In a hilly city, brake pads wear out far faster than elsewhere. Check them regularly: '
                    + 'a pad worn to the metal loses most of its stopping power on a descent.',
                    'A puncture, a chain to tension or a derailleur to adjust remain within everyone\'s '
                    + 'reach. Leave to a professional anything touching structural safety.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The locations come from OpenStreetMap, resynchronised automatically. A recent '
                    + 'workshop may be missing, and a closed shop may linger for a while.',
                ],
            },
        ],
        faq: [
            {
                q: 'Where can I pump up my tyres for free in Lyon?',
                a: 'The freely accessible pumping stations installed in public space appear on this map. '
                    + 'Many bike shops also let you use a pump.',
            },
            {
                q: 'What is a self-repair workshop?',
                a: 'A place, usually run by a non-profit, that provides tools, second-hand parts and '
                    + 'advice so that you can repair your own bike.',
            },
            {
                q: 'How often should a bike be serviced?',
                a: 'A quick check of the brakes, tyres and chain every month is enough for daily use. In a '
                    + 'hilly city, watch the brakes more closely.',
            },
            {
                q: 'Can I be guided to the nearest workshop?',
                a: 'Not through Sécu’Cycle in Lyon: route planning is not available there yet. The map '
                    + 'does give the locations.',
            },
        ],
    },

    'lille/stationnements-velo': {
        title: 'Bike parking in Lille — map of stands and shelters',
        description: 'Interactive map of bike parking across the Métropole Européenne de Lille: stands, '
            + 'shelters and secure lockers.',
        h1: 'Bike parking in Lille',
        intro: 'Where can you lock your bike in Lille? This map lists the stands, racks, shelters and '
            + 'lockers across the 95 municipalities of the Métropole Européenne de Lille, from Lille to '
            + 'Roubaix and from Tourcoing to Villeneuve-d’Ascq.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Each point is a spot surveyed on the ground by OpenStreetMap contributors. Stands '
                    + 'dominate: they are the only equipment that lets you lock the frame and a wheel with '
                    + 'a U-lock.',
                    'Shelters and enclosed lockers appear separately. In a polycentric area, they cluster '
                    + 'around the stations of Lille, Roubaix and Tourcoing rather than in a single centre.',
                ],
            },
            {
                h2: 'Parking on cobbles',
                p: [
                    'Cobbles are part of daily cycling here, and they shake a bike more than smooth '
                    + 'tarmac does. A bike left resting rather than properly secured tips over more '
                    + 'easily on uneven ground.',
                    'Otherwise the usual rules apply: a certified U-lock, the frame attached to a fixed '
                    + 'point, and a busy, lit spot rather than a quiet side street.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The survey comes from OpenStreetMap and is resynchronised automatically. A recently '
                    + 'installed stand may be missing, and one that has been removed may linger.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many bike parking spots are there in Lille?',
                a: 'The counter at the top of the map shows the total recorded across the 95 '
                    + 'municipalities of the metropolitan area at the moment you consult it.',
            },
            {
                q: 'Where can I leave my bike near a station in the Lille area?',
                a: 'Enclosed shelters and lockers appear under the “Shelters and lockers” category, '
                    + 'mainly around the stations of Lille, Roubaix and Tourcoing.',
            },
            {
                q: 'What is the difference between a stand and a rack?',
                a: 'A stand is an inverted U-shaped bar that lets you lock the frame and a wheel: it is '
                    + 'the recommended design. A rack holds only the front wheel.',
            },
            {
                q: 'Can Sécu’Cycle plan a route to these stands?',
                a: 'Not in the Lille metropolitan area yet. The map is fed by open data, but route '
                    + 'planning requires a road network held in memory for that area.',
            },
        ],
    },

    'lille/toilettes-publiques': {
        title: 'Public toilets in Lille — interactive map',
        description: 'Map of public toilets in Lille and its metropolitan area: free, paid and '
            + 'wheelchair-accessible facilities.',
        h1: 'Public toilets in Lille',
        intro: 'This map locates the public toilets recorded across the Métropole Européenne de Lille, '
            + 'telling free facilities apart from paid ones and flagging those that are wheelchair '
            + 'accessible.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Street facilities sit alongside those in parks, stations and transport hubs. In a '
                    + 'polycentric area, provision follows the town centres rather than a single core.',
                    'Opening hours are not always recorded: facilities in parks close with them, often at '
                    + 'nightfall and earlier in winter.',
                ],
            },
            {
                h2: 'Accessibility',
                p: [
                    'Toilets flagged as accessible have a turning space and grab rails. The information '
                    + 'comes from OpenStreetMap surveys and is not filled in everywhere: an absence is not '
                    + 'a “no”.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The locations come from OpenStreetMap, resynchronised automatically. A facility '
                    + 'closed for works may stay on the map for a while.',
                ],
            },
        ],
        faq: [
            {
                q: 'Are public toilets free in Lille?',
                a: 'Most of the street facilities recorded are free. Some venues, particularly in '
                    + 'stations, still charge: the record says so where the information exists.',
            },
            {
                q: 'How do I find the nearest toilets while cycling?',
                a: 'Zoom in on your position: the map shows the facilities recorded around you. Stations, '
                    + 'parks and town centres are the best provided for.',
            },
            {
                q: 'A facility is missing from the map — how do I report it?',
                a: 'The data comes from OpenStreetMap: add it on openstreetmap.org and it will be picked '
                    + 'up at the next sync.',
            },
            {
                q: 'Are these toilets visible while planning a route?',
                a: 'Not in Lille: Sécu’Cycle navigation does not yet cover the Métropole Européenne de '
                    + 'Lille. The map stands on its own.',
            },
        ],
    },

    'lille/points-eau': {
        title: 'Drinking water in Lille — map of fountains',
        description: 'Map of drinking fountains and water points in Lille and its metropolitan area, for '
            + 'refilling a bottle.',
        h1: 'Drinking water in Lille',
        intro: 'Where can you refill a bottle in the Lille area? This map lists the freely accessible '
            + 'drinking fountains and water points, from the parks to the banks of the Deûle.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Only water declared drinkable is kept: park taps, street standpipes, points in '
                    + 'playgrounds and sports facilities. Ornamental fountains are excluded.',
                    'Part of the network is shut off in the cold months to prevent freezing: the map shows '
                    + 'the installation all year round, without indicating when it is closed.',
                ],
            },
            {
                h2: 'Staying hydrated on a bike',
                p: [
                    'The Lille area is flat, which makes distances deceptive: a ride from Lille to Roubaix '
                    + 'takes longer than the terrain suggests. Pick out a refill point before setting off '
                    + 'rather than counting on finding one.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The locations come from OpenStreetMap, resynchronised automatically. A fountain out '
                    + 'of service or shut for the season stays on the map: the survey records the '
                    + 'installation, not its current state.',
                ],
            },
        ],
        faq: [
            {
                q: 'Is the water from these fountains drinkable?',
                a: 'Yes. Only points delivering drinking water are shown; those recorded as non-potable in '
                    + 'the data are excluded.',
            },
            {
                q: 'Do the fountains run all year round?',
                a: 'Part of the network is closed during the cold months to prevent the pipes freezing.',
            },
            {
                q: 'Are there water points along the Deûle?',
                a: 'The parks and rest areas along the banks have several. Zoom in on the banks to spot '
                    + 'them before setting off.',
            },
            {
                q: 'Can I route a ride past these water points?',
                a: 'Not in the Lille metropolitan area yet, where route planning is unavailable: it '
                    + 'relies on a road network loaded for a narrower area.',
            },
        ],
    },

    'lille/velos-libre-service': {
        sources: [SOURCE_GBFS_LILLE],
        title: 'V’Lille stations — live availability',
        description: 'Live map of V’Lille stations: bikes available and free docks, station by station.',
        h1: 'Bike share in Lille',
        intro: 'How many bikes are left at the nearest station? This map shows the V’Lille stations with, '
            + 'for each one, the number of bikes available and free docks.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Each station shows the bikes available and the free docks at the moment you consult '
                    + 'it. The network covers Lille and the main town centres of the metropolitan area.',
                    'The dot sums up each station\'s state at a glance: bikes available, almost empty, '
                    + 'empty, full, or out of service.',
                ],
            },
            {
                h2: 'A few useful habits',
                p: [
                    'At rush hour, station stocks empty in the morning and fill in the evening: plan ahead '
                    + 'by picking out two arrival stations close to each other.',
                    'Check the state of the bike before setting off — brakes, tyres, saddle — and report '
                    + 'any fault from the app.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'Availability comes from the service\'s public GBFS feed, queried at the pace it '
                    + 'publishes. Sécu’Cycle is not affiliated with the operator.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many V’Lille stations are there?',
                a: 'The network has more than two hundred stations across the metropolitan area. The map '
                    + 'shows those active at the moment you consult it.',
            },
            {
                q: 'Are there electrically assisted V’Lille bikes?',
                a: 'No: the bike-share fleet is mechanical. The service also offers long-term hire, which '
                    + 'is a separate scheme and does not appear on this map.',
            },
            {
                q: 'Is the availability shown live?',
                a: 'It comes from the service\'s official feed, refreshed continuously. A lag of a few '
                    + 'moments remains possible.',
            },
            {
                q: 'Can I plan a route from a V’Lille station?',
                a: 'Not yet: availability is shown live, but the Lille metropolitan area is not covered by '
                    + 'the route planner.',
            },
        ],
    },

    'lille/accidents-velo': {
        sources: [SOURCE_BAAC],
        title: 'Cycling accidents in Lille — risk area map',
        description: 'Map of injury accidents involving a cyclist across the Métropole Européenne de '
            + 'Lille, from official data.',
        h1: 'Cycling accidents in Lille',
        intro: 'This map locates the injury accidents involving a cyclist recorded across the Métropole '
            + 'Européenne de Lille. It is there to spot the junctions and roads where vigilance matters '
            + 'most.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Each point is an injury accident — one with at least one casualty — recorded by the '
                    + 'police in the BAAC file. Accidents are coloured by severity.',
                    'Clusters appear on the main roads and at the junctions linking the town centres, '
                    + 'where cycling and motor flows converge.',
                ],
            },
            {
                h2: 'The most common configurations',
                p: [
                    'A vehicle turning right across the path of a cyclist going straight on remains the '
                    + 'great classic, particularly dangerous with a heavy vehicle. Dooring comes next.',
                    'Locally, cobbles and level crossings add their own risk: a wheel deflected on an '
                    + 'uneven surface, or caught in a rail, is a fall without any third party — and '
                    + 'therefore absent from this map.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The data comes from the BAAC file published each year by ONISR on data.gouv.fr. It is '
                    + 'official but retrospective.',
                ],
            },
        ],
        faq: [
            {
                q: 'Does this map record every cycling accident?',
                a: 'No. Only injury accidents that led to a police report enter the BAAC file. Falls on '
                    + 'their own — including those on cobbles or rails — are absent.',
            },
            {
                q: 'Is the data up to date?',
                a: 'It follows the ONISR publication schedule: the latest year available covers a '
                    + 'completed calendar year.',
            },
            {
                q: 'How do I cross cobbles or rails safely?',
                a: 'On cobbles, take weight off your hands, keep your arms loose and brake earlier, '
                    + 'especially in the wet. On rails, cross at right angles, widening your line if you '
                    + 'must.',
            },
            {
                q: 'Do these accidents weigh on the routes suggested in Lille?',
                a: 'Not for now: route planning does not yet cover the Lille metropolitan area. Where it '
                    + 'works, they lower the safety score of the segments concerned.',
            },
        ],
    },

    'lille/reparation-velo': {
        title: 'Bike repair in Lille — workshops and pumps',
        description: 'Map of repair workshops, bike shops and public pumping stations across the '
            + 'Métropole Européenne de Lille.',
        h1: 'Bike repair in Lille',
        intro: 'An inner tube to change, a buckled wheel, a tyre to reinflate: this map lists the '
            + 'workshops, bike shops and freely accessible pumping stations across the metropolitan area.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Three kinds of point sit side by side: bike shops and professional workshops, '
                    + 'community self-repair workshops, and the pumping stations installed in public space.',
                    'Opening hours are not always recorded, and a community workshop often opens only a '
                    + 'few afternoons a week: best to check before making the trip.',
                ],
            },
            {
                h2: 'Wheels, the local weak point',
                p: [
                    'Cobbles are hard on wheels. Spokes loosen, rims go out of true, and tyres at low '
                    + 'pressure pinch-flat more readily than on smooth tarmac.',
                    'A puncture or a chain to lubricate remain within everyone\'s reach. A buckled wheel, '
                    + 'on the other hand, calls for a truing stand and a practised hand.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The locations come from OpenStreetMap, resynchronised automatically. A recent '
                    + 'workshop may be missing, and a closed shop may linger for a while.',
                ],
            },
        ],
        faq: [
            {
                q: 'Where can I pump up my tyres for free in Lille?',
                a: 'The freely accessible pumping stations installed in public space appear on this map. '
                    + 'Many bike shops also let you use a pump.',
            },
            {
                q: 'What is a self-repair workshop?',
                a: 'A place, usually run by a non-profit, that provides tools, second-hand parts and '
                    + 'advice so that you can repair your own bike.',
            },
            {
                q: 'How often should a bike be serviced when ridden on cobbles?',
                a: 'More often than elsewhere. A monthly check of the spokes, wheel trueness and tyre '
                    + 'pressure prevents most of the damage cobbles cause.',
            },
            {
                q: 'Can Sécu’Cycle take me to a workshop?',
                a: 'Not in Lille: route planning does not yet cover the metropolitan area. The map gives '
                    + 'the addresses.',
            },
        ],
    },

    'strasbourg/stationnements-velo': {
        title: 'Bike parking in Strasbourg — map of stands',
        description: 'Interactive map of bike parking across the Eurométropole de Strasbourg: stands, '
            + 'shelters and secure lockers.',
        h1: 'Bike parking in Strasbourg',
        intro: 'Where can you lock your bike in Strasbourg? This map lists the stands, racks, shelters '
            + 'and lockers across the 33 municipalities of the Eurométropole, from the Grande Île to the '
            + 'outer towns.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Each point is a spot surveyed on the ground by OpenStreetMap contributors. Stands '
                    + 'dominate: they are the only equipment that lets you lock the frame and a wheel with '
                    + 'a U-lock.',
                    'Shelters and enclosed lockers appear separately, mainly around the station and the '
                    + 'tram terminuses, where they cover a full day of parking.',
                ],
            },
            {
                h2: 'Parking in a city that cycles',
                p: [
                    'Strasbourg has the highest share of journeys made by bike of any French city, and '
                    + 'parking demand follows: in the centre at peak times, stands fill up, and the '
                    + 'nearest free spot is not always the most obvious one.',
                    'Locking to street furniture is tolerated as long as it does not block the way, but a '
                    + 'smooth post can be lifted off. Prefer a proper stand, even one street further on.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The survey comes from OpenStreetMap and is resynchronised automatically. A recently '
                    + 'installed stand may be missing, and one that has been removed may linger.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many bike parking spots are there in Strasbourg?',
                a: 'The counter at the top of the map shows the total recorded across the 33 '
                    + 'municipalities of the Eurométropole at the moment you consult it.',
            },
            {
                q: 'Where can I find secure bike parking in Strasbourg?',
                a: 'Enclosed shelters and lockers appear under the “Shelters and lockers” category, '
                    + 'mainly around the station and the transport hubs.',
            },
            {
                q: 'Can I lock my bike anywhere in the centre?',
                a: 'Locking to street furniture is tolerated as long as it does not block the way, but it '
                    + 'is not advisable: a smooth post offers no real security.',
            },
            {
                q: 'Can I ask for a route to these parking spots?',
                a: 'Not in the Eurométropole yet. Route planning relies on a road network held in memory '
                    + 'by our server, which does not cover this area.',
            },
        ],
    },

    'strasbourg/toilettes-publiques': {
        title: 'Public toilets in Strasbourg — interactive map',
        description: 'Map of public toilets in Strasbourg and the Eurométropole: free, paid and '
            + 'wheelchair-accessible facilities.',
        h1: 'Public toilets in Strasbourg',
        intro: 'This map locates the public toilets recorded across the Eurométropole de Strasbourg, '
            + 'telling free facilities apart from paid ones and flagging those that are wheelchair '
            + 'accessible.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Street facilities sit alongside those in parks, the station and the transport hubs. '
                    + 'The Grande Île and the banks of the Ill are the best provided for.',
                    'Opening hours are not always recorded: facilities in parks close with them, often at '
                    + 'nightfall and earlier in winter.',
                ],
            },
            {
                h2: 'Accessibility',
                p: [
                    'Toilets flagged as accessible have a turning space and grab rails. The information '
                    + 'comes from OpenStreetMap surveys and is not filled in everywhere: an absence is not '
                    + 'a “no”.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The locations come from OpenStreetMap, resynchronised automatically. A facility '
                    + 'closed for works may stay on the map for a while.',
                ],
            },
        ],
        faq: [
            {
                q: 'Are public toilets free in Strasbourg?',
                a: 'Most of the street facilities recorded are free. Some venues, particularly at the '
                    + 'station, still charge: the record says so where the information exists.',
            },
            {
                q: 'Are there toilets in Strasbourg parks?',
                a: 'Yes, the large parks have them. They do follow the opening hours of the grounds, '
                    + 'which are more restrictive than street facilities.',
            },
            {
                q: 'How do I find the nearest toilets while cycling?',
                a: 'Zoom in on your position: the map shows the facilities recorded around you. The Grande '
                    + 'Île and the banks of the Ill are well provided for.',
            },
            {
                q: 'Do these facilities appear while planning a route?',
                a: 'Not in Strasbourg: navigation does not yet cover the Eurométropole. The map stands on '
                    + 'its own.',
            },
        ],
    },

    'strasbourg/points-eau': {
        title: 'Drinking water in Strasbourg — map of fountains',
        description: 'Map of drinking fountains and water points across the Eurométropole de Strasbourg, '
            + 'for refilling a bottle.',
        h1: 'Drinking water in Strasbourg',
        intro: 'Where can you refill a bottle in Strasbourg? This map lists the freely accessible '
            + 'drinking fountains and water points across the Eurométropole, from the Grande Île to the '
            + 'parks and the banks of the Ill.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Only water declared drinkable is kept: park taps, street standpipes, points in '
                    + 'playgrounds and sports facilities. Ornamental fountains are excluded.',
                    'Part of the network is shut off in the cold months to prevent freezing — a real '
                    + 'consideration in Alsace, where winters bite harder than on the Atlantic coast.',
                ],
            },
            {
                h2: 'Staying hydrated on a bike',
                p: [
                    'Strasbourg is flat and its cycle network is dense, which encourages longer rides than '
                    + 'planned. On a summer ride along the Ill or towards the outer towns, pick out a '
                    + 'refill point in advance.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The locations come from OpenStreetMap, resynchronised automatically. A fountain out '
                    + 'of service or shut for the season stays on the map: the survey records the '
                    + 'installation, not its current state.',
                ],
            },
        ],
        faq: [
            {
                q: 'Is the water from these fountains drinkable?',
                a: 'Yes. Only points delivering drinking water are shown; those recorded as non-potable in '
                    + 'the data are excluded.',
            },
            {
                q: 'Do the fountains run all year round?',
                a: 'Part of the network is closed during the cold months to prevent the pipes freezing, '
                    + 'which matters in Alsace.',
            },
            {
                q: 'A water point is missing from the map — how do I report it?',
                a: 'The data comes from OpenStreetMap: add it on openstreetmap.org and it will be picked '
                    + 'up at the next sync.',
            },
            {
                q: 'Can I route a ride past these water points?',
                a: 'Not in the Eurométropole yet, where route planning is unavailable: it relies on a road '
                    + 'network loaded for a narrower area.',
            },
        ],
    },

    'strasbourg/velos-libre-service': {
        sources: [SOURCE_GBFS_STRASBOURG],
        title: 'Vélhop stations in Strasbourg — live availability',
        description: 'Live map of Vélhop bike-share stations across the Eurométropole de Strasbourg: '
            + 'bikes available and free docks.',
        h1: 'Bike share in Strasbourg',
        intro: 'How many bikes are left at the nearest station? This map shows the Vélhop stations with, '
            + 'for each one, the number of bikes available and free docks.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Each station shows the bikes available and the free docks at the moment you consult '
                    + 'it. The dot sums up its state at a glance: available, almost empty, empty, full, or '
                    + 'out of service.',
                    'Vélhop complements an already dense cycle network. In a city where so many people '
                    + 'already own a bike, bike share serves the occasional trip and the visitor rather '
                    + 'than the daily commute.',
                ],
            },
            {
                h2: 'A few useful habits',
                p: [
                    'Check the state of the arrival station before setting off: a full station in the '
                    + 'centre at the end of the day means riding on to the next one.',
                    'Check the bike before leaving — brakes, tyres, saddle — and report any fault.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'Availability comes from the service\'s public GBFS feed, queried at the pace it '
                    + 'publishes. Sécu’Cycle is not affiliated with the operator.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many Vélhop stations are mapped?',
                a: 'The map shows every station published in the official feed at the moment you consult '
                    + 'it, across the Eurométropole.',
            },
            {
                q: 'Is the availability shown live?',
                a: 'It comes from the service\'s official feed, refreshed continuously. A lag of a few '
                    + 'moments remains possible.',
            },
            {
                q: 'Can I return a bike to any station?',
                a: 'Yes, subject to free docks. If the station you are aiming for is full, the map lets '
                    + 'you spot another nearby.',
            },
            {
                q: 'Can I plan a route from a Vélhop station?',
                a: 'Not yet: availability is shown live, but route planning does not cover the '
                    + 'Eurométropole.',
            },
        ],
    },

    'strasbourg/accidents-velo': {
        sources: [SOURCE_BAAC],
        title: 'Cycling accidents in Strasbourg — risk area map',
        description: 'Map of injury accidents involving a cyclist across the Eurométropole de '
            + 'Strasbourg, from official data.',
        h1: 'Cycling accidents in Strasbourg',
        intro: 'This map locates the injury accidents involving a cyclist recorded across the '
            + 'Eurométropole de Strasbourg. It is there to spot the junctions and roads where vigilance '
            + 'matters most.',
        sections: [
            {
                h2: 'Reading the map in a cycling city',
                p: [
                    'Strasbourg has the highest share of cycling in France, which shapes the map: '
                    + 'accidents accumulate where cyclists are, and cyclists are everywhere.',
                    'Without exposure data, a cluster cannot be told apart from an inherently dangerous '
                    + 'place. Read the map as a picture of where cycling happens as much as of where it '
                    + 'goes wrong.',
                ],
            },
            {
                h2: 'The most common configurations',
                p: [
                    'A vehicle turning right across the path of a cyclist going straight on remains the '
                    + 'great classic. Dooring comes next, particularly along streets with parking on both '
                    + 'sides.',
                    'Tram rails add a local risk: a wheel caught in a rail is a fall without a third '
                    + 'party, and therefore absent from this map. Cross them at right angles.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The data comes from the BAAC file published each year by ONISR on data.gouv.fr. It is '
                    + 'official but retrospective.',
                ],
            },
        ],
        faq: [
            {
                q: 'Does this map record every cycling accident?',
                a: 'No. Only injury accidents that led to a police report enter the BAAC file. Falls on '
                    + 'their own, including on tram rails, are absent.',
            },
            {
                q: 'Is the data up to date?',
                a: 'It follows the ONISR publication schedule: the latest year available covers a '
                    + 'completed calendar year.',
            },
            {
                q: 'Is cycling in Strasbourg dangerous?',
                a: 'The number of accidents rises with the number of cyclists, and Strasbourg has many. '
                    + 'Individual risk per kilometre falls as cycling becomes more widespread.',
            },
            {
                q: 'Do these accidents change the routes suggested in Strasbourg?',
                a: 'Not for now: route planning does not yet cover the Eurométropole. Where it works, they '
                    + 'lower the safety score of the segments concerned.',
            },
        ],
    },

    'strasbourg/reparation-velo': {
        title: 'Bike repair in Strasbourg — workshops and pumps',
        description: 'Map of repair workshops, bike shops and public pumping stations across the '
            + 'Eurométropole de Strasbourg.',
        h1: 'Bike repair in Strasbourg',
        intro: 'An inner tube to change, brakes to adjust, a tyre to reinflate: this map lists the '
            + 'workshops, bike shops and freely accessible pumping stations across the Eurométropole.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Three kinds of point sit side by side: bike shops and professional workshops, '
                    + 'community self-repair workshops, and the pumping stations installed in public space.',
                    'In a city where cycling is the norm, the network of shops is unusually dense — but '
                    + 'opening hours are not always recorded, and a community workshop often opens only a '
                    + 'few afternoons a week.',
                ],
            },
            {
                h2: 'What you can repair yourself',
                p: [
                    'A puncture, a brake to adjust, a chain to tension or lubricate are within everyone\'s '
                    + 'reach. Carrying a spare inner tube and two tyre levers turns a ruined journey into a '
                    + 'short stop.',
                    'Leave to a professional anything touching structural safety — fork, frame, buckled '
                    + 'wheel, headset — and the electrical system of an assisted bike.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The locations come from OpenStreetMap, resynchronised automatically. A recent '
                    + 'workshop may be missing, and a closed shop may linger for a while.',
                ],
            },
        ],
        faq: [
            {
                q: 'Where can I pump up my tyres for free in Strasbourg?',
                a: 'The freely accessible pumping stations installed in public space appear on this map. '
                    + 'Many bike shops also let you use a pump.',
            },
            {
                q: 'What is a self-repair workshop?',
                a: 'A place, usually run by a non-profit, that provides tools, second-hand parts and '
                    + 'advice so that you can repair your own bike.',
            },
            {
                q: 'How often should a bike be serviced?',
                a: 'A quick check of the brakes, tyres and chain every month is enough for daily use, and '
                    + 'daily use is the norm here.',
            },
            {
                q: 'Can Sécu’Cycle take me to a workshop?',
                a: 'Not in Strasbourg: route planning does not yet cover the Eurométropole. The map gives '
                    + 'the addresses.',
            },
        ],
    },

    'tournai/stationnements-velo': {
        title: 'Bike parking in Tournai — map of stands and shelters',
        description: 'Map of bike parking in Tournai, Mouscron and the Tournaisis: stands, racks and '
            + 'shelters recorded in open data.',
        h1: 'Bike parking in Tournai',
        intro: 'Where can you lock your bike in Tournai, Mouscron or Antoing? This map lists the bike '
            + 'parking spots across the Tournaisis, with the type of equipment and, where known, the '
            + 'number of spaces.',
        sections: [
            {
                h2: 'A network still being built',
                p: [
                    'The Tournaisis has around 130 recorded spots, a density well below that of a large '
                    + 'urban area. They cluster, logically, around the station, the town centre and the '
                    + 'main public buildings.',
                    'As everywhere, the stand remains the reference: it lets you lock the frame and a '
                    + 'wheel. Racks, which hold only the front wheel, offer far less protection against '
                    + 'theft.',
                ],
            },
            {
                h2: 'A cross-border area',
                p: [
                    'The Tournaisis is directly connected to the Lille metropolitan area, and many daily '
                    + 'journeys cross the border. The RAVeL, the Walloon network of greenways, carries '
                    + 'much of the leisure cycling.',
                    'Route planning does work here, unlike most of the other cities on this site: '
                    + 'Sécu’Cycle can plan a safer route across the Tournaisis and towards the border.',
                ],
            },
            {
                h2: 'Data and limitations',
                p: [
                    'The survey comes from OpenStreetMap. Coverage is patchier than in France: an '
                    + 'existing parking spot may simply never have been recorded. The absence of a marker '
                    + 'does not prove the absence of a stand.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many bike parking spots are recorded in Tournai?',
                a: 'Around 130 spots are mapped across Tournai, Mouscron, Antoing, Estaimpuis, '
                    + 'Leuze-en-Hainaut and Mont-de-l’Enclus.',
            },
            {
                q: 'Is there secure bike parking at Tournai station?',
                a: 'Sheltered spots are recorded around the station. Their exact nature — simple shelter '
                    + 'or enclosed locker — is not always specified in the open data.',
            },
            {
                q: 'Why are there fewer points than in Bordeaux?',
                a: 'Both because the area is far less populated and because OpenStreetMap coverage there '
                    + 'is less advanced. The map measures the data available, not what is on the ground.',
            },
            {
                q: 'Can Sécu’Cycle plan a route to these parking spots?',
                a: 'Yes. The Tournaisis is one of the two areas where route planning works, alongside '
                    + 'Bordeaux.',
            },
        ],
    },

    'tournai/accidents-velo': {
        sources: [SOURCE_STATBEL],
        title: 'Cycling accidents in Tournai — accident map',
        description: 'Map of accidents involving a cyclist in Tournai, Mouscron and the Tournaisis, from '
            + 'Belgian open data.',
        h1: 'Cycling accidents in Tournai',
        intro: 'This map records the road accidents involving a cyclist in the Tournaisis and the '
            + 'Mouscron area, from the geolocation data published by Statbel.',
        sections: [
            {
                h2: 'Precision to the month, not the day',
                p: [
                    'Unlike the French data, the Belgian dataset does not publish the exact date of an '
                    + 'accident, only the month. Records therefore show a month and a year.',
                    'Severity, on the other hand, is recorded: slight injury, hospitalised injury or '
                    + 'death. Across the Tournaisis, the vast majority of mapped accidents are slight '
                    + 'injuries.',
                ],
            },
            {
                h2: 'Reading the map with care',
                p: [
                    'As with any accident map, a cluster of points reflects how much cycling happens there '
                    + 'as much as how dangerous a place is. Town-centre roads accumulate both.',
                    'Only accidents that gave rise to an official report appear in the data. Falls without '
                    + 'a third party and minor collisions without injury are absent.',
                ],
            },
            {
                h2: 'Effect on routes',
                p: [
                    'These accidents are attached to nearby segments and apply a penalty — capped, and '
                    + 'decaying over time — to the safety score used by the route planner. The Tournaisis '
                    + 'is one of the two areas where that planner works.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many cycling accidents are recorded in the Tournaisis?',
                a: 'Around 150 accidents involving a cyclist are mapped across the area covered, about ten '
                    + 'of which led to hospitalisation.',
            },
            {
                q: 'Why are the dates not precise?',
                a: 'The Statbel open dataset publishes only the month and year of an accident, to limit '
                    + 'the risk of identifying the people involved.',
            },
            {
                q: 'What period is covered?',
                a: 'The Belgian data used covers the most recent years published by Statbel.',
            },
            {
                q: 'Do these accidents affect the routes suggested?',
                a: 'Yes. Route planning works across the Tournaisis, and these accidents lower the safety '
                    + 'score of the segments concerned.',
            },
        ],
    },

    'tournai/toilettes-et-points-eau': {
        title: 'Public toilets and drinking water in Tournai',
        description: 'Map of public toilets and drinking water points in Tournai, Mouscron and the '
            + 'Tournaisis, useful for cyclists and walkers.',
        h1: 'Toilets and drinking water in Tournai',
        intro: 'Where can you find a public toilet or somewhere to refill a bottle in the Tournaisis? As '
            + 'the survey is still modest in the region, this map brings both together.',
        sections: [
            {
                h2: 'Two kinds of stop on one map',
                p: [
                    'Purple markers are public toilets, blue markers drinking water points. In an area '
                    + 'where each category has fewer than twenty recorded locations, a single map is more '
                    + 'useful than two sparse ones.',
                    'The locations cluster in the centre of Tournai, around the Grand-Place and the banks '
                    + 'of the Scheldt, as well as in the public parks of the surrounding municipalities.',
                ],
            },
            {
                h2: 'A survey that is still partial',
                p: [
                    'OpenStreetMap coverage in the Tournaisis is less complete than in a dense French '
                    + 'urban area. The absence of a point does not mean the absence of a facility — only '
                    + 'that nobody has recorded it yet.',
                ],
            },
        ],
        faq: [
            {
                q: 'Why are toilets and water points on the same map?',
                a: 'Because each category has fewer than twenty recorded locations in the Tournaisis. '
                    + 'Bringing them together produces a map that is actually useful.',
            },
            {
                q: 'Is the water from these fountains drinkable?',
                a: 'Only points declared drinkable in the open data are shown. If in doubt, trust the '
                    + 'signage on site.',
            },
            {
                q: 'How do I add a missing location?',
                a: 'The data comes from OpenStreetMap: add the point on openstreetmap.org and it will be '
                    + 'picked up at the next sync.',
            },
        ],
    },

    'bruxelles/stationnements-velo': {
        title: 'Bike parking in Brussels — map of stands and shelters',
        description: 'Interactive map of bike parking across the 19 municipalities of Brussels-Capital: '
            + 'stands, shelters and bike boxes.',
        h1: 'Bike parking in Brussels',
        intro: 'Where can you lock your bike in Brussels? This map lists the stands, racks, shelters and '
            + 'boxes across the 19 municipalities of the Brussels-Capital Region, from the Pentagon to '
            + 'the outer districts.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Each point is a spot surveyed on the ground by OpenStreetMap contributors. Stands '
                    + 'dominate: they are the only equipment that lets you lock the frame and a wheel with '
                    + 'a U-lock.',
                    'Shelters and enclosed boxes appear separately. In Brussels these often take the form '
                    + 'of street bike boxes installed in residential districts, shared between residents '
                    + 'who register with the municipality or the Region.',
                ],
            },
            {
                h2: 'Parking in Brussels',
                p: [
                    'Bike theft is common in the capital, particularly around stations and nightlife '
                    + 'districts. A certified U-lock, the frame attached to a fixed point, and a busy, lit '
                    + 'spot are worth the extra minute.',
                    'The terrain deserves attention. Between the lower city and the heights of Ixelles or '
                    + 'Saint-Gilles, sloping streets are everywhere: a bike merely resting against a stand '
                    + 'tips over more easily than on the flat.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The survey comes from OpenStreetMap and is resynchronised automatically. The Belgian '
                    + 'contributor community is very active, and coverage is good.',
                ],
            },
        ],
        faq: [
            {
                q: 'How many bike parking spots are there in Brussels?',
                a: 'The counter at the top of the map shows the total recorded across the 19 '
                    + 'municipalities at the moment you consult the page.',
            },
            {
                q: 'What is a Brussels bike box?',
                a: 'An enclosed shelter installed on the street, shared between residents who register '
                    + 'with the municipality or the Region. It offers day-to-day protection well above '
                    + 'that of an open stand.',
            },
            {
                q: 'What is the difference between a stand and a rack?',
                a: 'A stand is an inverted U-shaped bar that lets you lock the frame and a wheel: it is '
                    + 'the recommended design. A rack holds only the front wheel.',
            },
            {
                q: 'Can Sécu’Cycle plan a route to these parking spots?',
                a: 'Not in the Brussels Region yet. Route planning requires a road network held in memory '
                    + 'by the server for that area.',
            },
        ],
    },

    'bruxelles/toilettes-publiques': {
        title: 'Public toilets in Brussels — interactive map',
        description: 'Map of public toilets across the 19 municipalities of Brussels-Capital: free, paid '
            + 'and wheelchair-accessible facilities.',
        h1: 'Public toilets in Brussels',
        intro: 'This map locates the public toilets recorded across the 19 municipalities of the '
            + 'Brussels-Capital Region, telling free facilities apart from paid ones and flagging those '
            + 'that are wheelchair accessible.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'What Brussels offers mixes street facilities, park toilets — Bois de la Cambre, parc '
                    + 'du Cinquantenaire, parc Josaphat — and facilities in stations and transport hubs.',
                    'Many park facilities close with the grounds, earlier in winter. Opening hours appear '
                    + 'on the record where they have been surveyed.',
                ],
            },
            {
                h2: 'Accessibility',
                p: [
                    'Toilets flagged as accessible have a turning space and grab rails. The information '
                    + 'comes from OpenStreetMap surveys and is not filled in everywhere: an absence is not '
                    + 'a “no”.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The locations come from OpenStreetMap, resynchronised automatically. A facility '
                    + 'closed for works may stay on the map for a while.',
                ],
            },
        ],
        faq: [
            {
                q: 'Do public toilets charge in Brussels?',
                a: 'Some do, particularly in the centre and in stations — the practice is common in '
                    + 'Belgium. The map tells free facilities apart from paid ones where the data says so.',
            },
            {
                q: 'Are there toilets in Brussels parks?',
                a: 'The large parks have them, with opening hours aligned on those of the grounds, which '
                    + 'are more restrictive in winter.',
            },
            {
                q: 'How do I find the nearest toilets while cycling?',
                a: 'Zoom in on your position: the map shows the facilities recorded around you. Parks and '
                    + 'transport hubs are the best provided for.',
            },
            {
                q: 'Do these toilets appear while planning a route?',
                a: 'Not in Brussels: navigation does not yet cover the Brussels-Capital Region. The map '
                    + 'stands on its own.',
            },
        ],
    },

    'bruxelles/points-eau': {
        title: 'Drinking water in Brussels — map of fountains',
        description: 'Map of drinking fountains and water points across the 19 municipalities of '
            + 'Brussels-Capital, for refilling a bottle.',
        h1: 'Drinking water in Brussels',
        intro: 'Where can you refill a bottle in Brussels? This map lists the freely accessible drinking '
            + 'fountains and water points across the 19 municipalities of the Region.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Brussels fountains cluster in the parks and on the squares. In recent years the '
                    + 'Region has installed drinking fountains designed for refilling a bottle rather '
                    + 'than merely drinking from.',
                    'Part of the network is shut off in winter to prevent freezing: the map shows the '
                    + 'installation all year round, without indicating when it is closed.',
                ],
            },
            {
                h2: 'Staying hydrated on a bike',
                p: [
                    'Brussels terrain makes itself felt as soon as you leave the Senne valley: climbing '
                    + 'towards Ixelles, Uccle or Woluwe takes real effort, even over a short distance. '
                    + 'Refill before the climb rather than after it.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The locations come from OpenStreetMap, resynchronised automatically. A fountain out '
                    + 'of service or shut for the season stays on the map: the survey records the '
                    + 'installation, not its current state.',
                ],
            },
        ],
        faq: [
            {
                q: 'Is the water from these fountains drinkable?',
                a: 'Yes. Only points delivering drinking water are shown; those recorded as non-potable in '
                    + 'the data are excluded.',
            },
            {
                q: 'Do the fountains run all year round?',
                a: 'Part of the network is closed during the cold months to prevent the pipes freezing.',
            },
            {
                q: 'A water point is missing from the map — how do I report it?',
                a: 'The data comes from OpenStreetMap: add it on openstreetmap.org and it will be picked '
                    + 'up at the next sync.',
            },
            {
                q: 'Can I route my ride past these water points?',
                a: 'Not in Brussels yet, where route planning is unavailable: it relies on a road network '
                    + 'loaded for a narrower area.',
            },
        ],
    },

    'bruxelles/velos-libre-service': {
        sources: [SOURCE_GBFS_BRUXELLES, SOURCE_GBFS_BLUEBIKE],
        title: 'Villo! stations in Brussels — live availability',
        description: 'Live map of Villo! and Blue-bike stations: bikes available and free docks, station '
            + 'by station.',
        h1: 'Bike share in Brussels',
        intro: 'How many bikes are left at the nearest station? This map shows the Villo! stations and '
            + 'the Blue-bike points across the Brussels Region.',
        sections: [
            {
                h2: 'Two services, two uses',
                p: [
                    'Villo! is the Region\'s bike-share system: stations spread across the 19 '
                    + 'municipalities, for one-off trips of a few minutes to a few hours.',
                    'Blue-bike answers a different need: its points are at railway stations and serve the '
                    + 'last kilometre after a train journey, on reservation and generally for the day.',
                ],
            },
            {
                h2: 'A few useful habits',
                p: [
                    'The terrain weighs on availability: stations in the lower city fill up, those on the '
                    + 'heights empty out. Electric assistance softens the climb but does not change the '
                    + 'direction of the flow.',
                    'A station shown with zero bikes or zero free docks really is empty or full: aim for a '
                    + 'neighbouring one rather than making the trip for nothing.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'Availability comes from the public GBFS feeds of both services, queried at the pace '
                    + 'they announce. For some Blue-bike points, the feed publishes a total rather than a '
                    + 'live count.',
                ],
            },
        ],
        faq: [
            {
                q: 'What is the difference between Villo! and Blue-bike?',
                a: 'Villo! is a station-based bike-share service for short trips within the Region. '
                    + 'Blue-bike is a railway-station hire scheme, on reservation, for the last kilometre.',
            },
            {
                q: 'Are Villo! bikes electric?',
                a: 'The fleet is now very largely electrified. Each station record breaks down the split '
                    + 'where the feed publishes it.',
            },
            {
                q: 'Is the availability shown live?',
                a: 'It comes from the services\' official feeds, refreshed continuously. A lag of a few '
                    + 'moments remains possible.',
            },
            {
                q: 'Can I plan a route from a Villo! station?',
                a: 'Not yet: Villo! and Blue-bike availability is shown live, but the Brussels Region is '
                    + 'not covered by the route planner.',
            },
        ],
    },

    'bruxelles/accidents-velo': {
        sources: [SOURCE_STATBEL],
        title: 'Cycling accidents in Brussels — risk area map',
        description: 'Map of injury accidents involving a cyclist across the 19 municipalities of '
            + 'Brussels-Capital, from Statbel data.',
        h1: 'Cycling accidents in Brussels',
        intro: 'This map locates the injury accidents involving a cyclist recorded across the '
            + 'Brussels-Capital Region. It is there to spot the junctions and roads where vigilance '
            + 'matters most.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Each point is an injury accident recorded by the police and published by Statbel, the '
                    + 'Belgian statistical office. As with the French data, severity is shown by colour.',
                    'Clusters appear on the main approach roads, around the inner ring and at busy '
                    + 'junctions. A concentration reflects cycling volumes as much as danger.',
                ],
            },
            {
                h2: 'The most common configurations',
                p: [
                    'A vehicle turning right across the path of a cyclist going straight on remains the '
                    + 'most frequent configuration, and the most serious with a heavy vehicle.',
                    'Three local factors deserve attention. Tram rails, always to be crossed at right '
                    + 'angles. Cobbles, slippery and destabilising in the wet. And the gradient, which '
                    + 'raises speeds on the descents towards the lower city.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The data comes from the road accident statistics published by Statbel. It is official '
                    + 'but retrospective, and the Belgian dataset gives the month rather than the exact '
                    + 'day.',
                ],
            },
        ],
        faq: [
            {
                q: 'Does this map record every cycling accident?',
                a: 'No. Only injury accidents that gave rise to a police report enter the Statbel '
                    + 'statistics. Falls on their own — including on rails or cobbles — are absent.',
            },
            {
                q: 'Is the data up to date?',
                a: 'It follows the Statbel publication schedule: the latest year available covers a '
                    + 'completed calendar year.',
            },
            {
                q: 'Has the 30 km/h limit changed anything?',
                a: 'The city-wide 30 km/h limit, in force since 2021, acts on the severity of impacts more '
                    + 'than on their number: a lower speed markedly reduces the consequences of a '
                    + 'collision.',
            },
            {
                q: 'Do these accidents change the routes suggested in Brussels?',
                a: 'Not yet, as route planning does not cover the Brussels Region. Where it works, the '
                    + 'layer weighs on the safety score.',
            },
        ],
    },

    'bruxelles/reparation-velo': {
        title: 'Bike repair in Brussels — workshops and pumps',
        description: 'Map of repair workshops, bike shops and public pumping stations across the 19 '
            + 'municipalities of Brussels-Capital.',
        h1: 'Bike repair in Brussels',
        intro: 'An inner tube to change, brakes to adjust, a tyre to reinflate: this map lists the '
            + 'workshops, bike shops and freely accessible pumping stations across the 19 municipalities '
            + 'of the Region.',
        sections: [
            {
                h2: 'What the map shows',
                p: [
                    'Three kinds of point sit side by side: bike shops and professional workshops, '
                    + 'community self-repair workshops, and the pumping stations installed in public space.',
                    'Opening hours are not always recorded, and a community workshop often opens only a '
                    + 'few afternoons a week: best to check before making the trip.',
                ],
            },
            {
                h2: 'Cobbles and gradients, hard on a bike',
                p: [
                    'Cobbles loosen spokes and take wheels out of true; the gradients wear brake pads '
                    + 'faster than on the flat. Both deserve a closer eye here than elsewhere.',
                    'A puncture, a chain to lubricate or a brake to adjust remain within everyone\'s '
                    + 'reach. Leave to a professional anything touching structural safety, and the '
                    + 'electrical system of an assisted bike.',
                ],
            },
            {
                h2: 'Where the data comes from',
                p: [
                    'The locations come from OpenStreetMap, resynchronised automatically. A recent '
                    + 'workshop may be missing, and a closed shop may linger for a while.',
                ],
            },
        ],
        faq: [
            {
                q: 'Where can I pump up my tyres for free in Brussels?',
                a: 'The freely accessible pumping stations installed in public space appear on this map. '
                    + 'Many bike shops also let you use a pump.',
            },
            {
                q: 'What is a self-repair workshop?',
                a: 'A place, usually run by a non-profit, that provides tools, second-hand parts and '
                    + 'advice so that you can repair your own bike.',
            },
            {
                q: 'How often should a bike be serviced in Brussels?',
                a: 'More often than on flat, smooth ground. Check the brakes and the wheel trueness '
                    + 'monthly: cobbles and gradients wear both faster.',
            },
            {
                q: 'Can Sécu’Cycle take me to a workshop?',
                a: 'Not in Brussels: route planning does not yet cover the Region. The map gives the '
                    + 'addresses.',
            },
        ],
    },
};
