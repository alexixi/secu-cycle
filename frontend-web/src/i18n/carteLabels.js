// Résolution des libellés d'interface des cartes thématiques.
//
// Le registre langue-neutre (data/thematicMapsCore.js) n'émet que des clés :
// `labelKey` pour le thème, `key` pour chaque entrée de légende et chaque
// statistique. C'est ce qui permet d'écrire `stats()` une seule fois pour toutes
// les langues. Les mots correspondants vivent dans locales/<langue>/carte.json.
//
// Module de transition : à l'introduction d'i18next, ces trois fonctions seront
// remplacées par des appels à t('carte:…'). Le catalogue JSON, lui, ne bougera
// pas — c'est lui l'artefact durable, pas ce mode d'accès.
//
// Ne pas importer depuis un script Node : il charge un JSON par la résolution de
// Vite. Les scripts de build n'ont besoin que de l'éditorial, jamais d'ici.

import carte from './locales/fr/carte.json';

const chemin = (objet, cle) => cle.split('.').reduce((n, p) => n?.[p], objet);

/** Libellé d'un thème, depuis son `labelKey`. */
export const themeLabel = (theme) => chemin(carte, theme.labelKey) ?? theme.labelKey;

/** Libellé d'une entrée de légende. */
export const legendLabel = (themeSlug, key) =>
    carte.theme?.[themeSlug]?.legend?.[key] ?? key;

/** Libellé d'une statistique. */
export const statLabel = (themeSlug, key) =>
    carte.theme?.[themeSlug]?.stats?.[key] ?? key;

/** Détail d'une source, quand il est traduisible ; sinon le nom propre tel quel. */
export const sourceDetail = (source) =>
    (source.detailKey ? chemin(carte, source.detailKey) : source.detail) ?? '';
