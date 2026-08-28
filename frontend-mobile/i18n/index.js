// Initialisation d'i18next pour l'application mobile.
//
// L'init est SYNCHRONE, au chargement du module : les catalogues sont embarqués
// dans le bundle, i18next n'a rien à charger et résout son init dans le même
// tick. On y gagne l'invariant qui compte — t() ne rend jamais une clé brute,
// même appelée depuis un service au démarrage, avant tout montage de provider.
//
// La langue de départ est celle du téléphone. Une préférence explicite est
// relue ensuite par LocaleContext, derrière le splash (voir app/_layout.jsx) :
// c'est ce qui évite le flash FR→EN au lancement.

import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-pluralrules/locale-data/fr';
import '@formatjs/intl-pluralrules/locale-data/en';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { NAMESPACE, RESOURCES } from './catalogues';
import {
    DEFAULT_LANG,
    SUPPORTED_LANGS,
    deviceLanguage,
    primeLanguage,
} from '../services/languagePreference';

// Le cache du service est amorcé AVANT i18next : une requête HTTP partie très
// tôt doit déjà porter la bonne langue dans son Accept-Language.
const langueInitiale = primeLanguage(deviceLanguage());

i18n.use(initReactI18next).init({
    lng: langueInitiale,
    supportedLngs: SUPPORTED_LANGS,

    // L'inverse du choix du front web, et délibérément. Le web pose
    // `fallbackLng: false` pour que le trou soit visible dans le HTML prérendu.
    // Ici un trou signifie une clé brute affichée sur le téléphone d'un
    // utilisateur, sans recours jusqu'au prochain update : en production on
    // dégrade donc vers le français. Le garde-fou reste scripts/check-i18n.mjs,
    // bloquant en CI, qui rend ce repli inatteignable en pratique.
    fallbackLng: __DEV__ ? false : DEFAULT_LANG,

    defaultNS: NAMESPACE,
    ns: [NAMESPACE],
    resources: RESOURCES,

    // Pas de HTML à échapper en React Native, et React n'interprète pas les
    // chaînes rendues dans un <Text>.
    interpolation: { escapeValue: false },

    returnNull: false,

    // Catalogues embarqués : il n'y a rien à suspendre. Sans ce réglage,
    // useTranslation peut lancer une promesse et, faute de <Suspense> à la
    // racine, faire planter l'application au lieu d'attendre.
    react: { useSuspense: false },

    parseMissingKeyHandler: (cle) => (__DEV__ ? `⟦${cle}⟧` : cle),
});

export default i18n;
