import { useCallback, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Trans, useTranslation } from 'react-i18next';
import { langFromPathname, matchPath, pathFor } from '../i18n/routes';
import { sourceDetail, statLabel, themeLabel } from '../i18n/carteLabels';
import { Helmet } from 'react-helmet-async';
import { MdOutlineOpenInFull, MdOutlineCloseFullscreen } from 'react-icons/md';
import Meta from '../components/Meta';
import ThematicMap from '../modules/map/ThematicMap';
import ErrorPage from './ErrorPage';
import ThemeIcon from '../components/carte/ThemeIcon';
import { trackEvent } from '../services/analytics';
import {
    SITE_URL, findPage, pagesForCity, pagesForTheme, routableCitiesLabel,
} from '../data/thematicMaps';
import './CartePages.css';

function CtaItineraire({ page, position, lang, t }) {
    const { city } = page;

    if (city.routing === false) {
        return (
            <aside className="carte-cta">
                <div>
                    <p className="carte-cta-titre">{t('ui.cta.pasEncore', { prep: city.prep })}</p>
                    <p className="carte-cta-texte">{t('ui.cta.trajetTexte')}</p>
                </div>
                <Link
                    className="button carte-cta-bouton"
                    to={pathFor("carteHub", lang)}
                    onClick={() => trackEvent('carte_cta_villes_couvertes', {
                        ville: city.slug,
                        theme: page.themeSlug,
                        position,
                    })}
                >
                    {t('ui.cta.villesCouvertes')}
                </Link>
            </aside>
        );
    }

    const cible = `${pathFor('itineraire', lang)}?couche=${page.theme.itineraireLayer}`;
    return (
        <aside className="carte-cta">
            <div>
                <p className="carte-cta-titre">{t('ui.cta.trajet', { prep: city.prep })}</p>
                <p className="carte-cta-texte">
                    Sécu’Cycle calcule un itinéraire cyclable sécurisé qui tient compte des
                    aménagements, de l’éclairage, du trafic et des accidents recensés — avec cette
                    couche affichée sur la carte.
                </p>
            </div>
            <Link
                className="button carte-cta-bouton"
                to={cible}
                onClick={() => trackEvent('carte_cta_itineraire', {
                    ville: city.slug,
                    theme: page.themeSlug,
                    position,
                })}
            >
                {t('ui.cta.calculer')}
            </Link>
        </aside>
    );
}

