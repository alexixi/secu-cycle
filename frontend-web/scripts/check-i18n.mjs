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
import { LANGS } from '../src/i18n/routes.js';

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

let anomalies = 0;

for (const lang of LANGS) {
    let catalogue;
    try {
        catalogue = JSON.parse(readFileSync(join(ici, '..', 'src', 'i18n', 'locales', lang, 'carte.json'), 'utf-8'));
    } catch {
        // Une langue déclarée mais pas encore traduite n'est pas une anomalie : les
        // catalogues arrivent après la mécanique. Elle le devient quand la langue est
        // activée dans ENABLED_LANGS, ce que verify-prerender attrape au build.
        console.log(`${lang} : pas de catalogue carte.json, langue ignorée.`);
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
            console.error(`MANQUANT   ${lang} — ${cle}`);
            anomalies += 1;
        }
    }

    if (!anomalies) console.log(`${lang} : ${controlees} clés de libellé résolues.`);
}

if (anomalies > 0) {
    console.error(`\n${anomalies} clé(s) sans texte. Ces libellés s'afficheraient bruts.`);
    process.exit(1);
}
