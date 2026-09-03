import { Link, useLocation } from 'react-router';
import { Trans, useTranslation } from 'react-i18next';
import { langFromPathname, pathFor } from '../i18n/routes';
import { themeLabel } from '../i18n/carteLabels';
import { Helmet } from 'react-helmet-async';
import Meta from '../components/Meta';
import ThemeIcon from '../components/carte/ThemeIcon';
import { SITE_URL } from '../data/thematicMapsCore';
import './CartePages.css';

export default function CarteHubPage({ registre }) {
    // Le registre vient en prop : il porte l'éditorial de la langue de la page.
    const { CITIES, PAGES, pagesForCity, routableCitiesLabel } = registre;
    const VILLES = registre.listFormat(CITIES.map(city => city.name));

    const { t } = useTranslation('carte');
    const lang = langFromPathname(useLocation().pathname);

    const composants = {
        contact: <Link to={pathFor("contact", lang)} />,
        donnees: <Link to={pathFor("donnees", lang)} />,
    };
    const T = ({ k, ...params }) => <Trans t={t} i18nKey={k} components={composants} values={params} />;

    const abs = (chemin) => `${SITE_URL}${chemin.endsWith('/') ? chemin : `${chemin}/`}`;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: t('ui.accueil'), item: abs(pathFor('home', lang)) },
                    { '@type': 'ListItem', position: 2, name: t('ui.cartes'), item: abs(pathFor('carteHub', lang)) },
                ],
            },
            {
                '@type': 'CollectionPage',
                '@id': abs(pathFor('carteHub', lang)),
                name: t('ui.hub.h1'),
                inLanguage: lang,
                isPartOf: { '@type': 'WebSite', url: abs(pathFor('home', lang)), name: 'Sécu’Cycle' },
                hasPart: PAGES.map(page => ({
                    '@type': 'WebPage',
                    name: page.content.h1,
                    url: abs(page.path),
                })),
            },
        ],
    };

    return (
        <>
            <Meta
                title={t('ui.hub.titrePage')}
                description={t('ui.hub.metaDescription', { villes: VILLES })}
            />
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd).replace(/</g, '\\u003c')}
                </script>
            </Helmet>

            <article className="carte-page">
                <nav className="carte-fil" aria-label={t('ui.filAriane')}>
                    <Link to={pathFor("home", lang)}>{t('ui.accueil')}</Link>
                    <span aria-hidden="true">›</span>
                    <span aria-current="page">{t('ui.cartes')}</span>
                </nav>

                <div className="carte-entete">
                    <h1>{t('ui.hub.h1')}</h1>
                    <p className="carte-intro">{t('ui.hub.intro')}</p>
                    <p className="carte-note"><T k="ui.hub.villeManquanteTexte" /></p>
                </div>

                {CITIES.map(city => {
                    const pages = pagesForCity(city.slug);
                    if (pages.length === 0) return null;
                    return (
                        <section key={city.slug} className="carte-maillage">
                            <h2>
                                <Link to={pathFor("carteVille", lang, { citySlug: city.slug })}>{city.label}</Link>
                            </h2>
                            <p className="carte-note">
                                {city.intro}
                                {city.routing === false && t('ui.hub.sansItineraire')}
                            </p>
                            <ul className="carte-cartes">
                                {pages.map(page => (
                                    <li key={page.key}>
                                        <Link to={page.path}>
                                            <ThemeIcon slug={page.themeSlug} className="carte-carte-icone" />
                                            <span className="carte-carte-titre">{themeLabel(page.theme)}</span>
                                            <span className="carte-carte-ville">{city.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    );
                })}

                <section className="carte-maillage">
                    <h2>{t('ui.hub.villeManquante')}</h2>
                    <p className="carte-note"><T k="ui.hub.couvertureTexte" /></p>
                </section>
            </article>
        </>
    );
}
