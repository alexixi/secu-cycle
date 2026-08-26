import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";
import ExternalLink from "../components/ui/ExternalLink";
import { Helmet } from "react-helmet-async";
import Meta from "../components/Meta";
import "./legal.css";
import { useLocalizedPath } from '../i18n/useLang';

const ODBL = { label: "ODbL", href: "https://opendatacommons.org/licenses/odbl/" };
const LO = { label: "Licence Ouverte", href: "https://www.etalab.gouv.fr/licence-ouverte-open-licence/" };
const LO2 = { label: "Licence Ouverte 2.0", href: "https://www.etalab.gouv.fr/licence-ouverte-open-licence/" };
const CCBY = { label: "CC BY 4.0", href: "https://creativecommons.org/licenses/by/4.0/deed.fr" };

const SOURCES = [
    {
        name: "OpenStreetMap",
        cle: "openstreetmap",
        licence: ODBL,
        producer: { label: "openstreetmap.org", href: "https://www.openstreetmap.org/copyright" },
    },
    {
        name: "IGN — RGE ALTI",
        cle: "ign_rge_alti",
        licence: LO,
        producer: { label: "geoservices.ign.fr", href: "https://geoservices.ign.fr/rgealti" },
    },
    {
        name: "Points lumineux",
        cle: "points_lumineux",
        licence: LO,
        producer: {
            label: "opendata.bordeaux-metropole.fr",
            href: "https://opendata.bordeaux-metropole.fr/explore/dataset/bor_ptlum/",
        },
    },
    {
        name: "Luminaires d'éclairage public",
        cle: "luminaires_declairage_public",
        licence: LO,
        producer: {
            label: "data.nantesmetropole.fr",
            href: "https://data.nantesmetropole.fr/explore/dataset/244400404_luminaires-eclairage-public-nantes-metropole/",
        },
    },
    {
        name: "« Accidents de vélo »",
        cle: "accidents_de_velo",
        licence: LO2,
        producer: {
            label: "data.gouv.fr",
            href: "https://www.data.gouv.fr/datasets/accidents-de-velo",
        },
    },
    {
        name: "Géolocalisation des accidents de la circulation 2017-2024",
        cle: "geolocalisation_des_accidents_de",
        licence: CCBY,
        producer: {
            label: "statbel.fgov.be",
            href: "https://statbel.fgov.be/fr/open-data/geolocalisation-des-accidents-de-la-circulation-2017-2024",
        },
    },
    {
        name: "Base Adresse Nationale",
        cle: "base_adresse_nationale",
        licence: LO,
        producer: { label: "adresse.data.gouv.fr", href: "https://adresse.data.gouv.fr/" },
    },
    {
        name: "Trafic temps réel",
        cle: "trafic_temps_reel",
        licence: LO,
        producer: {
            label: "opendata.bordeaux-metropole.fr",
            href: "https://opendata.bordeaux-metropole.fr/explore/dataset/ci_trafi_l/",
        },
    },
    {
        name: "Trafic temps réel (SIRAC)",
        cle: "trafic_temps_reel_sirac",
        licence: LO,
        producer: {
            label: "eurometrostrasbourg.opendatasoft.com",
            href: "https://eurometrostrasbourg.opendatasoft.com/explore/dataset/sirac_flux_trafic/",
        },
    },
    {
        name: "État du trafic en temps réel",
        cle: "etat_du_trafic_en_temps_reel",
        licence: ODBL,
        producer: {
            label: "data.rennesmetropole.fr",
            href: "https://data.rennesmetropole.fr/explore/dataset/etat-du-trafic-en-temps-reel/",
        },
    },
    {
        name: "Fluidité des axes routiers",
        cle: "fluidite_des_axes_routiers",
        licence: ODBL,
        producer: {
            label: "data.nantesmetropole.fr",
            href: "https://data.nantesmetropole.fr/explore/dataset/244400404_fluidite-axes-routiers-nantes-metropole/",
        },
    },
    {
        name: "GBFS",
        cle: "gbfs",
        licence: { label: "Flux ouverts, attribution par système" },
        producer: { label: "gbfs.org", href: "https://gbfs.org/" },
    },
    {
        name: "CAMS",
        cle: "cams",
        licence: { label: "Copernicus — attribution requise", href: "https://atmosphere.copernicus.eu/data-access" },
        producer: { label: "atmosphere.copernicus.eu", href: "https://atmosphere.copernicus.eu/" },
    },
    {
        name: "World Air Quality Index",
        cle: "world_air_quality_index",
        licence: { label: "Attribution requise" },
        producer: { label: "waqi.info", href: "https://waqi.info/" },
    },
    {
        name: "Open-Meteo",
        cle: "open_meteo",
        licence: { label: "CC BY 4.0", href: "https://creativecommons.org/licenses/by/4.0/deed.fr" },
        producer: { label: "open-meteo.com", href: "https://open-meteo.com/" },
    },
    {
        name: "Vigilance Météo-France",
        cle: "vigilance_meteo_france",
        licence: LO2,
        producer: { label: "meteofrance.com", href: "https://vigilance.meteofrance.fr/" },
    },
    {
        name: "MeteoAlarm",
        cle: "meteoalarm",
        licence: { label: "Attribution EUMETNET et IRM requise", href: "https://meteoalarm.org/en/live/page/disclaimer" },
        producer: { label: "meteoalarm.org", href: "https://meteoalarm.org/" },
    },
    {
        name: "MapTiler",
        cle: "maptiler",
        licence: { label: "Service commercial — hors open data" },
        producer: { label: "maptiler.com", href: "https://www.maptiler.com/" },
    },
];

