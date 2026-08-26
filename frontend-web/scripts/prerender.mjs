#!/usr/bin/env node
//
// Lance react-snap par son API plutôt que par sa configuration `package.json`.
//
// Raison : la liste des pages à prérendre dépend des langues publiées. La figer dans un
// tableau littéral recréerait exactement la divergence entre sitemap et prérendu que
// generate-seo.mjs avait été écrit pour supprimer.
//
// Les routes /carte/* ne sont pas listées : react-snap les découvre en suivant les
// ancres du DOM depuis le hub. Cette doctrine est inchangée — c'est aussi elle qui fait
// que le sélecteur de langue doit rendre un <a> et non un <button>.

import { createRequire } from 'node:module';

import { PRIVATE_KEYS, PUBLISHED_LANGS, ROUTE_PATHS, pathFor } from '../src/i18n/routes.js';

// Graines du crawl : les pages qu'aucun lien ne garantit d'atteindre depuis l'accueil.
const GRAINES = [
    'home', 'itineraire', 'login', 'signin', 'mentionsLegales', 'confidentialite',
    'conditions', 'suppressionCompte', 'contact', 'faq', 'donnees', 'carteHub',
];

const include = PUBLISHED_LANGS.flatMap((lang) =>
    GRAINES
        .filter((cle) => ROUTE_PATHS[cle]?.[lang] && !PRIVATE_KEYS.has(cle))
        .map((cle) => pathFor(cle, lang)));

const { run } = createRequire(import.meta.url)('react-snap');

await run({
    source: 'dist',
    include,
    inlineCss: false,
    skipThirdPartyRequests: true,
    concurrency: Number(process.env.SNAP_CONCURRENCY ?? 1),
    puppeteerArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
    ],
});
