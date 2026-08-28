// Formatage des dates, heures et nombres selon la langue courante.
//
// Deux couches, parce que les besoins diffèrent :
//
//   - ici, des formateurs NON réactifs, construits à la demande à partir de la
//     langue effective. C'est ce dont les services ont besoin, eux qui tournent
//     hors de React ;
//   - dans hooks/useFormat.js, la version réactive pour les composants.
//
// Un composant qui appellerait directement ces fonctions lirait la langue hors
// du flux React : avec le React Compiler, le rendu mémoïsé peut ne pas être
// rejoué au changement de langue, et les dates resteraient en français au milieu
// d'un écran anglais. Dans un composant, useFormat() — toujours.

import { currentLanguage } from '../services/languagePreference';

// en-GB plutôt que en-US : horloge sur 24 heures et date jour-en-premier, ce qui
// correspond aux villes couvertes. C'est la seule ligne à changer pour passer
// aux conventions américaines.
const BCP47 = { fr: 'fr-FR', en: 'en-GB' };

/** Étiquette BCP 47 complète, pour Intl comme pour expo-speech. */
export function bcp47(lang = currentLanguage()) {
    return BCP47[lang] ?? BCP47.fr;
}

export function makeFormatters(lang = currentLanguage()) {
    const l = bcp47(lang);

    return {
        /** « 5 juin 2026 » / « 5 June 2026 » */
        date: (valeur, options = { day: 'numeric', month: 'long', year: 'numeric' }) =>
            new Date(valeur).toLocaleDateString(l, options),

        /** « 5 juin » / « 5 Jun » */
        dateCourte: (valeur) =>
            new Date(valeur).toLocaleDateString(l, { day: 'numeric', month: 'short' }),

        /** Format court propre à la locale : « 05/06/2026 » / « 05/06/2026 » */
        dateSeule: (valeur) => new Date(valeur).toLocaleDateString(l),

        /** « 14:05 » */
        heure: (valeur) =>
            new Date(valeur).toLocaleTimeString(l, { hour: '2-digit', minute: '2-digit' }),

        /** Sépare les milliers et choisit le séparateur décimal de la langue. */
        nombre: (valeur, options) => new Intl.NumberFormat(l, options).format(valeur),
    };
}
