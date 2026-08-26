#!/usr/bin/env node
//
// Génère public/sitemap.xml à partir des routes déclarées dans src/i18n/routes.js et
// des registres éditoriaux de chaque langue. Branché en `prebuild` : le fichier produit
// est ensuite recopié tel quel dans dist/ par Vite.
//
// Avant, sitemap.xml était écrit à la main et avait déjà divergé de la liste des pages
// prérendues. Ajouter une carte thématique ou une langue ne demande désormais aucune
// intervention ici.
//
// Seules les langues PUBLIÉES entrent dans le sitemap : une langue routée mais en cours
// de rédaction ne doit pas être proposée à l'indexation.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { SITE_URL } from '../src/data/thematicMapsCore.js';
import { buildRegistry } from '../src/data/buildRegistry.js';
import * as core from '../src/data/thematicMapsCore.js';
import {
    PRIVATE_KEYS, PUBLISHED_LANGS, pathFor,
} from '../src/i18n/routes.js';

const ici = dirname(fileURLToPath(import.meta.url));
const SORTIE = join(ici, '..', 'public', 'sitemap.xml');

// Pages éditoriales fixes, désignées par leur clé de route : le chemin dépend de la
// langue et n'a donc rien à faire ici. `priority` et `changefreq` reprennent les valeurs
// qui étaient en place dans l'ancien sitemap écrit à la main.
const PAGES_STATIQUES = {
    home: { changefreq: 'weekly', priority: '1.0' },
    itineraire: { changefreq: 'weekly', priority: '0.9' },
    faq: { changefreq: 'monthly', priority: '0.7' },
    donnees: { changefreq: 'monthly', priority: '0.6' },
    confidentialite: { changefreq: 'yearly', priority: '0.5' },
    conditions: { changefreq: 'yearly', priority: '0.4' },
    suppressionCompte: { changefreq: 'yearly', priority: '0.4' },
    contact: { changefreq: 'yearly', priority: '0.4' },
    mentionsLegales: { changefreq: 'yearly', priority: '0.3' },
};

// Le hub général et les hubs de ville changent dès qu'une carte est ajoutée ; les cartes
// elles-mêmes s'appuient sur des données resynchronisées régulièrement.
const PRIORITE_CARTE = {
    carteHub: { changefreq: 'weekly', priority: '0.8' },
    carteVille: { changefreq: 'weekly', priority: '0.7' },
    carteTheme: { changefreq: 'weekly', priority: '0.6' },
};

const aujourdhui = new Date().toISOString().slice(0, 10);

// Le composant Meta normalise toutes les canoniques avec un slash final : le sitemap doit
// pointer exactement sur la même URL, sinon Google voit deux adresses concurrentes.
const avecSlashFinal = (path) => (path.endsWith('/') ? path : `${path}/`);
const absolu = (path) => `${SITE_URL}${avecSlashFinal(path)}`;

const registres = Object.fromEntries(await Promise.all(PUBLISHED_LANGS.map(async (lang) => {
    const editorial = await import(`../src/data/thematicMaps.${lang}.js`);
    return [lang, buildRegistry(core, editorial)];
})));

/**
 * Une entrée par (page, langue publiée). Les `alternates` d'une entrée listent le groupe
 * complet, auto-référence comprise : Google exige ces « return tags » et rejette un groupe
 * annoncé d'un seul côté. Une page absente d'une langue n'a pas d'alternate pour elle.
 */
function entreesPour(routeKey, params, priorite) {
    const langues = PUBLISHED_LANGS.filter((lang) => {
        if (PRIVATE_KEYS.has(routeKey)) return false;
        if (!params) return true;
        // Une page carte n'existe dans une langue que si son éditorial y est rédigé.
        return registres[lang].findPage(params.citySlug, params.themeSlug)
            || (!params.themeSlug && registres[lang].CITY_BY_SLUG[params.citySlug]);
    });

    const alternates = langues.map((lang) => ({
        hreflang: lang,
        href: absolu(pathFor(routeKey, lang, params)),
    }));

    return langues.map((lang) => ({
        loc: absolu(pathFor(routeKey, lang, params)),
        // Un groupe de moins de deux versions n'a pas de hreflang à annoncer.
        alternates: alternates.length > 1 ? alternates : [],
        ...priorite,
    }));
}

const entrees = [
    ...Object.entries(PAGES_STATIQUES).flatMap(([cle, p]) => entreesPour(cle, null, p)),
    ...entreesPour('carteHub', null, PRIORITE_CARTE.carteHub),
    ...core.CITIES.flatMap((c) => entreesPour('carteVille', { citySlug: c.slug }, PRIORITE_CARTE.carteVille)),
    ...core.CITIES.flatMap((c) => c.themes.flatMap((theme) =>
        entreesPour('carteTheme', { citySlug: c.slug, themeSlug: theme }, PRIORITE_CARTE.carteTheme))),
];

const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    // xmlns:xhtml est OBLIGATOIRE dès qu'on émet des <xhtml:link> : sans lui le sitemap
    // est invalide et Google ignore purement et simplement les alternates.
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
    + ' xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entrees.map(({ loc, alternates, changefreq, priority }) => [
        '  <url>',
        `    <loc>${loc}</loc>`,
        ...alternates.map(({ hreflang, href }) =>
            `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}"/>`),
        ...(alternates.length > 1
            ? [`    <xhtml:link rel="alternate" hreflang="x-default" href="${alternates[0].href}"/>`]
            : []),
        `    <lastmod>${aujourdhui}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        '  </url>',
    ].join('\n')),
    '</urlset>',
    '',
].join('\n');

writeFileSync(SORTIE, xml, 'utf-8');

const parLangue = PUBLISHED_LANGS
    .map((lang) => `${lang} ${entrees.filter(e => e.loc.includes(`/${lang}/`) || lang === PUBLISHED_LANGS[0]).length}`)
    .join(', ');
console.log(`sitemap.xml généré : ${entrees.length} URL (langues publiées : ${PUBLISHED_LANGS.join(', ')})`);
