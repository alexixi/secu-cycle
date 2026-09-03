// Fabrique du registre des cartes thématiques.
//
// Assemble le socle langue-neutre (thematicMapsCore.js) et un registre éditorial
// (thematicMaps.<langue>.js) en la surface publique que consomment les pages et
// les scripts de build.
//
// Le contrat entre langues porte sur les CLÉS de PAGE_CONTENT, pas sur la liste
// des champs : le français porte `prep` et `de`, qui n'ont pas d'équivalent
// ailleurs. Une entrée éditoriale absente fait simplement disparaître la page du
// registre de cette langue — c'est ce qui permet de publier les traductions par
// vagues sans page à moitié rédigée.
//
// JavaScript pur : importé par Vite comme par les scripts Node.

import { pathFor } from '../i18n/routes.js';

export function buildRegistry(core, editorial) {
    const lang = editorial.LANG;

    // Le slug d'un thème est sa clé dans THEMES. On le porte sur l'objet lui-même :
    // les composants qui reçoivent un thème peuvent alors résoudre ses libellés sans
    // qu'on ait à faire descendre la clé en prop à travers l'arbre.
    const THEMES = Object.fromEntries(
        Object.entries(core.THEMES).map(([slug, theme]) => [slug, { ...theme, slug }]),
    );

    const CITIES = core.CITIES
        .map(city => ({ ...city, ...(editorial.CITIES_CONTENT[city.slug] ?? {}) }))
        // Une ville sans éditorial dans cette langue n'a rien à afficher.
        .filter(city => editorial.CITIES_CONTENT[city.slug]);

    const CITY_BY_SLUG = Object.fromEntries(CITIES.map(c => [c.slug, c]));

    const PAGES = CITIES.flatMap(city => city.themes
        .filter(slug => THEMES[slug] && editorial.PAGE_CONTENT[`${city.slug}/${slug}`])
        .map(slug => {
            const content = editorial.PAGE_CONTENT[`${city.slug}/${slug}`];
            return {
                key: `${city.slug}/${slug}`,
                path: pathFor('carteTheme', lang, { citySlug: city.slug, themeSlug: slug }),
                city,
                themeSlug: slug,
                theme: THEMES[slug],
                content,
                // Les sources d'un thème ne sont pas les mêmes partout : le trafic vient de
                // la métropole concernée, les vélos en libre-service de l'opérateur local,
                // les accidents des BAAC en France et de Statbel en Belgique. Une page peut
                // donc les redéfinir ; à défaut, celles du thème s'appliquent.
                sources: content.sources ?? THEMES[slug].sources,
            };
        }));

    // Villes réellement navigables, dans l'ordre de CITIES. Les pages des villes non
    // couvertes pointent vers cette liste plutôt que de la répéter dans leur texte : le
    // jour où une ville bascule, il n'y a que `routing` à changer.
    const ROUTABLE_CITIES = CITIES.filter(c => c.routing !== false);

    return {
        lang,
        SITE_URL: core.SITE_URL,
        THEMES,
        CITIES,
        CITY_BY_SLUG,
        PAGES,
        ROUTABLE_CITIES,
        PAGE_CONTENT: editorial.PAGE_CONTENT,

        // Exposé tel quel : les pages en ont besoin pour énumérer autre chose que
        // les villes routables — le hub liste toutes les villes couvertes.
        listFormat: editorial.listFormat,
        routableCitiesLabel: () => editorial.listFormat(ROUTABLE_CITIES.map(c => c.name)),
        cityHubTitle: editorial.cityHubTitle,

        findPage: (citySlug, themeSlug) =>
            PAGES.find(p => p.city.slug === citySlug && p.themeSlug === themeSlug),
        pagesForCity: (citySlug) => PAGES.filter(p => p.city.slug === citySlug),
        pagesForTheme: (themeSlug) => PAGES.filter(p => p.themeSlug === themeSlug),

        // Toutes les routes publiques du registre, dans l'ordre où on veut les voir crawlées.
        ROUTES: [
            pathFor('carteHub', lang),
            ...CITIES.map(c => pathFor('carteVille', lang, { citySlug: c.slug })),
            ...PAGES.map(p => p.path),
        ],
    };
}
