import { Link, useLocation } from 'react-router';
import { Trans, useTranslation } from 'react-i18next';
import { langFromPathname, matchPath, pathFor } from '../i18n/routes';
import { themeLabel } from '../i18n/carteLabels';
import { Helmet } from 'react-helmet-async';
import Meta from '../components/Meta';
import ErrorPage from './ErrorPage';
import ThemeIcon from '../components/carte/ThemeIcon';
import { trackEvent } from '../services/analytics';
import { SITE_URL } from '../data/thematicMapsCore';
import './CartePages.css';

export default function CarteVillePage({ registre }) {
    // Le registre vient en prop : il porte l'éditorial de la langue de la page.
    const { CITY_BY_SLUG, cityHubTitle, pagesForCity, routableCitiesLabel } = registre;
    const { pathname } = useLocation();
    const { t } = useTranslation('carte');
    const lang = langFromPathname(pathname);

    const citySlug = matchPath(pathname)?.params?.citySlug;
    const city = CITY_BY_SLUG[citySlug];
    const pages = city ? pagesForCity(city.slug) : [];

    if (!city || pages.length === 0) return <ErrorPage />;

    const composants = {
        donnees: <Link to={pathFor("donnees", lang)} />,
    };
    const T = ({ k, ...params }) => <Trans t={t} i18nKey={k} components={composants} values={params} />;


    const abs = (chemin) => `${SITE_URL}${chemin.endsWith('/') ? chemin : `${chemin}/`}`;
    const canonical = abs(pathFor('carteVille', lang, { citySlug: city.slug }));

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: t('ui.accueil'), item: abs(pathFor('home', lang)) },
                    { '@type': 'ListItem', position: 2, name: t('ui.cartes'), item: abs(pathFor('carteHub', lang)) },
                    { '@type': 'ListItem', position: 3, name: city.name, item: canonical },
                ],
            },
            {
                '@type': 'CollectionPage',
                '@id': canonical,
                name: cityHubTitle(city),
                inLanguage: 'fr',
                about: { '@type': 'Place', name: city.name },
                isPartOf: { '@type': 'WebSite', url: abs(pathFor('home', lang)), name: 'Sécu’Cycle' },
                hasPart: pages.map(page => ({
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
                title={`${cityHubTitle(city)}${t('ui.ville.suffixeTitre')}`}
                description={city.metaDescription}
                preconnect={['https://api.secu-cycle.fr']}
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
                    <Link to={pathFor("carteHub", lang)}>{t('ui.cartes')}</Link>
                    <span aria-hidden="true">›</span>
                    <span aria-current="page">{city.name}</span>
                </nav>

                <div className="carte-entete">
                    <h1>{cityHubTitle(city)}</h1>
                    <p className="carte-intro">{city.intro}</p>
                </div>

                <ul className="carte-cartes">
                    {pages.map(page => (
                        <li key={page.key}>
                            <Link to={page.path}>
                                <ThemeIcon slug={page.themeSlug} className="carte-carte-icone" />
                                <span className="carte-carte-titre">{themeLabel(page.theme)}</span>
                                <span className="carte-carte-ville">{page.content.intro.split('.')[0]}.</span>
                            </Link>
                        </li>
                    ))}
                </ul>

                {city.routing === false ? (
                    <aside className="carte-cta">
                        <div>
                            <p className="carte-cta-titre">{t('ui.cta.pasEncore', { prep: city.prep })}</p>
                            <p className="carte-cta-texte">
                            {city.routingNote}{' '}
                            {t('ui.cta.itinerairesCalculesA', { villes: routableCitiesLabel() })}
                        </p>
                        </div>
                        <Link
                            className="button carte-cta-bouton"
                            to={pathFor("carteHub", lang)}
                            onClick={() => trackEvent('carte_cta_villes_couvertes', {
                                ville: city.slug,
                                theme: 'hub-ville',
                                position: 'hub',
                            })}
                        >
                            {t('ui.cta.villesCouvertes')}
                        </Link>
                    </aside>
                ) : (
                    <aside className="carte-cta">
                        <div>
                            <p className="carte-cta-titre">{t('ui.cta.trajet', { prep: city.prep })}</p>
                            <p className="carte-cta-texte">
                                Toutes ces couches alimentent le calculateur d’itinéraires : il en
                                tient compte pour proposer un trajet cyclable réellement praticable,
                                adapté à votre vélo et à votre profil.
                            </p>
                        </div>
                        <Link
                            className="button carte-cta-bouton"
                            to={pathFor("itineraire", lang)}
                            onClick={() => trackEvent('carte_cta_itineraire', {
                                ville: city.slug,
                                theme: 'hub-ville',
                                position: 'hub',
                            })}
                        >
                            {t('ui.cta.calculer')}
                        </Link>
                    </aside>
                )}

                <section className="carte-maillage">
                    <h2>{t('ui.ville.zoneCouverte')}</h2>
                    <p className="carte-note">
                        {city.routing === false
                            ? t('ui.ville.sansRoutage', { communes: city.communes })
                            : t('ui.ville.avecRoutage', { communes: city.communes })}
                        {' '}<T k="ui.ville.detailDonnees" />
                    </p>
                </section>
            </article>
        </>
    );
}
