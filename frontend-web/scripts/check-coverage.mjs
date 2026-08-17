#!/usr/bin/env node
//
// Mesure la couverture des données pour chaque couple ville × thème du registre
// src/data/thematicMaps.js, afin de décider quelles cartes thématiques publier.
//
//   node scripts/check-coverage.mjs
//   node scripts/check-coverage.mjs --api http://127.0.0.1:8000
//   node scripts/check-coverage.mjs --all      # teste tous les thèmes, pas seulement
//                                              # ceux déjà activés pour la ville
//
// Ajouter une ville : créer son entrée dans CITIES avec `themes: []`, lancer ce script
// avec --all, retenir les thèmes qui passent le seuil, puis rédiger PAGE_CONTENT.
//
// Les seuils ci-dessous ne sont pas une règle absolue : ils matérialisent le principe
// « pas de page sans données suffisantes pour être utile ». Une carte trop clairsemée ne
// rend pas service au visiteur et constitue du contenu faible aux yeux des moteurs.

import { CITIES, THEMES } from '../src/data/thematicMaps.js';

const DEFAULT_API = 'https://api.secu-cycle.fr';

const SEUILS = {
    poi: 30,
    lighting: 1000,
    accidents: 20,
    bikeshare: 10,
    traffic: 50,
};

const args = process.argv.slice(2);
const apiIndex = args.indexOf('--api');
const API = apiIndex >= 0 ? args[apiIndex + 1] : (process.env.VITE_API_BASE_URL || DEFAULT_API);
const testerTout = args.includes('--all');

const bboxParam = (bbox) => bbox.join(',');

const dansBbox = (coords, bbox) => {
    let point = coords;
    while (Array.isArray(point[0])) point = point[0];
    const [x, y] = point;
    return x >= bbox[0] && x <= bbox[2] && y >= bbox[1] && y <= bbox[3];
};

async function recuperer(chemin) {
    const reponse = await fetch(`${API}${chemin}`, { headers: { Accept: 'application/json' } });
    if (!reponse.ok) throw new Error(`HTTP ${reponse.status} sur ${chemin}`);
    return reponse.json();
}

async function compter(theme, city) {
    const { layer } = theme;
    const bbox = bboxParam(city.bbox);

    switch (layer.kind) {
        case 'poi': {
            const collection = await recuperer(`/pois/?categories=${layer.categories.join(',')}&bbox=${bbox}`);
            return collection.features?.length ?? 0;
        }
        case 'lighting': {
            const collection = await recuperer(`/streetlights/?bbox=${bbox}`);
            return collection.features?.length ?? 0;
        }
        case 'accidents': {
            const collection = await recuperer(`/accidents/?bbox=${bbox}`);
            return collection.features?.length ?? 0;
        }
        case 'bikeshare': {
            const snapshot = await recuperer('/bikeshare/');
            const features = snapshot.geojson?.features ?? [];
            return features.filter(f => dansBbox(f.geometry.coordinates, city.bbox)).length;
        }
        case 'traffic': {
            const snapshot = await recuperer('/traffic/');
            const features = snapshot.geojson?.features ?? [];
            return features.filter(f => dansBbox(f.geometry.coordinates, city.bbox)).length;
        }
        default:
            throw new Error(`type de couche inconnu : ${layer.kind}`);
    }
}

const seuilDe = (theme) => SEUILS[theme.layer.kind] ?? SEUILS.poi;

console.log(`API : ${API}`);
console.log(`Mode : ${testerTout ? 'tous les thèmes' : 'thèmes activés uniquement'}\n`);

let echecs = 0;

for (const city of CITIES) {
    console.log(`${city.name} — ${city.label}`);
    console.log(`  emprise ${bboxParam(city.bbox)}`);

    const slugs = testerTout ? Object.keys(THEMES) : city.themes;

    for (const slug of slugs) {
        const theme = THEMES[slug];
        if (!theme) {
            console.log(`  ${'?'.padEnd(3)} ${slug.padEnd(26)} thème inconnu dans THEMES`);
            echecs += 1;
            continue;
        }

        const seuil = seuilDe(theme);
        const active = city.themes.includes(slug);
        const raisonExclusion = city.excludedThemes?.[slug];

        let compte;
        try {
            compte = await compter(theme, city);
        } catch (erreur) {
            console.log(`  ${'ERR'.padEnd(3)} ${slug.padEnd(26)} ${erreur.message}`);
            echecs += 1;
            continue;
        }

        const suffisant = compte >= seuil;
        const marque = raisonExclusion ? 'EXC' : (suffisant ? 'OK ' : 'BAS');
        const etat = active
            ? (suffisant ? '' : '  ← publiée mais sous le seuil')
            : (suffisant && !raisonExclusion ? '  ← non publiée alors que les données suffisent' : '');

        console.log(
            `  ${marque} ${slug.padEnd(26)} ${String(compte).padStart(6)} `
            + `(seuil ${seuil})${active ? '' : ' [non publiée]'}${etat}`
        );
        if (raisonExclusion) console.log(`      écartée : ${raisonExclusion}`);

        if (active && !suffisant) echecs += 1;
    }
    console.log('');
}

if (echecs > 0) {
    console.log(`${echecs} anomalie(s) : des pages publiées n'atteignent pas leur seuil de couverture.`);
    process.exit(1);
}

console.log('Toutes les cartes publiées atteignent leur seuil de couverture.');