const BIKESHARE_SYSTEMS = [
    ["Le Vélo", "Bordeaux Métropole / Keolis"],
    ["Vélib' Métropole", "Smovengo"],
    ["V'Lille", "Métropole Européenne de Lille / Ilévia"],
    ["LE vélo STAR", "Rennes Métropole / STAR"],
    ["Naolib", "Nantes Métropole / JCDecaux"],
    ["Vélo'v", "Métropole de Lyon / JCDecaux"],
    ["Vélhop", "Strasbourg Mobilités Vélo"],
    ["Villo!", "Bruxelles-Capitale / JCDecaux"],
    ["Blue-bike", "Blue-mobility"],
];

const construireJsonLd = (t, detail) => ({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("jsonLd.nom"),
    url: "https://secu-cycle.fr/donnees/",
    description: t("jsonLd.description"),
    isPartOf: { "@type": "WebSite", name: "Sécu'Cycle", url: "https://secu-cycle.fr/" },
    mentions: SOURCES.map((s) => ({
        "@type": "Dataset",
        name: detail(s) ? `${s.name} (${detail(s)})` : s.name,
        description: t(`sources.${s.cle}.usage`),
        ...(s.licence.href ? { license: s.licence.href } : {}),
        ...(s.producer.href ? { url: s.producer.href } : {}),
    })),
});

