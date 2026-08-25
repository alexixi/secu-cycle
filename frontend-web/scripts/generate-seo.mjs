#!/usr/bin/env node
//
// Génère public/sitemap.xml à partir des routes statiques déclarées ici et des routes
// dérivées du registre src/data/thematicMaps.js. Branché en `prebuild` : le fichier
// produit est ensuite recopié tel quel dans dist/ par Vite.
//
// Avant, sitemap.xml était écrit à la main et avait déjà divergé de reactSnap.include.
// Ajouter une carte thématique ne demande désormais aucune intervention ici.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { SITE_URL, ROUTES } from '../src/data/thematicMaps.js';

const ici = dirname(fileURLToPath(import.meta.url));
const SORTIE = join(ici, '..', 'public', 'sitemap.xml');

// Pages éditoriales fixes. `priority` et `changefreq` reprennent les valeurs qui étaient
// déjà en place dans l'ancien sitemap écrit à la main.
const PAGES_STATIQUES = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/itineraire', changefreq: 'weekly', priority: '0.9' },
    { path: '/faq', changefreq: 'monthly', priority: '0.7' },
    { path: '/donnees', changefreq: 'monthly', priority: '0.6' },
    { path: '/confidentialite', changefreq: 'yearly', priority: '0.5' },
    { path: '/conditions-utilisation', changefreq: 'yearly', priority: '0.4' },
    { path: '/suppression-compte', changefreq: 'yearly', priority: '0.4' },
    { path: '/contact', changefreq: 'yearly', priority: '0.4' },
    { path: '/mentions-legales', changefreq: 'yearly', priority: '0.3' },
];

// Le hub général et les hubs de ville changent dès qu'une carte est ajoutée ; les cartes
// elles-mêmes s'appuient sur des données resynchronisées régulièrement.
const priorisationCarte = (route) => {
    const profondeur = route.split('/').filter(Boolean).length;
    if (profondeur === 1) return { changefreq: 'weekly', priority: '0.8' };   // /carte
    if (profondeur === 2) return { changefreq: 'weekly', priority: '0.7' };   // /carte/<ville>
    return { changefreq: 'weekly', priority: '0.6' };                         // /carte/<ville>/<thème>
};

const aujourdhui = new Date().toISOString().slice(0, 10);

// Le composant Meta normalise toutes les canoniques avec un slash final : le sitemap doit
// pointer exactement sur la même URL, sinon Google voit deux adresses concurrentes.
const avecSlashFinal = (path) => (path.endsWith('/') ? path : `${path}/`);

const entrees = [
    ...PAGES_STATIQUES,
    ...ROUTES.map(route => ({ path: route, ...priorisationCarte(route) })),
];

const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entrees.map(({ path, changefreq, priority }) => [
        '  <url>',
        `    <loc>${SITE_URL}${avecSlashFinal(path)}</loc>`,
        `    <lastmod>${aujourdhui}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        '  </url>',
    ].join('\n')),
    '</urlset>',
    '',
].join('\n');

writeFileSync(SORTIE, xml, 'utf-8');

console.log(`sitemap.xml généré : ${entrees.length} URL (${PAGES_STATIQUES.length} statiques, ${ROUTES.length} cartes)`);
