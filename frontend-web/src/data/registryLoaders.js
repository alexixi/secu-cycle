// Chargement du registre éditorial, par langue.
//
// Chaque langue est atteinte par un import() distinct, ce qui lui donne son
// propre chunk : un visiteur français ne télécharge jamais l'éditorial anglais,
// et réciproquement. C'est le point qui justifiait de séparer le socle
// langue-neutre de l'éditorial — mêler les deux dans un objet aurait doublé le
// poids du chunk des pages carte pour tout le monde, sans tree-shaking possible
// puisque PAGE_CONTENT est indexé dynamiquement.
//
// Module du bundle uniquement : les scripts Node importent les registres
// directement.
export const REGISTRY_LOADERS = {
    fr: () => import('./thematicMaps.fr.js'),
    en: () => import('./thematicMaps.en.js'),
};
