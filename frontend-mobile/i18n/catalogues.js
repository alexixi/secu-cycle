// Catalogues de traduction, réunis en un objet par langue.
//
// Deux principes, qui tirent dans des directions opposées :
//
//   - un FICHIER par domaine, pour que les lots de traduction successifs ne se
//     disputent pas un même JSON de plusieurs centaines de clés à chaque rebase ;
//   - un NAMESPACE i18next unique, pour que la clé écrite dans le code soit
//     exactement la clé du catalogue. C'est ce qui rend `t('carte.parking.stands')`
//     résolvable statiquement, donc vérifiable par scripts/check-i18n.mjs.
//
// D'où cette fusion : chaque fichier porte un domaine, et sa racine est le nom du
// fichier. Table explicite plutôt que require.context — un domaine manquant casse
// au build, au lieu d'échouer chez l'utilisateur.
//
// Contrairement au web, rien n'est chargé paresseusement : Metro produit un
// bundle monolithique, découper le chargement n'économiserait pas un octet.

import a11yFr from './locales/fr/a11y.json';
import authFr from './locales/fr/auth.json';
import carteFr from './locales/fr/carte.json';
import communFr from './locales/fr/commun.json';
import compteFr from './locales/fr/compte.json';
import itineraireFr from './locales/fr/itineraire.json';
import legalFr from './locales/fr/legal.json';
import meteoFr from './locales/fr/meteo.json';
import navFr from './locales/fr/nav.json';
import notificationFr from './locales/fr/notification.json';
import parametresFr from './locales/fr/parametres.json';
import signalementFr from './locales/fr/signalement.json';

import a11yEn from './locales/en/a11y.json';
import authEn from './locales/en/auth.json';
import carteEn from './locales/en/carte.json';
import communEn from './locales/en/commun.json';
import compteEn from './locales/en/compte.json';
import itineraireEn from './locales/en/itineraire.json';
import legalEn from './locales/en/legal.json';
import meteoEn from './locales/en/meteo.json';
import navEn from './locales/en/nav.json';
import notificationEn from './locales/en/notification.json';
import parametresEn from './locales/en/parametres.json';
import signalementEn from './locales/en/signalement.json';

const FR = {
    a11y: a11yFr,
    auth: authFr,
    carte: carteFr,
    commun: communFr,
    compte: compteFr,
    itineraire: itineraireFr,
    legal: legalFr,
    meteo: meteoFr,
    nav: navFr,
    notification: notificationFr,
    parametres: parametresFr,
    signalement: signalementFr,
};

const EN = {
    a11y: a11yEn,
    auth: authEn,
    carte: carteEn,
    commun: communEn,
    compte: compteEn,
    itineraire: itineraireEn,
    legal: legalEn,
    meteo: meteoEn,
    nav: navEn,
    notification: notificationEn,
    parametres: parametresEn,
    signalement: signalementEn,
};

// Namespace unique. « translation » est le nom par défaut d'i18next : le garder
// évite d'avoir à préfixer quoi que ce soit dans les appels à t().
export const NAMESPACE = 'translation';

export const RESOURCES = {
    fr: { [NAMESPACE]: FR },
    en: { [NAMESPACE]: EN },
};
