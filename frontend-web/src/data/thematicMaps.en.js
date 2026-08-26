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
    SOURCE_OSM,
    SOURCE_PTLUM,
    SOURCE_TRAFIC_BM,
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
};
