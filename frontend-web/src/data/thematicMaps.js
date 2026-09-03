// Registre des cartes thématiques (/carte/<ville>/<thème>), en français.
//
// Façade : le contenu vit désormais dans trois fichiers, séparés selon ce qui dépend
// de la langue et ce qui n'en dépend pas.
//
//   thematicMapsCore.js     géographie, couches, couleurs, sources, clés de libellé
//   thematicMaps.fr.js      éditorial français (PAGE_CONTENT, textes de ville)
//   buildRegistry.js        assemblage des deux
//
// Ce module reste le point d'entrée du français et conserve la surface publique
// d'origine, pour que les pages et les scripts de build n'aient rien à changer.
// Les autres langues sont chargées par un import() distinct, ce qui leur donne leur
// propre chunk : un visiteur ne télécharge jamais l'éditorial d'une langue qu'il ne
// lit pas.
//
// Ajouter une ville : une entrée dans CITIES (core), `node scripts/check-coverage.mjs`,
// retenir les thèmes qui passent les seuils, puis rédiger PAGE_CONTENT dans chaque
// registre de langue.

import { buildRegistry } from './buildRegistry.js';
import * as core from './thematicMapsCore.js';
import * as fr from './thematicMaps.fr.js';

const registre = buildRegistry(core, fr);

export default registre;

export const {
    SITE_URL,
    THEMES,
    CITIES,
    CITY_BY_SLUG,
    PAGES,
    ROUTABLE_CITIES,
    PAGE_CONTENT,
    ROUTES,
    routableCitiesLabel,
    cityHubTitle,
    findPage,
    pagesForCity,
    pagesForTheme,
} = registre;