export default function DonneesPage() {
    const { t, i18n } = useTranslation('donnees');
    const path = useLocalizedPath();

    // Toutes les sources n'ont pas de complément de nom. On teste l'existence de la
    // clé plutôt que de compter sur `defaultValue` : avec fallbackLng désactivé,
    // parseMissingKeyHandler l'emporte et renverrait la clé, qui s'afficherait telle
    // quelle dans le tableau et dans le JSON-LD.
    const detail = (s) => (i18n.exists(`donnees:sources.${s.cle}.detail`) ? t(`sources.${s.cle}.detail`) : "");
    const jsonLd = construireJsonLd(t, detail);

    const composants = {
        b: <strong />,
        mail: <a href="mailto:contact@secu-cycle.fr" />,
        osm: <ExternalLink href="https://www.openstreetmap.org/" />,
        odbl: <ExternalLink href="https://opendatacommons.org/licenses/odbl/" />,
        bordeaux: <ExternalLink href="https://opendata.bordeaux-metropole.fr/explore/dataset/bor_ptlum/" />,
        nantes: <ExternalLink href="https://data.nantesmetropole.fr/explore/dataset/244400404_luminaires-eclairage-public-nantes-metropole/" />,
        ign: <ExternalLink href="https://geoservices.ign.fr/rgealti" />,
        baac: <ExternalLink href="https://www.data.gouv.fr/datasets/accidents-de-velo" />,
        statbel: <ExternalLink href="https://statbel.fgov.be/fr/open-data/geolocalisation-des-accidents-de-la-circulation-2017-2024" />,
        gbfs: <ExternalLink href="https://gbfs.org/" />,
        cams: <ExternalLink href="https://atmosphere.copernicus.eu/" />,
        waqi: <ExternalLink href="https://waqi.info/" />,
        ban: <ExternalLink href="https://adresse.data.gouv.fr/" />,
        maptiler: <ExternalLink href="https://www.maptiler.com/" />,
        lo: <ExternalLink href="https://www.etalab.gouv.fr/licence-ouverte-open-licence/" />,
        ccby: <ExternalLink href="https://creativecommons.org/licenses/by/4.0/deed.fr" />,
        mentions: <Link to={path("mentionsLegales")} />,
        faq: <Link to={path("faq")} />,
    };
    const T = ({ k }) => <Trans t={t} i18nKey={k} components={composants} />;


    return (
        <>
            <Meta
                title={t('titrePage')}
                description={t('metaDescription')}
            />
            <Helmet>
                <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
            </Helmet>
            <div className="legal-page">
                <article className="legal-content">
                    <h1>{t('h1')}</h1>
                    <p className="legal-updated">{t('maj')}</p>

                    <p><T k="chapo" /></p>

                    <h2>{t('tableau.h2')}</h2>
                    <div className="legal-table-wrapper">
                        <table className="legal-table">
                            <thead>
                                <tr>
                                    <th>{t('tableau.colSource')}</th>
                                    <th>{t('tableau.colUsage')}</th>
                                    <th>{t('tableau.colLicence')}</th>
                                    <th>{t('tableau.colProducteur')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SOURCES.map((s) => (
                                    <tr key={s.cle}>
                                        <td>
                                            <strong>{s.name}</strong>
                                            {detail(s) && <><br />{detail(s)}</>}
                                        </td>
                                        <td>{t(`sources.${s.cle}.usage`)}</td>
                                        <td>
                                            {s.licence.href
                                                ? <a href={s.licence.href} target="_blank" rel="noopener noreferrer">{s.licence.label}</a>
                                                : s.licence.label}
                                        </td>
                                        <td>
                                            {s.producer.href
                                                ? <a href={s.producer.href} target="_blank" rel="noopener noreferrer">{s.producer.label}</a>
                                                : s.producer.label}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <h2>{t('reseau.h2')}</h2>
                    <p><T k="reseau.texte" /></p>
                    <p><T k="reseau.poi" /></p>

                    <h2>{t('eclairage.h2')}</h2>
                    <p><T k="eclairage.texte" /></p>

                    <h2>{t('denivele.h2')}</h2>
                    <p><T k="denivele.texte" /></p>

                    <h2>{t('accidents.h2')}</h2>
                    <p><T k="accidents.registres" /></p>
                    <p><T k="accidents.calcul" /></p>
                    <p><T k="accidents.plafond" /></p>
                    <div className="legal-callout">
                        <p><T k="accidents.limite" /></p>
                    </div>

                    <h2>{t('trafic.h2')}</h2>
                    <p><T k="trafic.texte" /></p>

                    <h2>{t('bikeshare.h2')}</h2>
                    <p><T k="bikeshare.texte" /></p>
                    <ul>
                        {BIKESHARE_SYSTEMS.map(([name, operator]) => (
                            <li key={name}><strong>{name}</strong> — {operator}</li>
                        ))}
                    </ul>

                    <h2>{t('air.h2')}</h2>
                    <p><T k="air.texte" /></p>

                    <h2>{t('adresses.h2')}</h2>
                    <p><T k="adresses.texte" /></p>

                    <h2>{t('attributions.h2')}</h2>
                    <div className="legal-callout">
                        <ul>
                            <li><T k="attributions.osm" /></li>
                            <li><T k="attributions.lo" /></li>
                            <li><T k="attributions.statbel" /></li>
                            <li><T k="attributions.cams" /></li>
                            <li>{t('attributions.waqi')}</li>
                            <li>{t('attributions.maptiler')}</li>
                        </ul>
                    </div>

                    <h2>{t('reutiliser.h2')}</h2>
                    <p><T k="reutiliser.texte" /></p>
                    <p><T k="reutiliser.voirAussi" /></p>
                </article>
            </div>
        </>
    );
}
