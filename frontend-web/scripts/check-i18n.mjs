#!/usr/bin/env node
//
// Vérifie que chaque clé de libellé émise par le registre langue-neutre a bien un
// texte dans le catalogue de chaque langue.
//
//   node scripts/check-i18n.mjs
//
// Motivation : le registre n'émet que des clés (`labelKey`, `legend[].key`,
// `stats()[].key`) et les mots vivent dans i18n/locales/<langue>/carte.json. Une
// clé sans texte ne lève aucune erreur — elle s'affiche telle quelle, en petit,
// dans un coin de la carte. C'est exactement le genre de panne qu'une relecture
// ne voit pas et qu'un test doit attraper.
//
// Les libellés de statistiques sont le cas piégeux : `stats()` est une fonction,
// et certaines de ses tuiles ne sont émises que si les données s'y prêtent
// (« période couverte » suppose des dates). On l'appelle donc deux fois, à vide
// et avec un jeu représentatif, et on prend l'union.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { THEMES } from '../src/data/thematicMapsCore.js';
import { LANGS, PUBLISHED_LANGS } from '../src/i18n/routes.js';

const ici = dirname(fileURLToPath(import.meta.url));

// Jeu de propriétés couvrant les branches de tous les stats() du registre.
const ECHANTILLON = Array.from({ length: 40 }, (_, i) => ({
    properties: {
        date: `20${15 + (i % 9)}-06-01`,
        severity: [0, 1, 3, 10][i % 4],
        parking_type: ['stands', 'racks', 'shelter'][i % 3],
        capacity: '12',
        covered: i % 2 ? 'yes' : 'no',
        toilet_fee: ['free', 'paid', 'unknown'][i % 3],
        wheelchair: 'yes',
        category: ['toilets', 'water'][i % 2],
        repair_kind: ['shop', 'selfservice'][i % 2],
        access: 'yes',
        bikes_available: 3,
        bikes_electric: 1,
        docks_available: 2,
        level: ['green', 'orange', 'red'][i % 3],
        status: 'ok',
        lit: 'yes',
    },
}));

const valeur = (objet, chemin) => chemin.split('.').reduce((n, p) => n?.[p], objet);

// --- tables du module carte ------------------------------------------------
//
// mapConstants.js n'est pas chargeable par Node (il importe un JSON et un
// import.meta.glob), donc on lit ses identifiants dans le source. C'est un
// garde-fou, pas une preuve : il attrape la clé oubliée, pas une table renommée.
const TABLES_CARTE = [
    ['MAP_STYLES', 'fond', 'id'],
    ['PARKING_TYPES', 'parking', 'id'],
    ['TOILET_TYPES', 'toilettes', 'id'],
    ['REPAIR_TYPES', 'reparation', 'id'],
    ['POI_CATEGORIES', 'poi', 'id'],
    ['POI_DETAIL_FIELDS', 'champPoi', 'key'],
    ['ACCIDENT_DETAIL_FIELDS', 'champAccident', 'key'],
    ['ACCIDENT_LEGEND', 'graviteAccident', 'key'],
    ['BIKESHARE_COUNT_FIELDS', 'vls', 'key'],
    ['BIKESHARE_TOTAL_FIELD', 'vls', 'key'],
    ['BIKESHARE_DETAIL_FIELDS', 'vls', 'key'],
];

function verifierTablesCarte(catalogue, lang, bloquante) {
    const source = readFileSync(join(ici, '..', 'src', 'modules', 'map', 'shared', 'mapConstants.js'), 'utf-8');
    let manquantes = 0;
    let controlees = 0;

    for (const [table, prefixe, champ] of TABLES_CARTE) {
        const debut = source.indexOf(`export const ${table} = `);
        if (debut === -1) continue;
        const fin = source.indexOf(table.includes('TOTAL') ? '\n};' : '\n];', debut);
        const motif = new RegExp(`${champ}\\s*:\\s*['"]([\\w-]+)['"]`, 'g');

        for (const [, id] of source.slice(debut, fin).matchAll(motif)) {
            controlees += 1;
            if (catalogue.carte?.[prefixe]?.[id]) continue;
            // Comptée dans tous les cas : c'est ce chiffre qui donne l'avancement
            // d'une langue non encore servie. Seul l'affichage dépend de `bloquante`.
            manquantes += 1;
            if (bloquante) console.error(`MANQUANT   ${lang} — carte.${prefixe}.${id} (${table})`);
        }
    }
    return { manquantes, controlees };
}




