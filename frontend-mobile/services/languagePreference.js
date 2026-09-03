// Préférence de langue de l'application.
//
// Pendant de `notificationPreference.js` : cache module, getter synchrone, setter
// optimiste. La raison d'être de ce fichier est ce cache — `apiBack.js`,
// `backgroundLocation.js` et `weatherNotification.js` ont besoin de la langue
// courante alors qu'ils tournent hors de React, sans provider monté au-dessus
// d'eux et sans pouvoir attendre une promesse.
//
// Ce module n'importe surtout PAS i18next : `apiBack.mock.js` doit rester
// chargeable seul, et une requête partie avant le premier rendu doit déjà porter
// la bonne langue.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

export const LANGUAGE_KEY = 'userAppLanguage';        // pendant de 'userAppThemeMode'
export const LANGUAGE_MODES = ['auto', 'fr', 'en'];
export const SUPPORTED_LANGS = ['fr', 'en'];
export const DEFAULT_LANG = 'fr';

// Mode choisi par l'utilisateur, `null` tant que le stockage n'a pas répondu.
let cachedMode = null;
// Langue EFFECTIVE : c'est elle que lit currentLanguage(), en synchrone.
let cachedLang = DEFAULT_LANG;

/** Langue du téléphone, ramenée à une langue que l'on sait servir. */
export function deviceLanguage() {
    try {
        for (const locale of getLocales()) {
            const code = String(locale?.languageCode ?? '').toLowerCase();
            if (SUPPORTED_LANGS.includes(code)) return code;
        }
    } catch {
        // getLocales ne lève pas en pratique, mais la langue n'est pas un
        // service assez critique pour justifier de propager quoi que ce soit.
    }
    return DEFAULT_LANG;
}

/** Langue effective pour un mode donné. Fonction pure. */
export function resolveLanguage(mode) {
    return SUPPORTED_LANGS.includes(mode) ? mode : deviceLanguage();
}

/**
 * Langue effective, en lecture synchrone.
 *
 * Utilisable partout, y compris hors React et avant le montage du provider :
 * elle vaut la langue du téléphone dès le chargement des modules, puis la
 * préférence de l'utilisateur une fois le stockage lu.
 */
export function currentLanguage() {
    return cachedLang;
}

/** Mode courant, sans attendre le stockage. */
export function currentLanguageMode() {
    return cachedMode ?? 'auto';
}

/**
 * Amorce le cache avant toute lecture asynchrone.
 *
 * Appelé par `i18n/index.js` au chargement du module : sans cela, la toute
 * première requête HTTP partirait avec le français par défaut sur un téléphone
 * anglais.
 */
export function primeLanguage(lang) {
    if (SUPPORTED_LANGS.includes(lang)) cachedLang = lang;
    return cachedLang;
}

/** Relit le stockage. Renvoie la langue effective. */
export async function loadLanguageMode() {
    try {
        const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
        cachedMode = LANGUAGE_MODES.includes(saved) ? saved : 'auto';
    } catch {
        cachedMode = 'auto';
    }
    cachedLang = resolveLanguage(cachedMode);
    return cachedLang;
}

/** Enregistre le mode. Renvoie la langue effective correspondante. */
export async function setLanguageMode(mode) {
    if (!LANGUAGE_MODES.includes(mode)) return cachedLang;

    cachedMode = mode;
    cachedLang = resolveLanguage(mode);
    try {
        await AsyncStorage.setItem(LANGUAGE_KEY, mode);
    } catch (e) {
        console.warn('Préférence de langue non sauvegardée :', e);
    }
    return cachedLang;
}

/**
 * Réévalue « auto » contre la langue du téléphone.
 *
 * Utile au retour au premier plan : l'utilisateur a pu changer la langue du
 * système pendant que l'application dormait.
 */
export function refreshResolvedLanguage() {
    cachedLang = resolveLanguage(cachedMode ?? 'auto');
    return cachedLang;
}
