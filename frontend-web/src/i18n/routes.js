// Table des chemins par langue, et résolution d'URL.
// Le français vit à la racine, l'anglais sous /en/.

import { PARAM_SLUGS } from './slugs.js';

export const LANGS = ['fr', 'en'];
export const DEFAULT_LANG = 'fr';

// Deux notions distinctes, et c'est délibéré.
//
// ENABLED_LANGS : les langues RÉELLEMENT ROUTÉES. Une langue listée ici a ses
// <Route> déclarés, donc ses URL répondent et ses pages s'affichent.
//
// PUBLISHED_LANGS : les langues INDEXABLES. Une langue routée mais non publiée
// sort du sitemap, n'est pas prérendue, ne reçoit aucune balise alternate et
// porte un noindex. C'est ce qui permet de faire vivre l'anglais en conditions
// réelles pendant sa rédaction, sans qu'un moteur n'indexe des pages à moitié
// traduites — et de le publier ensuite, quand le contenu est relu.
export const ENABLED_LANGS = ['fr', 'en'];
export const PUBLISHED_LANGS = ['fr', 'en'];

/** Une langue routée mais pas encore publiée ne doit pas être indexée. */
export const isPublished = (lang) => PUBLISHED_LANGS.includes(lang);

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
        // Annoncer en hreflang une page non publiée reviendrait à la faire
        // indexer par la bande, ce que le noindex est censé empêcher.
        if (!isPublished(lang)) return [lang, null];
        return [lang, pathFor(trouve.routeKey, lang, trouve.params)];
    }));
}
