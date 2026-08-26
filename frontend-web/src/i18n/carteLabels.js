// Résolution des libellés d'interface des cartes thématiques.
//
// Le registre langue-neutre (data/thematicMapsCore.js) n'émet que des clés :
// `labelKey` pour le thème, `key` pour chaque entrée de légende et chaque
// statistique, `id` pour les tables de mapConstants. C'est ce qui permet
// d'écrire `stats()` une seule fois pour toutes les langues.
//
// Les mots sont résolus par i18next, dans le domaine « carte » et dans la langue
// active — pas depuis un JSON importé en dur. C'est ce qui distingue une page
// française d'une page anglaise : le socle est le même, seul le catalogue change.
//
// Ces fonctions sont appelées depuis des modules non-React (mapConstants) autant
// que depuis des composants, d'où l'accès à l'instance globale plutôt qu'au hook.
// Le domaine « carte » est garanti chargé avant le montage des pages qui s'en
// servent : c'est le rôle du verrou lazy() dans App.jsx.

import i18n from './index';

const lire = (cle) => {
    const valeur = i18n.t(cle, { ns: 'carte' });
    // Avec fallbackLng désactivé, une clé absente revient telle quelle.
    return valeur === cle ? null : valeur;
};

/** Libellé d'un thème, depuis son `labelKey`. */
export const themeLabel = (theme) => lire(theme.labelKey) ?? theme.labelKey;

/** Libellé d'une entrée de légende. */
export const legendLabel = (themeSlug, key) => lire(`theme.${themeSlug}.legend.${key}`) ?? key;

/** Libellé d'une statistique. */
export const statLabel = (themeSlug, key) => lire(`theme.${themeSlug}.stats.${key}`) ?? key;

/**
 * Libellé d'une entrée de mapConstants, depuis son `id`.
 *
 *     carteLabel('poi', 'water')   -> « Points d'eau » / “Drinking water”
 *     carteLabel('fond', 'topo')   -> « Relief » / “Terrain”
 *
 * Ne concerne QUE les tables du module carte. Les libellés venus de l'API
 * (météo, qualité de l'air, vigilance) sont traduits par le serveur : les
 * résoudre ici les figerait dans la langue du bundle.
 */
export const carteLabel = (prefixe, id) =>
    lire(prefixe === 'ui' ? `ui.carte.${id}` : `carte.${prefixe}.${id}`) ?? id;

/** Détail d'une source, quand il est traduisible ; sinon le nom propre tel quel. */
export const sourceDetail = (source) =>
    (source.detailKey ? lire(source.detailKey) : source.detail) ?? '';
