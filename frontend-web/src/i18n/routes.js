// Table des chemins par langue, et résolution d'URL.
// Le français vit à la racine, l'anglais sous /en/.

import { PARAM_SLUGS } from './slugs.js';

export const LANGS = ['fr', 'en'];
export const DEFAULT_LANG = 'fr';

// Langues effectivement routées, prérendues et présentes dans le sitemap.
// L'anglais est déclaré partout ci-dessous bien avant d'être publié : cette
// constante est l'unique interrupteur, pour que l'ajout des routes /en/ soit un
// changement d'une ligne, isolé et réversible.
export const ENABLED_LANGS = ['fr'];

const PREFIX = { fr: '', en: '/en' };

// Chemins SANS préfixe de langue. `null` = la route n'existe pas dans cette
// langue, et n'aura donc ni alternate, ni entrée de sitemap, ni prérendu.
export const ROUTE_PATHS = {
    home:              { fr: '/',                           en: '/' },
    itineraire:        { fr: '/itineraire',                 en: '/route' },
    profil:            { fr: '/profil',                     en: '/profile' },
    profilEmail:       { fr: '/profil/email',               en: '/profile/email' },
    login:             { fr: '/login',                      en: '/login' },
    forgotPassword:    { fr: '/forgot-password',            en: '/forgot-password' },
    signin:            { fr: '/signin',                     en: '/sign-up' },
    admin:             { fr: '/admin',                      en: '/admin' },
    mentionsLegales:   { fr: '/mentions-legales',           en: '/legal-notice' },
    confidentialite:   { fr: '/confidentialite',            en: '/privacy-policy' },
    conditions:        { fr: '/conditions-utilisation',     en: '/terms-of-use' },
    suppressionCompte: { fr: '/suppression-compte',         en: '/delete-account' },
    contact:           { fr: '/contact',                    en: '/contact' },
    faq:               { fr: '/faq',                        en: '/faq' },
    donnees:           { fr: '/donnees',                    en: '/data-sources' },
    carteHub:          { fr: '/carte',                      en: '/map' },
    carteVille:        { fr: '/carte/:citySlug',            en: '/map/:citySlug' },
    carteTheme:        { fr: '/carte/:citySlug/:themeSlug', en: '/map/:citySlug/:themeSlug' },
};

export const PRIVATE_KEYS = new Set(['profil', 'profilEmail', 'admin', 'forgotPassword']);

export const routeKeys = () => Object.keys(ROUTE_PATHS);

export function patternFor(routeKey, lang) {
    const path = ROUTE_PATHS[routeKey]?.[lang];
    if (!path) return null;
    return path === '/' ? (PREFIX[lang] || '/') : `${PREFIX[lang]}${path}`;
}

export function pathFor(routeKey, lang, params = {}) {
    const pattern = patternFor(routeKey, lang);
    if (!pattern) return null;

    return pattern.replace(/:(\w+)/g, (motif, nom) => {
        const valeur = params[nom];
        if (valeur == null) return motif;
        return PARAM_SLUGS[nom]?.[valeur]?.[lang] ?? valeur;
    });
}

export function langFromPathname(pathname) {
    return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : DEFAULT_LANG;
}

const segments = (chemin) => chemin.split('/').filter(Boolean);

const parSpecificite = (a, b) => {
    const statiques = (k) => segments(ROUTE_PATHS[k][DEFAULT_LANG]).filter(s => !s.startsWith(':')).length;
    return statiques(b) - statiques(a);
};

export function matchPath(pathname) {
    const lang = langFromPathname(pathname);
    const cibles = lang === 'en' ? segments(pathname).slice(1) : segments(pathname);

    for (const routeKey of routeKeys().sort(parSpecificite)) {
        const modele = ROUTE_PATHS[routeKey][lang];
        if (!modele) continue;

        const attendus = segments(modele);
        if (attendus.length !== cibles.length) continue;

        const params = {};
        const correspond = attendus.every((attendu, i) => {
            if (!attendu.startsWith(':')) return attendu === cibles[i];

            const nom = attendu.slice(1);
            const table = PARAM_SLUGS[nom];
            if (!table) {
                params[nom] = cibles[i];
                return true;
            }
            const canonique = Object.keys(table).find(cle => table[cle][lang] === cibles[i]);
            if (!canonique) return false;
            params[nom] = canonique;
            return true;
        });

        if (correspond) return { lang, routeKey, params };
    }

    return null;
}

export function alternatesFor(pathname) {
    const trouve = matchPath(pathname);
    if (!trouve) return Object.fromEntries(LANGS.map(l => [l, null]));

    return Object.fromEntries(LANGS.map(lang => {
        if (!ENABLED_LANGS.includes(lang)) return [lang, null];
        return [lang, pathFor(trouve.routeKey, lang, trouve.params)];
    }));
}
