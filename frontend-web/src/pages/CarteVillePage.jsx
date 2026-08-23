import { Link, useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';
import Meta from '../components/Meta';
import ErrorPage from './ErrorPage';
import ThemeIcon from '../components/carte/ThemeIcon';
import { trackEvent } from '../services/analytics';
import {
    SITE_URL, CITY_BY_SLUG, pagesForCity, routableCitiesLabel,
} from '../data/thematicMaps';
import './CartePages.css';

export default function CarteVillePage() {
    const { citySlug } = useParams();
    const city = CITY_BY_SLUG[citySlug];
    const pages = city ? pagesForCity(city.slug) : [];

    if (!city || pages.length === 0) return <ErrorPage />;

    const canonical = `${SITE_URL}/carte/${city.slug}/`;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE_URL}/` },
                    { '@type': 'ListItem', position: 2, name: 'Cartes', item: `${SITE_URL}/carte/` },
                    { '@type': 'ListItem', position: 3, name: city.name, item: canonical },
                ],
            },
            {
                '@type': 'CollectionPage',
                '@id': canonical,
                name: `Cartes cyclables ${city.prep}`,
                inLanguage: 'fr',
                about: { '@type': 'Place', name: city.name },
                isPartOf: { '@type': 'WebSite', url: `${SITE_URL}/`, name: 'Sécu’Cycle' },
                hasPart: pages.map(page => ({
                    '@type': 'WebPage',
                    name: page.content.h1,
                    url: `${SITE_URL}${page.path}/`,
                })),
            },
        ],
    };

    return (
        <>
            <Meta
                title={`Cartes cyclables ${city.prep} | Sécu’Cycle`}
                description={city.metaDescription}
                preconnect={['https://api.secu-cycle.fr']}
            />
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd).replace(/</g, '\\u003c')}
                </script>
            </Helmet>

            <article className="carte-page">
                <nav className="carte-fil" aria-label="Fil d’Ariane">
                    <Link to="/">Accueil</Link>
                    <span aria-hidden="true">›</span>
                    <Link to="/carte">Cartes</Link>
                    <span aria-hidden="true">›</span>
                    <span aria-current="page">{city.name}</span>
                </nav>

                <div className="carte-entete">
                    <h1>Cartes cyclables {city.prep}</h1>
                    <p className="carte-intro">{city.intro}</p>
                </div>

                <ul className="carte-cartes">
                    {pages.map(page => (
                        <li key={page.key}>
                            <Link to={page.path}>
                                <ThemeIcon slug={page.themeSlug} className="carte-carte-icone" />
                                <span className="carte-carte-titre">{page.theme.label}</span>
                                <span className="carte-carte-ville">{page.content.intro.split('.')[0]}.</span>
                            </Link>
                        </li>
                    ))}
                </ul>

                {city.routing === false ? (
                    <aside className="carte-cta">
                        <div>
                            <p className="carte-cta-titre">Itinéraires : pas encore {city.prep}</p>
                            <p className="carte-cta-texte">
                                {city.routingNote} Les itinéraires sont pour l’instant
                                calculés à {routableCitiesLabel()}.
                            </p>
                        </div>
                        <Link
                            className="button carte-cta-bouton"
                            to="/carte"
                            onClick={() => trackEvent('carte_cta_villes_couvertes', {
                                ville: city.slug,
                                theme: 'hub-ville',
                                position: 'hub',
                            })}
                        >
                            Voir les villes couvertes
                        </Link>
                    </aside>
                ) : (
                    <aside className="carte-cta">
                        <div>
                            <p className="carte-cta-titre">Un trajet à vélo {city.prep} ?</p>
                            <p className="carte-cta-texte">
                                Toutes ces couches alimentent le calculateur d’itinéraires : il en
                                tient compte pour proposer un trajet cyclable réellement praticable,
                                adapté à votre vélo et à votre profil.
                            </p>
                        </div>
                        <Link
                            className="button carte-cta-bouton"
                            to="/itineraire"
                            onClick={() => trackEvent('carte_cta_itineraire', {
                                ville: city.slug,
                                theme: 'hub-ville',
                                position: 'hub',
                            })}
                        >
                            Calculer mon itinéraire
                        </Link>
                    </aside>
                )}

                <section className="carte-maillage">
                    <h2>Zone couverte</h2>
                    <p className="carte-note">
                        {city.routing === false
                            ? <>Les cartes ci-dessus couvrent {city.communes}. Le calcul
                                d’itinéraire, lui, n’y est pas encore proposé : il s’appuie sur un
                                réseau routier chargé en mémoire par notre serveur, dont l’emprise
                                est plus étroite que celle des données.</>
                            : <>Le calculateur d’itinéraires couvre {city.communes}. Les cartes
                                ci-dessus portent sur cette même emprise.</>}
                        {' '}Le détail des jeux de données et de leurs licences figure sur la
                        page <Link to="/donnees">Données et sources</Link>.
                    </p>
                </section>
            </article>
        </>
    );
}
