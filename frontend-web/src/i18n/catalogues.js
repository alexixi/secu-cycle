// Chargement des catalogues de traduction, par langue et par domaine.
//
// Table explicite plutôt qu'un import.meta.glob : le glob fonctionnerait aussi,
// mais une référence à un domaine inexistant n'échouerait qu'à l'exécution, et
// probablement chez le visiteur. Ici elle casse le build.
//
// Chaque JSON devient un chunk Vite distinct, atteignable uniquement par son
// import(). C'est ce qui garantit qu'un visiteur français ne télécharge pas un
// octet d'anglais, et qu'il ne charge que les domaines des pages qu'il ouvre.
// Le découpage suit celui des pages, déjà en React.lazy.

import i18n from 'i18next';

const CATALOGUES = {
    fr: {
        common:     () => import('./locales/fr/common.json'),
        home:       () => import('./locales/fr/home.json'),
        itineraire: () => import('./locales/fr/itineraire.json'),
        carte:      () => import('./locales/fr/carte.json'),
        auth:       () => import('./locales/fr/auth.json'),
        legal:      () => import('./locales/fr/legal.json'),
        faq:        () => import('./locales/fr/faq.json'),
        donnees:    () => import('./locales/fr/donnees.json'),
    },
    en: {
        common:     () => import('./locales/en/common.json'),
        home:       () => import('./locales/en/home.json'),
        itineraire: () => import('./locales/en/itineraire.json'),
        carte:      () => import('./locales/en/carte.json'),
        auth:       () => import('./locales/en/auth.json'),
        legal:      () => import('./locales/en/legal.json'),
        faq:        () => import('./locales/en/faq.json'),
        donnees:    () => import('./locales/en/donnees.json'),
    },
};

export const NAMESPACES = Object.keys(CATALOGUES.fr);

/**
 * Garantit que les domaines demandés sont dans le magasin avant le premier rendu.
 *
 * C'est le point critique du prérendu : si t() renvoyait la clé au premier rendu,
 * react-snap figerait un HTML de clés et verify-prerender ferait échouer le build.
 * Les pages n'étant montées qu'une fois cette promesse résolue, la question ne se
 * pose pas.
 */
export async function ensureNamespaces(lang, namespaces) {
    await Promise.all(namespaces.map(async (ns) => {
        if (i18n.hasResourceBundle(lang, ns)) return;
        const charger = CATALOGUES[lang]?.[ns];
        if (!charger) return;
        const module = await charger();
        i18n.addResourceBundle(lang, ns, module.default, true, true);
    }));
}
