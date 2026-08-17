#!/usr/bin/env node
//
// Garde-fou exécuté après react-snap : vérifie que chaque URL du sitemap a bien un HTML
// prérendu dans dist/ ET que ce HTML contient réellement son contenu.
//
// Motivation : un build lancé sans PUPPETEER_EXECUTABLE_PATH (ou avec un Chromium
// introuvable) produit des index.html vides — la page fonctionne toujours pour un
// visiteur, puisque React s'hydrate, mais les moteurs ne voient plus rien. La panne est
// totalement silencieuse et détruit le référencement. Ce script la rend bloquante.
//
//   node scripts/verify-prerender.mjs

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { SITE_URL, PAGES, CITIES } from '../src/data/thematicMaps.js';

const ici = dirname(fileURLToPath(import.meta.url));
const DIST = join(ici, '..', 'dist');
const SITEMAP = join(DIST, 'sitemap.xml');

// Chaîne devant apparaître dans le HTML prérendu de chaque route. Pour les pages
// génériques on vérifie le H1 réel, ce qui prouve que React a bien été exécuté et que le
// registre a été résolu — un simple <div id="root"></div> ne passerait pas.
const ATTENDU = {
    '/': 'Sécu',
    '/itineraire/': 'itinéraire',
    '/faq/': 'Foire aux questions',
    '/donnees/': 'Sources',
    '/contact/': 'Contact',
    '/mentions-legales/': 'Mentions',
    '/confidentialite/': 'confidentialité',
    '/conditions-utilisation/': 'utilisation',
    '/carte/': 'Cartes cyclables par ville',
    ...Object.fromEntries(CITIES.map(c => [`/carte/${c.slug}/`, `Cartes cyclables ${c.prep}`])),
    ...Object.fromEntries(PAGES.map(p => [`${p.path}/`, p.content.h1])),
};

if (!existsSync(SITEMAP)) {
    console.error(`sitemap.xml introuvable dans ${DIST} — le build a-t-il été lancé ?`);
    process.exit(1);
}

const sitemap = readFileSync(SITEMAP, 'utf-8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

if (urls.length === 0) {
    console.error('Le sitemap ne contient aucune URL.');
    process.exit(1);
}

// Une page prérendue correctement contient du texte hors du script de bootstrap.
const texteVisible = (html) => html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

let erreurs = 0;
let controles = 0;

for (const url of urls) {
    const chemin = url.replace(SITE_URL, '');
    const fichier = join(DIST, chemin, 'index.html');

    if (!existsSync(fichier)) {
        console.error(`MANQUANT   ${chemin} — ${fichier} absent (route non prérendue par react-snap ?)`);
        erreurs += 1;
        continue;
    }

    const html = readFileSync(fichier, 'utf-8');
    const visible = texteVisible(html);

    if (visible.length < 200) {
        console.error(`VIDE       ${chemin} — ${visible.length} caractères de texte visible, `
            + 'le prérendu a échoué (PUPPETEER_EXECUTABLE_PATH manquant ?)');
        erreurs += 1;
        continue;
    }

    const attendu = ATTENDU[chemin];
    if (attendu && !html.includes(attendu)) {
        console.error(`CONTENU    ${chemin} — « ${attendu} » absent du HTML prérendu`);
        erreurs += 1;
        continue;
    }

    if (!html.includes('rel="canonical"')) {
        console.error(`CANONIQUE  ${chemin} — pas de <link rel="canonical">`);
        erreurs += 1;
        continue;
    }

    controles += 1;
}

if (erreurs > 0) {
    console.error(`\n${erreurs} page(s) en échec sur ${urls.length}. Build à ne pas déployer.`);
    process.exit(1);
}

console.log(`Prérendu vérifié : ${controles} page(s) contiennent leur contenu et leur canonique.`);
