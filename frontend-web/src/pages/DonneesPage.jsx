import { Link } from "react-router";
import { Helmet } from "react-helmet-async";
import Meta from "../components/Meta";
import "./legal.css";

const ODBL = { label: "ODbL", href: "https://opendatacommons.org/licenses/odbl/" };
const LO = { label: "Licence Ouverte", href: "https://www.etalab.gouv.fr/licence-ouverte-open-licence/" };
const LO2 = { label: "Licence Ouverte 2.0", href: "https://www.etalab.gouv.fr/licence-ouverte-open-licence/" };
const CCBY = { label: "CC BY 4.0", href: "https://creativecommons.org/licenses/by/4.0/deed.fr" };

const SOURCES = [
    {
        name: "OpenStreetMap",
        detail: "via Overpass",
        usage: "Graphe routier, aménagements cyclables, itinéraires cyclables balisés (véloroutes, RAVeL, réseaux express vélo), revêtement, éclairage, sens de circulation et points d'intérêt",
        licence: ODBL,
        producer: { label: "openstreetmap.org", href: "https://www.openstreetmap.org/copyright" },
    },
    {
        name: "IGN — RGE ALTI",
        detail: "Géoplateforme",
        usage: "Altitude de chaque nœud du graphe, dont se déduit la pente des tronçons",
        licence: LO,
        producer: { label: "geoservices.ign.fr", href: "https://geoservices.ign.fr/rgealti" },
    },
    {
        name: "Points lumineux",
        detail: "Bordeaux Métropole",
        usage: "Densification de l'éclairage public là où OpenStreetMap est lacunaire",
        licence: LO,
        producer: {
            label: "opendata.bordeaux-metropole.fr",
            href: "https://opendata.bordeaux-metropole.fr/explore/dataset/bor_ptlum/",
        },
    },
    {
        name: "Luminaires d'éclairage public",
        detail: "Nantes Métropole",
        usage: "Densification de l'éclairage public",
        licence: LO,
        producer: {
            label: "data.nantesmetropole.fr",
            href: "https://data.nantesmetropole.fr/explore/dataset/244400404_luminaires-eclairage-public-nantes-metropole/",
        },
    },
    {
        name: "« Accidents de vélo »",
        detail: "dérivé des BAAC de l'ONISR, publié par Koumoul",
        usage: "Malus d'accidentologie sur les tronçons, France",
        licence: LO2,
        producer: {
            label: "data.gouv.fr",
            href: "https://www.data.gouv.fr/datasets/accidents-de-velo",
        },
    },
    {
        name: "Géolocalisation des accidents de la circulation 2017-2024",
        detail: "Statbel",
        usage: "Malus d'accidentologie sur les tronçons, Belgique",
        licence: CCBY,
        producer: {
            label: "statbel.fgov.be",
            href: "https://statbel.fgov.be/fr/open-data/geolocalisation-des-accidents-de-la-circulation-2017-2024",
        },
    },
    {
        name: "Base Adresse Nationale",
        usage: "Autocomplétion et géocodage des adresses françaises",
        licence: LO,
        producer: { label: "adresse.data.gouv.fr", href: "https://adresse.data.gouv.fr/" },
    },
    {
        name: "Trafic temps réel",
        detail: "Bordeaux Métropole",
        usage: "État de circulation des axes routiers",
        licence: LO,
        producer: {
            label: "opendata.bordeaux-metropole.fr",
            href: "https://opendata.bordeaux-metropole.fr/explore/dataset/ci_trafi_l/",
        },
    },
    {
        name: "Trafic temps réel (SIRAC)",
        detail: "Eurométropole de Strasbourg",
        usage: "État de circulation des axes routiers",
        licence: LO,
        producer: {
            label: "eurometrostrasbourg.opendatasoft.com",
            href: "https://eurometrostrasbourg.opendatasoft.com/explore/dataset/sirac_flux_trafic/",
        },
    },
    {
        name: "État du trafic en temps réel",
        detail: "Rennes Métropole",
        usage: "État de circulation des axes routiers",
        licence: ODBL,
        producer: {
            label: "data.rennesmetropole.fr",
            href: "https://data.rennesmetropole.fr/explore/dataset/etat-du-trafic-en-temps-reel/",
        },
    },
    {
        name: "Fluidité des axes routiers",
        detail: "Nantes Métropole",
        usage: "État de circulation des axes routiers",
        licence: ODBL,
        producer: {
            label: "data.nantesmetropole.fr",
            href: "https://data.nantesmetropole.fr/explore/dataset/244400404_fluidite-axes-routiers-nantes-metropole/",
        },
    },
    {
        name: "GBFS",
        detail: "neuf systèmes de vélos en libre-service",
        usage: "Disponibilité des stations et des vélos en temps réel",
        licence: { label: "Flux ouverts, attribution par système" },
        producer: { label: "gbfs.org", href: "https://gbfs.org/" },
    },
    {
        name: "CAMS",
        detail: "Copernicus, redistribué par Open-Meteo",
        usage: "Indice européen de qualité de l'air le long du trajet",
        licence: { label: "Copernicus — attribution requise", href: "https://atmosphere.copernicus.eu/data-access" },
        producer: { label: "atmosphere.copernicus.eu", href: "https://atmosphere.copernicus.eu/" },
    },
    {
        name: "World Air Quality Index",
        usage: "Mesures des stations de surveillance au sol, en complément du CAMS",
        licence: { label: "Attribution requise" },
        producer: { label: "waqi.info", href: "https://waqi.info/" },
    },
    {
        name: "Open-Meteo",
        detail: "modèles ICON-D2 (DWD) et AROME (Météo-France)",
        usage: "Conditions météo, prévision de pluie au pas de 15 minutes, vent, et alertes dérivées de seuils (orage, grêle, verglas, rafales)",
        licence: { label: "CC BY 4.0", href: "https://creativecommons.org/licenses/by/4.0/deed.fr" },
        producer: { label: "open-meteo.com", href: "https://open-meteo.com/" },
    },
    {
        name: "Vigilance Météo-France",
        detail: "via le miroir Opendatasoft",
        usage: "Vigilance météorologique officielle par département (orages, vent, neige-verglas, canicule…) en France",
        licence: LO2,
        producer: { label: "meteofrance.com", href: "https://vigilance.meteofrance.fr/" },
    },
    {
        name: "MeteoAlarm",
        detail: "EUMETNET, relayant l'IRM",
        usage: "Avertissements météorologiques officiels par province en Belgique",
        licence: { label: "Attribution EUMETNET et IRM requise", href: "https://meteoalarm.org/en/live/page/disclaimer" },
        producer: { label: "meteoalarm.org", href: "https://meteoalarm.org/" },
    },
    {
        name: "MapTiler",
        usage: "Fonds de carte et géocodage hors de France",
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

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Sources des données — Sécu'Cycle",
    url: "https://secu-cycle.fr/donnees/",
    description:
        "Inventaire des jeux de données ouvertes réutilisés par Sécu'Cycle pour calculer des itinéraires vélo sécurisés : usage, licence et producteur de chacun.",
    isPartOf: { "@type": "WebSite", name: "Sécu'Cycle", url: "https://secu-cycle.fr/" },
    mentions: SOURCES.map((s) => ({
        "@type": "Dataset",
        name: s.detail ? `${s.name} (${s.detail})` : s.name,
        description: s.usage,
        ...(s.licence.href ? { license: s.licence.href } : {}),
        ...(s.producer.href ? { url: s.producer.href } : {}),
    })),
};

export default function DonneesPage() {
    return (
        <>
            <Meta
                title="Sécu'Cycle | Sources des données"
                description="Les données ouvertes qui font tourner Sécu'Cycle : OpenStreetMap, IGN, accidentologie BAAC et Statbel, trafic temps réel, GBFS, qualité de l'air."
            />
            <Helmet>
                <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
            </Helmet>
            <div className="legal-page">
                <article className="legal-content">
                    <h1>Sources des données</h1>
                    <p className="legal-updated">Dernière mise à jour : 28 juillet 2026</p>

                    <p>
                        Sécu'Cycle calcule des itinéraires vélo optimisés pour la sécurité plutôt que pour la
                        seule distance. Le service construit un graphe routier à partir d'OpenStreetMap, puis
                        attribue à chaque tronçon un score de sécurité sur 10 qui croise plusieurs jeux de
                        données ouverts. Cette page recense l'intégralité de ces sources, leur usage exact,
                        leur licence et leur producteur.
                    </p>

                    <h2>Tableau récapitulatif</h2>
                    <div className="legal-table-wrapper">
                        <table className="legal-table">
                            <thead>
                                <tr>
                                    <th>Source</th>
                                    <th>Usage dans Sécu'Cycle</th>
                                    <th>Licence</th>
                                    <th>Producteur</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SOURCES.map((s) => (
                                    <tr key={`${s.name}-${s.detail ?? ""}`}>
                                        <td>
                                            <strong>{s.name}</strong>
                                            {s.detail && <><br />{s.detail}</>}
                                        </td>
                                        <td>{s.usage}</td>
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

                    <h2>Réseau routier et aménagements cyclables</h2>
                    <p>
                        Le type d'aménagement cyclable, la hiérarchie de la voie, le revêtement, l'éclairage
                        public et le sens de circulation sont extraits d'
                        <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>{" "}
                        au moyen de l'API Overpass. Ce sont ces attributs qui forment la note d'infrastructure
                        d'un tronçon, avant application des malus.
                    </p>
                    <p>
                        La même source alimente les points d'intérêt affichés sur la carte&nbsp;: points d'eau
                        et fontaines, toilettes publiques, stationnements vélo, ateliers de réparation et
                        stations de gonflage.
                    </p>

                    <h2>Éclairage public</h2>
                    <p>
                        Les lampadaires cartographiés dans OpenStreetMap couvrent l'ensemble de la zone
                        desservie, mais de façon inégale. Sur deux métropoles, ils sont densifiés par le jeu
                        open data du gestionnaire&nbsp;: les{" "}
                        <a href="https://opendata.bordeaux-metropole.fr/explore/dataset/bor_ptlum/" target="_blank" rel="noopener noreferrer">points lumineux de Bordeaux Métropole</a>{" "}
                        et les{" "}
                        <a href="https://data.nantesmetropole.fr/explore/dataset/244400404_luminaires-eclairage-public-nantes-metropole/" target="_blank" rel="noopener noreferrer">luminaires d'éclairage public de Nantes Métropole</a>.
                    </p>

                    <h2>Dénivelé</h2>
                    <p>
                        Les altitudes sont interrogées sur chaque nœud du graphe auprès du service de calcul
                        altimétrique de la{" "}
                        <a href="https://geoservices.ign.fr/rgealti" target="_blank" rel="noopener noreferrer">Géoplateforme de l'IGN</a>{" "}
                        (ressource RGE ALTI). La pente d'un tronçon est calculée par différence entre ses
                        extrémités, puis pondérée selon le profil du cycliste et l'assistance électrique
                        éventuelle de son vélo.
                    </p>

                    <h2>Accidentologie</h2>
                    <p>
                        Deux registres nationaux sont mobilisés de part et d'autre de la frontière. En France,
                        le jeu{" "}
                        <a href="https://www.data.gouv.fr/datasets/accidents-de-velo" target="_blank" rel="noopener noreferrer">« Accidents de vélo »</a>,
                        dérivé des fichiers BAAC de l'ONISR. En Belgique, les{" "}
                        <a href="https://statbel.fgov.be/fr/open-data/geolocalisation-des-accidents-de-la-circulation-2017-2024" target="_blank" rel="noopener noreferrer">accidents de la circulation géolocalisés 2017-2024</a>{" "}
                        publiés par Statbel, dont les coordonnées en Lambert 72 sont reprojetées en WGS84 à
                        l'ingestion.
                    </p>
                    <p>
                        Chaque accident est rattaché aux tronçons du graphe situés dans un rayon de
                        25&nbsp;mètres, puis pondéré par une décroissance exponentielle de demi-vie
                        5&nbsp;ans. Le malus obtenu est normalisé par la longueur du tronçon, compressé
                        logarithmiquement et plafonné à 1,5&nbsp;point sur 10.
                    </p>
                    <p>
                        Ce plafond est délibéré&nbsp;: ces bases ne comportent aucun dénominateur
                        d'exposition, si bien qu'un axe cyclable très fréquenté cumule mécaniquement des
                        accidents sans être plus dangereux au kilomètre parcouru. Le malus est en outre
                        strictement soustractif — un tronçon sans accident recensé conserve sa note
                        d'infrastructure, pour ne pas avantager les zones que les données couvrent mal.
                    </p>
                    <div className="legal-callout">
                        <p>
                            <strong>Limite assumée.</strong> Ces deux registres ne recensent que les accidents
                            corporels déclarés aux forces de l'ordre. Les chutes sans tiers y sont très
                            largement sous-représentées, et le géocodage est plus lacunaire hors
                            agglomération. Le signal est donc structurellement plus fiable en ville, et un
                            tronçon sans accident recensé n'est pas un tronçon sûr.
                        </p>
                    </div>

                    <h2>Trafic en temps réel</h2>
                    <p>
                        L'état de circulation des axes est collecté toutes les cinq minutes auprès des portails
                        open data de quatre métropoles&nbsp;: Bordeaux Métropole, l'Eurométropole de
                        Strasbourg, Rennes Métropole et Nantes Métropole. Une source n'est interrogée que si
                        son emprise croise celle du graphe chargé. Un axe embouteillé devient plus coûteux pour
                        le calcul d'itinéraire, sans jamais être interdit.
                    </p>

                    <h2>Vélos en libre-service</h2>
                    <p>
                        La disponibilité des stations est collectée au format{" "}
                        <a href="https://gbfs.org/" target="_blank" rel="noopener noreferrer">GBFS</a>{" "}
                        auprès de neuf systèmes français et belges, par auto-découverte des flux. Cette couche
                        est informative&nbsp;: elle ne pèse pas sur le calcul d'itinéraire.
                    </p>
                    <ul>
                        {BIKESHARE_SYSTEMS.map(([name, operator]) => (
                            <li key={name}><strong>{name}</strong> — {operator}</li>
                        ))}
                    </ul>

                    <h2>Qualité de l'air</h2>
                    <p>
                        L'indice européen de qualité de l'air (EAQI) est issu du{" "}
                        <a href="https://atmosphere.copernicus.eu/" target="_blank" rel="noopener noreferrer">CAMS</a>{" "}
                        (Copernicus Atmosphere Monitoring Service), redistribué par Open-Meteo, et
                        échantillonné le long du trajet sur une maille d'environ 11&nbsp;kilomètres. Il est
                        complété par les mesures des stations de surveillance au sol du{" "}
                        <a href="https://waqi.info/" target="_blank" rel="noopener noreferrer">World Air Quality Index</a>,
                        publiées sur l'échelle AQI américaine — distincte de l'indice européen, et affichée
                        comme telle.
                    </p>

                    <h2>Adresses, géocodage et fonds de carte</h2>
                    <p>
                        L'autocomplétion et le géocodage des adresses françaises reposent sur la{" "}
                        <a href="https://adresse.data.gouv.fr/" target="_blank" rel="noopener noreferrer">Base Adresse Nationale</a>.
                        Hors de France, en Belgique notamment, ils sont assurés par{" "}
                        <a href="https://www.maptiler.com/" target="_blank" rel="noopener noreferrer">MapTiler</a>,
                        qui fournit également les tuiles cartographiques du fond de carte. MapTiler est un
                        service commercial&nbsp;: c'est la seule source de cette page qui ne relève pas de
                        l'open data, même si ses fonds de carte sont eux-mêmes construits sur les données
                        d'OpenStreetMap.
                    </p>

                    <h2>Attributions</h2>
                    <div className="legal-callout">
                        <ul>
                            <li>
                                © les contributeurs{" "}
                                <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>,
                                sous licence{" "}
                                <a href="https://opendatacommons.org/licenses/odbl/" target="_blank" rel="noopener noreferrer">ODbL</a>.
                            </li>
                            <li>
                                IGN, ONISR, Base Adresse Nationale, Bordeaux Métropole, Eurométropole de
                                Strasbourg, Rennes Métropole et Nantes Métropole, sous{" "}
                                <a href="https://www.etalab.gouv.fr/licence-ouverte-open-licence/" target="_blank" rel="noopener noreferrer">Licence Ouverte</a>.
                            </li>
                            <li>
                                Statbel, sous licence{" "}
                                <a href="https://creativecommons.org/licenses/by/4.0/deed.fr" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>.
                            </li>
                            <li>
                                Generated using Copernicus Atmosphere Monitoring Service information 2026.
                                Les données CAMS sont modifiées par Sécu'Cycle (échantillonnage le long du
                                trajet) et obtenues par l'intermédiaire d'Open-Meteo. Ni la Commission
                                européenne ni l'ECMWF ne sont responsables de l'usage qui en est fait.
                            </li>
                            <li>World Air Quality Index Project (waqi.info).</li>
                            <li>Fonds de carte © MapTiler © les contributeurs OpenStreetMap.</li>
                        </ul>
                    </div>

                    <h2>Réutiliser nos données</h2>
                    <p>
                        Sécu'Cycle expose une API publique. Les jeux réutilisés restent la propriété de leurs
                        producteurs et sont soumis à leurs licences respectives, rappelées ci-dessus&nbsp;:
                        toute réutilisation en cascade doit les respecter, en particulier la clause de partage
                        à l'identique de l'ODbL. Pour toute question, écrivez-nous à{" "}
                        <a href="mailto:contact@secu-cycle.fr">contact@secu-cycle.fr</a>.
                    </p>
                    <p>
                        Voir aussi nos <Link to="/mentions-legales">mentions légales</Link> et notre{" "}
                        <Link to="/faq">foire aux questions</Link>.
                    </p>
                </article>
            </div>
        </>
    );
}
