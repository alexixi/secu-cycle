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
// Il couvre aussi les trois pannes silencieuses propres au multilingue :
//   - une canonique qui ne pointe pas sur l'URL de la page (une page /en/ qui
//     canonicaliserait vers le français la retirerait de l'index anglais) ;
//   - un <html lang> qui contredit le chemin ;
//   - un alternate déclaré au sitemap mais absent du HTML, ce qui fait rejeter
//     tout le groupe de langues par Google.
// Aucune ne lève d'erreur au build ni ne se voit à l'œil sur la page rendue.
//
//   node scripts/verify-prerender.mjs

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { buildRegistry } from '../src/data/buildRegistry.js';
import * as core from '../src/data/thematicMapsCore.js';
import { PUBLISHED_LANGS, langFromPathname, pathFor } from '../src/i18n/routes.js';

const SITE_URL = core.SITE_URL;

const avecSlashFinal = (chemin) => (chemin.endsWith('/') ? chemin : `${chemin}/`);

const ici = dirname(fileURLToPath(import.meta.url));
const DIST = join(ici, '..', 'dist');
const SITEMAP = join(DIST, 'sitemap.xml');

// Chaîne devant apparaître dans le HTML prérendu de chaque route. Pour les pages
// génériques on vérifie le H1 réel, ce qui prouve que React a bien été exécuté et que le
// registre a été résolu — un simple <div id="root"></div> ne passerait pas.
//
// Les extraits sont volontairement des littéraux et non des clés de catalogue : une
// coquille d'extraction i18n doit faire échouer le build, pas être masquée en comparant
// une traduction à elle-même.
const EXTRAITS = {
    fr: {
        home: 'Sécu', itineraire: 'itinéraire', faq: 'Foire aux questions',
        donnees: 'Sources', contact: 'Contact', mentionsLegales: 'Mentions',
        confidentialite: 'confidentialité', conditions: 'utilisation',
        suppressionCompte: 'Supprimer', carteHub: 'Cartes cyclables par ville',
    },
    en: {
        home: 'Sécu', itineraire: 'route', faq: 'Frequently asked questions',
        donnees: 'Data sources', contact: 'Contact', mentionsLegales: 'Legal notice',
        confidentialite: 'Privacy policy', conditions: 'Terms of use',
        suppressionCompte: 'Delete my account', carteHub: 'Cycling maps by city',
    },
};

const ATTENDU = {};
for (const lang of PUBLISHED_LANGS) {
    const editorial = await import(`../src/data/thematicMaps.${lang}.js`);
    const registre = buildRegistry(core, editorial);

    for (const [cle, extrait] of Object.entries(EXTRAITS[lang] ?? {})) {
        const chemin = pathFor(cle, lang);
        if (chemin) ATTENDU[avecSlashFinal(chemin)] = extrait;
    }
    for (const city of registre.CITIES) {
        ATTENDU[avecSlashFinal(pathFor('carteVille', lang, { citySlug: city.slug }))] =
            registre.cityHubTitle(city);
    }
    for (const page of registre.PAGES) {
        ATTENDU[avecSlashFinal(page.path)] = page.content.h1;
    }
}

if (!existsSync(SITEMAP)) {
    console.error(`sitemap.xml introuvable dans ${DIST} — le build a-t-il été lancé ?`);
    process.exit(1);
}

const sitemap = readFileSync(SITEMAP, 'utf-8');

// On lit chaque bloc <url> entier, et pas seulement sa <loc> : les xhtml:link
// qu'il porte sont la référence contre laquelle on vérifie les hreflang du HTML.
const entrees = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, bloc]) => ({
    loc: bloc.match(/<loc>([^<]+)<\/loc>/)?.[1],
    alternates: [...bloc.matchAll(/<xhtml:link[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"/g)]
        .map(([, hreflang, href]) => ({ hreflang, href })),
})).filter(e => e.loc);

const urls = entrees.map(e => e.loc);

if (urls.length === 0) {
    console.error('Le sitemap ne contient aucune URL.');
    process.exit(1);
}

// react-snap sérialise le DOM et réordonne les attributs : « <link href=… rel="canonical"> »
// et « <link rel="canonical" href=…> » sont tous deux possibles. On cherche donc la balise
// par l'un de ses attributs, puis on lit l'autre, au lieu de supposer un ordre.
const baliseAvec = (html, attribut, valeur) => [...html.matchAll(/<link\b[^>]*>/g)]
    .map(([balise]) => balise)
    .find(balise => balise.includes(`${attribut}="${valeur}"`));

const attribut = (balise, nom) => balise?.match(new RegExp(`${nom}="([^"]*)"`))?.[1];

// Une page prérendue correctement contient du texte hors du script de bootstrap.
const texteVisible = (html) => html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

let erreurs = 0;
let controles = 0;

for (const { loc: url, alternates } of entrees) {
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

    // Valeur, et pas seulement présence : une page qui canonicalise vers une autre
    // langue se retire elle-même de l'index sans que rien ne le signale.
    const canonique = attribut(baliseAvec(html, 'rel', 'canonical'), 'href');
    if (!canonique) {
        console.error(`CANONIQUE  ${chemin} — pas de <link rel="canonical">`);
        erreurs += 1;
        continue;
    }
    if (canonique !== url) {
        console.error(`CANONIQUE  ${chemin} — pointe sur ${canonique} au lieu de ${url}`);
        erreurs += 1;
        continue;
    }

    const langueAttendue = langFromPathname(chemin);
    const langueRendue = html.match(/<html\b[^>]*\blang="([^"]*)"/)?.[1];
    if (langueRendue !== langueAttendue) {
        console.error(`LANGUE     ${chemin} — <html lang="${langueRendue ?? ''}"> `
            + `alors que le chemin annonce « ${langueAttendue} »`);
        erreurs += 1;
        continue;
    }

    // Google exige que le groupe de langues soit déclaré des deux côtés : un alternate
    // présent au sitemap mais absent du HTML fait rejeter le groupe entier.
    const alternateManquant = alternates.find(({ hreflang, href }) => {
        const balise = [...html.matchAll(/<link\b[^>]*>/g)]
            .map(([b]) => b)
            .find(b => b.includes('rel="alternate"') && b.includes(`hreflang="${hreflang}"`));
        return !balise || attribut(balise, 'href') !== href;
    });
    if (alternateManquant) {
        console.error(`ALTERNATE  ${chemin} — hreflang="${alternateManquant.hreflang}" `
            + `vers ${alternateManquant.href} déclaré au sitemap mais absent du HTML`);
        erreurs += 1;
        continue;
    }

    controles += 1;
}

if (erreurs > 0) {
    console.error(`\n${erreurs} page(s) en échec sur ${urls.length}. Build à ne pas déployer.`);
    process.exit(1);
}

console.log(`Prérendu vérifié : ${controles} page(s) — contenu, canonique, langue et alternates.`);