// --- registres éditoriaux --------------------------------------------------
//
// Vérifie que chaque registre de langue est cohérent avec le socle : pas de page
// rangée par erreur dans CITIES_CONTENT, pas de page orpheline d'une ville, et
// des clés PAGE_CONTENT qui existent bien dans le registre de référence.
async function verifierRegistres() {
    const anomalies = [];
    const { CITIES, THEMES } = await import('../src/data/thematicMapsCore.js');
    const villesConnues = new Set(CITIES.map(c => c.slug));
    const themesConnus = new Set(Object.keys(THEMES));

    for (const lang of LANGS) {
        let registre;
        try {
            registre = await import(`../src/data/thematicMaps.${lang}.js`);
        } catch {
            continue;   // une langue sans registre n'a simplement pas de cartes
        }

        for (const cle of Object.keys(registre.CITIES_CONTENT ?? {})) {
            if (!villesConnues.has(cle)) {
                anomalies.push(`${lang} — CITIES_CONTENT contient « ${cle} », qui n'est pas une ville du socle`);
            }
        }

        for (const cle of Object.keys(registre.PAGE_CONTENT ?? {})) {
            const [ville, theme] = cle.split('/');
            if (!villesConnues.has(ville)) {
                anomalies.push(`${lang} — PAGE_CONTENT « ${cle} » : ville inconnue`);
            } else if (!registre.CITIES_CONTENT?.[ville]) {
                anomalies.push(`${lang} — PAGE_CONTENT « ${cle} » : la ville n'a pas d'entrée éditoriale`);
            }
            if (!themesConnus.has(theme)) {
                anomalies.push(`${lang} — PAGE_CONTENT « ${cle} » : thème inconnu`);
            }
        }
    }

    // La réponse « villes » de la FAQ cite chaque ville du socle et la lie à sa page :
    // c'est le maillage interne du référencement local. Une ville ajoutée au registre
    // sans être citée là reste invisible depuis la FAQ ; une ville citée après son
    // retrait du registre perd son lien en silence, puisque <Trans> rend une balise
    // sans composant homonyme comme du texte nu. Les deux sens se vérifient donc.
    const BALISES_HORS_VILLE = new Set(['carte', 'itineraire', 'donnees', 'mail']);
    for (const lang of LANGS) {
        let faq;
        try {
            faq = readFileSync(join(ici, '..', 'src', 'i18n', 'locales', lang, 'faq.json'), 'utf-8');
        } catch {
            continue;
        }
        const balises = new Set([...faq.matchAll(/<(\w+)>/g)].map(m => m[1]));
        for (const slug of villesConnues) {
            if (!balises.has(slug)) {
                anomalies.push(`${lang}/faq.json — la ville « ${slug} » du socle n'est ni citée ni liée`);
            }
        }
        for (const balise of balises) {
            if (!villesConnues.has(balise) && !BALISES_HORS_VILLE.has(balise)) {
                anomalies.push(`${lang}/faq.json — balise « ${balise} » : ni ville du socle, ni lien connu`);
            }
        }
    }

    return anomalies;
}

let anomalies = 0;
let restantes = 0;

for (const lang of LANGS) {
    // Seules les langues PUBLIÉES doivent être complètes. Une langue routée mais pas
    // encore publiée est en cours de traduction : exiger sa complétude bloquerait le
    // build pendant tout le temps où on la rédige, ce qui pousserait à contourner le
    // garde-fou plutôt qu'à s'en servir. Elle le redeviendra à sa publication.
    const bloquante = PUBLISHED_LANGS.includes(lang);

    let catalogue;
    try {
        catalogue = JSON.parse(readFileSync(join(ici, '..', 'src', 'i18n', 'locales', lang, 'carte.json'), 'utf-8'));
    } catch {
        if (bloquante) {
            console.error(`MANQUANT   ${lang} — locales/${lang}/carte.json absent alors que la langue est servie`);
            anomalies += 1;
        }
        continue;
    }

    let controlees = 0;
    for (const [slug, theme] of Object.entries(THEMES)) {
        const manquantes = [];

        if (!valeur(catalogue, theme.labelKey)) manquantes.push(theme.labelKey);

        for (const item of theme.legend ?? []) {
            if (!catalogue.theme?.[slug]?.legend?.[item.key]) manquantes.push(`theme.${slug}.legend.${item.key}`);
        }

        const tuiles = [...theme.stats([]), ...theme.stats(ECHANTILLON)];
        for (const tuile of tuiles) {
            if (!tuile.key) {
                manquantes.push(`theme.${slug}.stats : une tuile sans clé (${JSON.stringify(tuile)})`);
                continue;
            }
            if (!catalogue.theme?.[slug]?.stats?.[tuile.key]) manquantes.push(`theme.${slug}.stats.${tuile.key}`);
        }

        controlees += 1 + (theme.legend?.length ?? 0) + new Set(tuiles.map(t => t.key)).size;

        for (const cle of [...new Set(manquantes)]) {
            if (bloquante) {
                console.error(`MANQUANT   ${lang} — ${cle}`);
                anomalies += 1;
            } else {
                restantes += 1;
            }
        }
    }

    const tables = verifierTablesCarte(catalogue, lang, bloquante);
    controlees += tables.controlees;
    if (bloquante) anomalies += tables.manquantes;
    else restantes += tables.manquantes;

    if (!bloquante) {
        console.log(`${lang} : ${controlees - restantes}/${controlees} clés traduites `
            + `(langue non encore servie, non bloquant).`);
        restantes = 0;
    } else if (!anomalies) {
        console.log(`${lang} : ${controlees} clés de libellé résolues.`);
    }
}