export default function CarteThematiquePage() {
    const { pathname } = useLocation();
    const { t } = useTranslation('carte');
    const lang = langFromPathname(pathname);

    const { citySlug, themeSlug } = matchPath(pathname)?.params ?? {};
    const page = findPage(citySlug, themeSlug);

    const [features, setFeatures] = useState(null);
    const [carteAgrandie, setCarteAgrandie] = useState(false);
    const handleData = useCallback((loaded) => setFeatures(loaded), []);

    const stats = useMemo(() => {
        if (!page || !features?.length) return [];
        try {
            return page.theme.stats(features).filter(s => s.text || s.value > 0);
        } catch {
            return [];
        }
    }, [page, features]);

    if (!page) return <ErrorPage />;

    const { city, theme, content } = page;
    const composants = { donnees: <Link to={pathFor("donnees", lang)} /> };
    const T = ({ k, ...params }) => <Trans t={t} i18nKey={k} components={composants} values={params} />;

    const abs = (chemin) => `${SITE_URL}${chemin.endsWith('/') ? chemin : `${chemin}/`}`;
    const canonical = abs(pathFor('carteTheme', lang, { citySlug: city.slug, themeSlug: page.themeSlug }));
    const autresCartesVille = pagesForCity(city.slug).filter(p => p.themeSlug !== page.themeSlug);
    const memeThemeAilleurs = pagesForTheme(page.themeSlug).filter(p => p.city.slug !== city.slug);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: t('ui.accueil'), item: abs(pathFor('home', lang)) },
                    { '@type': 'ListItem', position: 2, name: t('ui.cartes'), item: abs(pathFor('carteHub', lang)) },
                    { '@type': 'ListItem', position: 3, name: city.name, item: abs(pathFor('carteVille', lang, { citySlug: city.slug })) },
                    { '@type': 'ListItem', position: 4, name: themeLabel(theme), item: canonical },
                ],
            },
            {
                '@type': 'FAQPage',
                mainEntity: content.faq.map(item => ({
                    '@type': 'Question',
                    name: item.q,
                    acceptedAnswer: { '@type': 'Answer', text: item.a },
                })),
            },
            {
                '@type': 'WebPage',
                '@id': canonical,
                name: content.h1,
                description: content.description,
                inLanguage: 'fr',
                isPartOf: { '@type': 'WebSite', url: abs(pathFor('home', lang)), name: 'Sécu’Cycle' },
                about: { '@type': 'Place', name: city.name },
                mentions: page.sources.map(source => ({
                    '@type': 'Dataset',
                    name: source.name,
                    ...(source.producer?.href ? { url: source.producer.href } : {}),
                    ...(source.licence?.href ? { license: source.licence.href } : {}),
                })),
            },
        ],
    };

    return (
        <>
            <Meta
                title={content.title}
                description={content.description}
                preconnect={[
                    'https://api.secu-cycle.fr',
                    { href: 'https://api.maptiler.com', crossOrigin: true },
                ]}
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
                    <Link to={pathFor("carteVille", lang, { citySlug: city.slug })}>{city.name}</Link>
                    <span aria-hidden="true">›</span>
                    <span aria-current="page">{themeLabel(theme)}</span>
                </nav>

                <div className="carte-entete">
                    <h1>{content.h1}</h1>
                    <p className="carte-intro">{content.intro}</p>
                </div>

                {stats.length > 0 && (
                    <ul className="carte-stats" aria-label={t('ui.chiffresCles')}>
                        {stats.map(stat => (
                            <li key={stat.key}>
                                <strong>{stat.text ?? stat.value.toLocaleString(lang)}</strong>
                                <span>{statLabel(page.themeSlug, stat.key)}</span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className={`carte-map-zone${carteAgrandie ? ' carte-map-zone--large' : ''}`}>
                    <ThematicMap city={city} theme={theme} onData={handleData} />
                    <button
                        type="button"
                        className="carte-map-taille"
                        aria-pressed={carteAgrandie}
                        onClick={() => {
                            setCarteAgrandie(v => !v);
                            trackEvent('carte_taille', {
                                ville: city.slug,
                                theme: page.themeSlug,
                                etat: carteAgrandie ? 'reduite' : 'agrandie',
                            });
                        }}
                    >
                        {carteAgrandie
                            ? <><MdOutlineCloseFullscreen aria-hidden="true" /> {t('ui.theme.reduireCarte')}</>
                            : <><MdOutlineOpenInFull aria-hidden="true" /> {t('ui.theme.agrandirCarte')}</>}
                    </button>
                </div>

                {theme.realtime && (
                    <p className="carte-note">
                        Données rafraîchies en continu à partir du flux officiel.
                    </p>
                )}

                <CtaItineraire page={page} lang={lang} t={t} position="sous-carte" />

                <div className="carte-corps">
                    {content.sections.map(section => (
                        <section key={section.h2}>
                            <h2>{section.h2}</h2>
                            {section.p.map((paragraphe, index) => (
                                // eslint-disable-next-line react/no-array-index-key
                                <p key={index}>{paragraphe}</p>
                            ))}
                        </section>
                    ))}

                    <section>
                        <h2>{t('ui.theme.questionsFrequentes')}</h2>
                        <dl className="carte-faq">
                            {content.faq.map(item => (
                                <div key={item.q}>
                                    <dt>{item.q}</dt>
                                    <dd>{item.a}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <section>
                        <h2>{t('ui.theme.sourcesLicences')}</h2>
                        <ul className="carte-sources">
                            {page.sources.map(source => (
                                <li key={source.name}>
                                    <strong>{source.name}</strong>
                                    {sourceDetail(source) && <> — {sourceDetail(source)}</>}
                                    {source.producer && (
                                        <>
                                            {' · '}
                                            {source.producer.href
                                                ? <a href={source.producer.href} target="_blank" rel="noreferrer noopener">{source.producer.label}</a>
                                                : source.producer.label}
                                        </>
                                    )}
                                    {source.licence && (
                                        <>
                                            {' · '}
                                            {source.licence.href
                                                ? <a href={source.licence.href} target="_blank" rel="noreferrer noopener">{source.licence.label}</a>
                                                : source.licence.label}
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                        <p className="carte-note"><T k="ui.theme.detailDonnees" /></p>
                    </section>
                </div>

                <CtaItineraire page={page} lang={lang} t={t} position="fin-article" />

                {autresCartesVille.length > 0 && (
                    <section className="carte-maillage">
                        <h2>{t('ui.theme.autresCartes', { prep: city.prep })}</h2>
                        <ul className="carte-liens">
                            {autresCartesVille.map(autre => (
                                <li key={autre.key}>
                                    <Link to={autre.path}>
                                        <ThemeIcon slug={autre.themeSlug} className="carte-lien-icone" />
                                        {themeLabel(autre.theme)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {memeThemeAilleurs.length > 0 && (
                    <section className="carte-maillage">
                        <h2>{t('ui.theme.memeThemeAilleurs', { theme: themeLabel(theme) })}</h2>
                        <ul className="carte-liens">
                            {memeThemeAilleurs.map(autre => (
                                <li key={autre.key}>
                                    <Link to={autre.path}>
                                        <ThemeIcon slug={autre.themeSlug} className="carte-lien-icone" />
                                        {themeLabel(autre.theme)} {autre.city.prep}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </article>
        </>
    );
}
