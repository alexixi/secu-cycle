// Initialisation d'i18next.
//
// La langue vient EXCLUSIVEMENT de l'URL (voir routes.js) : ni état, ni
// localStorage, ni navigator.language. C'est ce qui garantit qu'elle est juste
// dès le premier rendu, donc au moment où react-snap fige le HTML — une langue
// issue d'un état produirait des pages /en/ prérendues en français.
//
// Ce module touche à window : il ne doit jamais être importé par un script Node.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { ensureNamespaces } from './catalogues';
import { DEFAULT_LANG, LANGS } from './routes';

export async function initI18n(lang) {
    await i18n.use(initReactI18next).init({
        lng: lang,
        supportedLngs: LANGS,

        // Délibérément sans repli. Avec un repli français, une clé anglaise
        // manquante afficherait du français au milieu d'une page anglaise :
        // invisible en relecture, et lu par Google comme du contenu mixte. En
        // renvoyant la clé, le trou est visible — et check-i18n le rend bloquant.
        fallbackLng: false,

        defaultNS: 'common',
        ns: [],
        resources: {},
        interpolation: { escapeValue: false },   // React échappe déjà

        // Le chargement des catalogues est verrouillé par le lazy() des pages :
        // i18next n'a pas à suspendre quoi que ce soit.
        react: { useSuspense: false },

        parseMissingKeyHandler: (cle) => (import.meta.env.DEV ? `⟦${cle}⟧` : cle),
    });

    // common porte l'en-tête et le pied de page, rendus hors du <Suspense> : il
    // doit être présent avant le tout premier rendu, pas au montage d'une page.
    await ensureNamespaces(lang, ['common']);

    return i18n;
}

export { DEFAULT_LANG, LANGS };
export default i18n;
