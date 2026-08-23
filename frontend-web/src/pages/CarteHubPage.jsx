import { Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import Meta from '../components/Meta';
import ThemeIcon from '../components/carte/ThemeIcon';
import {
    SITE_URL, CITIES, PAGES, pagesForCity, routableCitiesLabel,
} from '../data/thematicMaps';
import './CartePages.css';

const VILLES = CITIES.map(city => city.name)
    .reduce((texte, nom, index, tous) => (
        index === 0 ? nom : `${texte}${index === tous.length - 1 ? ' et ' : ', '}${nom}`
    ), '');

export default function CarteHubPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE_URL}/` },
                    { '@type': 'ListItem', position: 2, name: 'Cartes', item: `${SITE_URL}/carte/` },
                ],
            },
            {
                '@type': 'CollectionPage',
                '@id': `${SITE_URL}/carte/`,
                name: 'Cartes cyclables par ville',
                inLanguage: 'fr',
                isPartOf: { '@type': 'WebSite', url: `${SITE_URL}/`, name: 'Sécu’Cycle' },
                hasPart: PAGES.map(page => ({
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
                title="Cartes cyclables par ville | Sécu’Cycle"
                description={`Toutes les cartes Sécu’Cycle : stationnements vélo, toilettes, points d’eau, éclairage, trafic et accidents à ${VILLES}.`}
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
                    <span aria-current="page">Cartes</span>
                </nav>

                <div className="carte-entete">
                    <h1>Cartes cyclables par ville</h1>
                    <p className="carte-intro">
                        Sécu’Cycle calcule des itinéraires à vélo sécurisés à partir d’une douzaine de
                        jeux de données ouvertes. Ces cartes thématiques donnent accès à chacune de ces
                        couches séparément, ville par ville : où garer son vélo, où trouver de l’eau,
                        quelles rues sont éclairées, où les cyclistes sont accidentés.
                    </p>
                    <p className="carte-note">
                        Les cartes couvrent plus de villes que le calcul d’itinéraire, qui s’appuie
                        sur un réseau routier chargé en mémoire par notre serveur : il est
                        aujourd’hui disponible à {routableCitiesLabel()}. Les autres villes sont
                        cartographiées, mais pas encore navigables — chaque page le précise.
                    </p>
                </div>

                {CITIES.map(city => {
                    const pages = pagesForCity(city.slug);
                    if (pages.length === 0) return null;
                    return (
                        <section key={city.slug} className="carte-maillage">
                            <h2>
                                <Link to={`/carte/${city.slug}`}>{city.label}</Link>
                            </h2>
                            <p className="carte-note">
                                {city.intro}
                                {city.routing === false
                                    && ' Le calcul d’itinéraire n’y est pas encore disponible.'}
                            </p>
                            <ul className="carte-cartes">
                                {pages.map(page => (
                                    <li key={page.key}>
                                        <Link to={page.path}>
                                            <ThemeIcon slug={page.themeSlug} className="carte-carte-icone" />
                                            <span className="carte-carte-titre">{page.theme.label}</span>
                                            <span className="carte-carte-ville">{city.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    );
                })}

                <section className="carte-maillage">
                    <h2>Une ville manquante ?</h2>
                    <p className="carte-note">
                        Nous ne publions une carte que lorsque les données ouvertes du territoire sont
                        assez complètes pour être utiles — un recensement trop clairsemé donnerait une
                        image fausse. La couverture s’étend au fil des territoires intégrés au
                        calculateur : vous pouvez nous suggérer une ville via la{' '}
                        <Link to="/contact">page de contact</Link>.
                    </p>
                </section>
            </article>
        </>
    );
}
