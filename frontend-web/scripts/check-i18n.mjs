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

import { existsSync, readdirSync, readFileSync } from 'node:fs';
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

    // Le nom de ville est le SEUL champ textuel que le socle transmet aux
    // registres éditoriaux. Sans surcharge, buildRegistry retombe dessus — et il
    // est écrit en français. « Bruxelles » s'est ainsi affiché sur les pages
    // anglaises alors que son slug d'URL, lui, était bien traduit. On exige donc
    // une déclaration explicite : même « Paris » vaut mieux dit que sous-entendu.
    for (const lang of LANGS.filter(l => l !== 'fr')) {
        let registre;
        try {
            registre = await import(`../src/data/thematicMaps.${lang}.js`);
        } catch {
            continue;
        }
        for (const city of CITIES) {
            const editorial = registre.CITIES_CONTENT?.[city.slug];
            if (editorial && !editorial.name) {
                anomalies.push(`${lang} — la ville « ${city.slug} » ne déclare pas son nom :`
                    + ` le socle imposerait « ${city.name} », en français`);
            }
        }
    }

    return anomalies;
}

// --- littéraux français en dur ------------------------------------------------
//
// Le contrôle qui manquait. Les catalogues peuvent être parfaitement à parité
// pendant qu'un composant entier rend du français en dur : c'est exactement ce
// qui s'est produit sur la page itinéraire, où cinq composants n'avaient aucun
// `t()` alors que le domaine `itineraire` existait depuis des mois.
//
// Heuristique : un littéral est suspect s'il porte un accent OU un mot-outil
// français, ET au moins une espace. La condition d'espace élimine l'essentiel du
// bruit — un mot isolé est bien plus souvent un identifiant, une classe CSS ou
// un nom propre qu'une phrase d'interface. Elle laisse donc passer « Terminer »
// ou « Retour » : c'est le prix d'un contrôle qu'on ne contourne pas.
//
// On attrape aussi, indépendamment de tout mot français, les formateurs figés
// sur une locale littérale. C'est la classe de défaut la plus dangereuse : elle
// ne contient aucun mot à repérer, survit à toute relecture, et produit « il y a
// 5 minutes » au milieu d'une page anglaise.