// --- parité des catalogues ------------------------------------------------
//
// Le reste de ce script ne contrôle que le domaine « carte », parce que ses clés
// sont émises par le registre. Les sept autres domaines n'avaient aucun garde-fou :
// une clé présente en français et absente en anglais ne casse rien au build et,
// avec fallbackLng désactivé, s'affiche telle quelle sur la page servie.
//
// On compare donc les catalogues deux à deux avec le français : mêmes chemins de
// clés, mêmes balises de lien, mêmes variables d'interpolation. Une balise sans
// jumelle est le cas piégeux — <donnees>…</donnees> oubliée dans la version
// anglaise fait disparaître le lien, sans rien signaler.
const NAMESPACES = [...new Set([
    ...readFileSync(join(ici, '..', 'src', 'i18n', 'catalogues.js'), 'utf-8')
        .matchAll(/^\s+(\w+):\s+\(\) => import\(/gm)].map(m => m[1]))];

const aplatir = (objet, prefixe = '') => Object.entries(objet).flatMap(([cle, valeur]) =>
    (valeur && typeof valeur === 'object')
        ? aplatir(valeur, `${prefixe}${cle}.`)
        : [[`${prefixe}${cle}`, String(valeur)]]);

const GRAMMAIRE = { prep: 'lieu', ville: 'lieu' };

const motifs = (texte, expression) => [...texte.matchAll(expression)]
    .map(m => GRAMMAIRE[m[1]] ?? m[1]).sort().join(',');

function verifierParite(lang) {
    const anomalies = [];
    for (const ns of NAMESPACES) {
        const lire = (l) => JSON.parse(readFileSync(join(ici, '..', 'src', 'i18n', 'locales', l, `${ns}.json`), 'utf-8'));
        const fr = new Map(aplatir(lire('fr')));
        const autre = new Map(aplatir(lire(lang)));

        for (const cle of fr.keys()) {
            if (!autre.has(cle)) { anomalies.push(`${lang}/${ns}.json — clé absente : ${cle}`); continue; }
            for (const [quoi, expression] of [['balise', /<(\w+)>/g], ['variable', /\{\{\s*(\w+)/g]]) {
                const a = motifs(fr.get(cle), expression);
                const b = motifs(autre.get(cle), expression);
                if (a !== b) anomalies.push(`${lang}/${ns}.json — ${quoi}s différentes sur ${cle} : fr=[${a}] ${lang}=[${b}]`);
            }
        }
        for (const cle of autre.keys()) {
            if (!fr.has(cle)) anomalies.push(`${lang}/${ns}.json — clé en trop, absente du français : ${cle}`);
        }
    }
    return anomalies;
}

for (const lang of LANGS.filter(l => l !== 'fr')) {
    const ecarts = verifierParite(lang);
    if (!PUBLISHED_LANGS.includes(lang)) {
        console.log(`${lang} : parité des catalogues — ${ecarts.length} écart(s) (langue non encore servie, non bloquant).`);
        continue;
    }
    for (const ligne of ecarts) {
        console.error(`PARITÉ     ${ligne}`);
        anomalies += 1;
    }
    if (!ecarts.length) console.log(`${lang} : ${NAMESPACES.length} domaines à parité avec le français.`);
}

for (const ligne of await verifierRegistres()) {
    console.error(`REGISTRE   ${ligne}`);
    anomalies += 1;
}

if (anomalies > 0) {
    console.error(`\n${anomalies} clé(s) sans texte. Ces libellés s'afficheraient bruts.`);
    process.exit(1);
}
