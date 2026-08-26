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
};