const ACCENT = /[éèêëàâçùûüôöîïœÉÈÀÇÔÎ]/;
const MOT_OUTIL = /\b(le|la|les|des|une|un|du|vous|votre|vos|pour|avec|sur|dans|est|sont|par|aucun|aucune|cette|ce|et|au|aux|qui|que|pas|plus|non|ses|son|sa|nos|notre|ou)\b/i;
// L'élision est le marqueur le plus spécifiquement français : « d'administration »,
// « l'éclairage », « n'est ». L'anglais ne la connaît pas — « don't » a bien une
// apostrophe, mais précédée d'une lettre, d'où l'ancrage sur un début de mot.
const ELISION = /(?:^|[\s(«"'`>])[dlnmtsjcDLNMTSJC]'/;
// Mots d'interface français dépourvus d'accent, de mot-outil et d'élision : ni
// l'un ni l'autre des filtres précédents ne les voit. La liste est courte et
// volontairement sans ambiguïté avec l'anglais — « Ressenti », « rafales » et
// « Page d'administration » sont passés au travers avant qu'elle existe.
const MOT_FRANCAIS = /\b(ressenti|rafales?|couvert|terminer|retour|clair|sombre|ajouter|modifier|supprimer|confirmer|annuler|fermer|enregistrer|valider|envoyer|rechercher|connexion|deconnexion|parametres|adresse|velo|trajet|itineraire|depart|arrivee|duree|vitesse|semaine|aucun|oui|non|precedent|suivant|nuage|pluie|neige|brouillard|vent)\b/i;
const LITTERAL = /(["'`])((?:(?!\1)[^\\]|\\.){2,})\1/g;
const TEXTE_JSX = />\s*([A-Za-zÀ-ÿ][^<>{}\n]{3,})\s*</g;
// Positions où un littéral est forcément lu par l'utilisateur. Là, on ne cherche
// plus des indices de français : TOUT littéral est suspect, quelle que soit la
// langue. C'est ce qui attrape « Ressenti », « Terminer » ou « Clair » — des mots
// sans accent, sans mot-outil et sans élision, que l'heuristique française
// laisse passer par construction. Le bruit mesuré est de six exemptions sur tout
// le dépôt, toutes des noms propres.
const ATTRIBUT_VISIBLE = /\b(title|aria-label|placeholder|alt)=(["'])([^"']{2,})\2/g;
const TEXTE_JSX_NU = />\s*([A-Za-zÀ-ÿ][^<>{}\n]{1,})\s*</g;
const LOCALE_FIGEE = /(?:toLocale(?:Date|Time)?String|Intl\.[A-Za-z]+Format)\s*\(\s*['"][a-z]{2}(?:-[A-Z]{2})?['"]/;

// Fichiers hors du contrôle : le catalogue de référence, les deux registres
// éditoriaux et les jeux d'essai. Les registres sont de la prose relue comme
// telle, et l'anglais y cite forcément des noms propres français — « Métropole
// de Lyon », « Île-de-France » — que l'heuristique ne peut pas distinguer d'une
// phrase oubliée.
const CHEMINS_EXEMPTS = [
    /src[/\\]i18n[/\\]locales[/\\]fr[/\\]/,
    /thematicMaps\.(fr|en)\.js$/,
    /\.mock\.[jt]sx?$/,
];

// Deux formes d'exemption, la raison étant obligatoire dans les deux cas : c'est
// elle qui distingue une exemption réfléchie d'un contournement.
//
//   // i18n-exempt: <raison>              -> la ligne suivante
//   // i18n-exempt-start: <raison>  ...   -> jusqu'à // i18n-exempt-end
//
// Les deux s'écrivent aussi en commentaire JSX — {/* i18n-exempt: … */} — car
// dans du JSX, `//` n'est pas un commentaire : il est rendu comme du texte.
//
// La forme par région existe pour les tables de noms propres — titres officiels
// de jeux de données, opérateurs, licences — où quarante marqueurs de ligne
// noieraient la raison au lieu de la porter.
const OUVERTURE = String.raw`^\s*(?:\/\/|\{\s*\/\*)\s*`;
const EXEMPTION = new RegExp(OUVERTURE + String.raw`i18n-exempt\s*:\s*\S`);
const EXEMPTION_DEBUT = new RegExp(OUVERTURE + String.raw`i18n-exempt-start\s*:\s*\S`);
const EXEMPTION_FIN = new RegExp(OUVERTURE + String.raw`i18n-exempt-end\b`);

function fichiersSource(racine) {
    const out = [];
    for (const entree of readdirSync(racine, { withFileTypes: true })) {
        const chemin = join(racine, entree.name);
        if (entree.isDirectory()) out.push(...fichiersSource(chemin));
        else if (/\.(jsx?|tsx?)$/.test(entree.name)) out.push(chemin);
    }
    return out;
}

function verifierLitteraux() {
    const anomalies = [];
    const racine = join(ici, '..', 'src');

    for (const chemin of fichiersSource(racine)) {
        const relatif = chemin.slice(join(ici, '..').length + 1);
        if (CHEMINS_EXEMPTS.some(motif => motif.test(relatif))) continue;

        const lignes = readFileSync(chemin, 'utf-8').split('\n');
        let dansRegion = false;
        lignes.forEach((ligne, index) => {
            if (EXEMPTION_DEBUT.test(ligne)) { dansRegion = true; return; }
            if (EXEMPTION_FIN.test(ligne)) { dansRegion = false; return; }
            if (dansRegion) return;

            const nu = ligne.trim();
            if (nu.startsWith('//') || nu.startsWith('*') || nu.startsWith('/*') || nu.startsWith('{/*')) return;
            if (ligne.includes('console.')) return;
            if (index > 0 && EXEMPTION.test(lignes[index - 1])) return;

            if (LOCALE_FIGEE.test(ligne)) {
                anomalies.push(`${relatif}:${index + 1} — locale figée : ${nu.slice(0, 70)}`);
                return;
            }

            const suspects = [];
            for (const m of ligne.matchAll(LITTERAL)) {
                const texte = m[2];
                if (!texte.includes(' ')) continue;
                if (/^(https?:|#|var\(|data:|M )/.test(texte)) continue;
                // Un gabarit qui commence par un préfixe de clé ou par une
                // interpolation est un chemin ou une clé de catalogue —
                // « velo.${type} », « ${pathFor(…)}?couche=… » — jamais du texte
                // affiché. Le mot français qu'il contient est un identifiant.
                if (/^[\w.]*\$\{/.test(texte)) continue;
                if (ACCENT.test(texte) || MOT_OUTIL.test(texte) || ELISION.test(texte) || MOT_FRANCAIS.test(texte)) suspects.push(texte);
            }
            for (const m of ligne.matchAll(TEXTE_JSX)) {
                const texte = m[1].trim();
                if (ACCENT.test(texte) || MOT_OUTIL.test(texte) || ELISION.test(texte) || MOT_FRANCAIS.test(texte)) suspects.push(texte);
            }
            for (const texte of suspects) {
                anomalies.push(`${relatif}:${index + 1} — littéral français : « ${texte.slice(0, 60)} »`);
            }
            if (!/\.(jsx|tsx)$/.test(relatif)) return;
            const visibles = [];
            for (const m of ligne.matchAll(ATTRIBUT_VISIBLE)) visibles.push(`${m[1]}="${m[3]}"`);
            for (const m of ligne.matchAll(TEXTE_JSX_NU)) {
                const texte = m[1].trim();
                if (texte) visibles.push(texte);
            }
            for (const texte of visibles) {
                if (suspects.includes(texte)) continue;
                anomalies.push(`${relatif}:${index + 1} — texte visible en dur : « ${texte.slice(0, 60)} »`);
            }
        });
    }
    return anomalies;
}

// --- domaines chargés vs domaines consommés -----------------------------------
//
// Troisième mode de défaillance, distinct des deux autres et tout aussi
// silencieux : un composant déclare `useTranslation('carte')` alors que la page
// qui l'affiche ne charge pas ce domaine. La clé est alors servie telle quelle.
//
// C'est arrivé deux fois. `AdressInput` lisait le domaine `auth` alors qu'il est
// rendu par la page itinéraire ; et `ProfilePage` rendait MapComponent, via la
// modale d'historique, sans charger `carte` — l'infobulle du bouton de fond de
// carte y affichait « ui.controles.changerFond ».
//
// On remonte donc le graphe d'imports de chaque page et on compare ce que ses
// composants consomment à ce que `lazyPage` déclare. `common` est chargé à
// l'initialisation, il est donc toujours disponible.

const resoudreImport = (depuis, spec) => {
    if (!spec.startsWith('.')) return null;
    const base = join(dirname(depuis), spec);
    for (const candidat of [base, `${base}.jsx`, `${base}.js`, join(base, 'index.jsx'), join(base, 'index.js')]) {
        if (existsSync(candidat) && !candidat.endsWith('.json')) return candidat;
    }
    return null;
};

const grapheImports = (racine, vus = new Set()) => {
    if (vus.has(racine)) return vus;
    vus.add(racine);
    for (const m of readFileSync(racine, 'utf-8').matchAll(/from\s+["']([^"']+)["']/g)) {
        const resolu = resoudreImport(racine, m[1]);
        if (resolu) grapheImports(resolu, vus);
    }
    return vus;
};

const domainesConsommes = (fichier) => {
    const src = readFileSync(fichier, 'utf-8');
    const out = new Set();
    for (const m of src.matchAll(/useTranslation\(\s*['"](\w+)['"]/g)) out.add(m[1]);
    for (const m of src.matchAll(/ns:\s*['"](\w+)['"]/g)) out.add(m[1]);
    return out;
};

function verifierDomaines() {
    const anomalies = [];
    const src = join(ici, '..', 'src');
    const app = readFileSync(join(src, 'App.jsx'), 'utf-8');

    const pages = [
        ...[...app.matchAll(/const (\w+) = lazyPage\(\(\) => import\('\.\/([^']+)'\)((?:,\s*'\w+')*)\)/g)]
            .map(m => ({ nom: m[1], fichier: join(src, `${m[2]}.jsx`),
                declares: new Set(['common', ...[...m[3].matchAll(/'(\w+)'/g)].map(x => x[1])]) })),
        // carteLazy charge « carte » pour les trois pages de cartes thématiques.
        ...[...app.matchAll(/const (\w+) = carteLazy\(\(\) => import\('\.\/([^']+)'\)\)/g)]
            .map(m => ({ nom: m[1], fichier: join(src, `${m[2]}.jsx`),
                declares: new Set(['common', 'carte']) })),
    ];

    for (const page of pages) {
        if (!existsSync(page.fichier)) {
            anomalies.push(`${page.nom} — fichier introuvable : ${page.fichier}`);
            continue;
        }
        for (const fichier of grapheImports(page.fichier)) {
            for (const ns of domainesConsommes(fichier)) {
                if (page.declares.has(ns)) continue;
                const relatif = fichier.slice(src.length + 1);
                anomalies.push(`${page.nom} ne charge pas « ${ns} », consommé par ${relatif}`);
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

const domaines = verifierDomaines();
for (const ligne of domaines) {
    console.error(`DOMAINE    ${ligne}`);
    anomalies += 1;
}
if (!domaines.length) console.log('chaque page charge les domaines que ses composants consomment.');

const litteraux = verifierLitteraux();
for (const ligne of litteraux) {
    console.error(`LITTÉRAL   ${ligne}`);
    anomalies += 1;
}
if (!litteraux.length) console.log('aucun littéral français en dur hors des fichiers exemptés.');

if (anomalies > 0) {
    console.error(`\n${anomalies} anomalie(s). Une clé sans texte s'affiche brute ; un littéral en dur`
        + ` ou une locale figée reste en français au milieu d'une page anglaise.`);
    console.error(`Pour un cas légitime — nom propre, titre officiel de jeu de données — poser`
        + ` « // i18n-exempt: <raison> » sur la ligne précédente.`);
    process.exit(1);
}
