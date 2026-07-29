import { Link } from "react-router";
import Meta from "../components/Meta";
import "./legal.css";

export default function MentionsLegalesPage() {
    return (
        <>
            <Meta
                title="Sécu'Cycle | Mentions légales"
                description="Mentions légales du site et de l'application Sécu'Cycle : éditeur, directeur de la publication et hébergeur."
            />
            <div className="legal-page">
                <article className="legal-content">
                    <h1>Mentions légales</h1>
                    <p className="legal-updated">Dernière mise à jour : 28 juillet 2026</p>

                    <p>
                        Conformément à l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance
                        dans l'économie numérique (LCEN), les présentes mentions légales identifient les
                        personnes responsables du site <strong>secu-cycle.fr</strong> et de l'application
                        mobile <strong>Sécu'Cycle</strong>, ainsi que leur hébergeur.
                    </p>

                    <h2>Éditeurs du site et de l'application</h2>
                    <p>
                        Sécu'Cycle est un projet étudiant réalisé dans le cadre d'un Projet de Fin d'Année (PFA)
                        par des élèves ingénieurs de l'<strong>ENSEIRB-MATMECA</strong> (Bordeaux INP), 1 avenue
                        du Docteur Albert Schweitzer, 33400 Talence, France. Il ne s'agit pas d'une société
                        commerciale immatriculée au Registre du Commerce et des Sociétés.
                    </p>
                    <p>
                        Le site et l'application sont édités conjointement par&nbsp;:
                    </p>
                    <ul>
                        <li><strong>Alexis Gaudray Bouju</strong></li>
                        <li><strong>Matheline Chevalier</strong></li>
                    </ul>
                    <p>
                        Contact : <a href="mailto:contact@secu-cycle.fr">contact@secu-cycle.fr</a>
                    </p>

                    <h2>Directeur de la publication</h2>
                    <p>
                        Le directeur de la publication est <strong>Alexis Gaudray Bouju</strong>, joignable à
                        l'adresse <a href="mailto:contact@secu-cycle.fr">contact@secu-cycle.fr</a>.
                    </p>

                    <h2>Hébergeur</h2>
                    <p>
                        Le site et l'API de Sécu'Cycle sont hébergés par&nbsp;:
                    </p>
                    <p>
                        <strong>IONOS SARL</strong><br />
                        7 place de la Gare, BP 70109<br />
                        57201 Sarreguemines Cedex, France<br />
                        Téléphone : 0970 808 911<br />
                        <a href="https://www.ionos.fr" target="_blank" rel="noopener noreferrer">www.ionos.fr</a>
                    </p>

                    <h2>Propriété intellectuelle</h2>
                    <p>
                        La marque « Sécu'Cycle », le logo, les textes et l'interface du site et de l'application
                        sont la propriété de leurs éditeurs. Toute reproduction ou représentation, totale ou
                        partielle, sans autorisation préalable, est interdite.
                    </p>
                    <p>
                        Les données cartographiques, d'accidentologie et de mobilité proviennent de sources
                        tierces, restent la propriété de leurs producteurs et sont exploitées dans le respect
                        de leurs licences respectives&nbsp;:
                    </p>
                    <ul>
                        <li>
                            © les contributeurs{" "}
                            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>,
                            sous licence{" "}
                            <a href="https://opendatacommons.org/licenses/odbl/" target="_blank" rel="noopener noreferrer">ODbL</a>{" "}
                            — réseau routier, aménagements cyclables, revêtement, éclairage et points d'intérêt.
                        </li>
                        <li>
                            <a href="https://geoservices.ign.fr/rgealti" target="_blank" rel="noopener noreferrer">IGN</a> (RGE ALTI),
                            ONISR (fichiers BAAC, via le jeu «&nbsp;Accidents de vélo&nbsp;»),{" "}
                            <a href="https://adresse.data.gouv.fr/" target="_blank" rel="noopener noreferrer">Base Adresse Nationale</a>,
                            et les portails open data de Bordeaux Métropole, de l'Eurométropole de Strasbourg,
                            de Rennes Métropole et de Nantes Métropole (trafic en temps réel et éclairage
                            public), sous{" "}
                            <a href="https://www.etalab.gouv.fr/licence-ouverte-open-licence/" target="_blank" rel="noopener noreferrer">Licence Ouverte</a>.
                        </li>
                        <li>
                            <a href="https://statbel.fgov.be/fr/open-data/geolocalisation-des-accidents-de-la-circulation-2017-2024" target="_blank" rel="noopener noreferrer">Statbel</a>{" "}
                            — accidents de la circulation géolocalisés, sous licence{" "}
                            <a href="https://creativecommons.org/licenses/by/4.0/deed.fr" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>.
                        </li>
                        <li>
                            Generated using Copernicus Atmosphere Monitoring Service information 2026&nbsp;:
                            les données de qualité de l'air issues du{" "}
                            <a href="https://atmosphere.copernicus.eu/" target="_blank" rel="noopener noreferrer">CAMS</a>{" "}
                            sont modifiées par Sécu'Cycle et obtenues par l'intermédiaire d'Open-Meteo. Ni la
                            Commission européenne ni l'ECMWF ne sont responsables de l'usage qui en est fait.
                        </li>
                        <li>
                            <a href="https://waqi.info/" target="_blank" rel="noopener noreferrer">World Air Quality Index Project</a>{" "}
                            — mesures des stations de surveillance au sol.
                        </li>
                        <li>
                            Flux GBFS des neuf systèmes de vélos en libre-service intégrés, chacun sous
                            l'attribution de son opérateur.
                        </li>
                        <li>
                            Fonds de carte et géocodage hors de France&nbsp;:{" "}
                            <a href="https://www.maptiler.com/" target="_blank" rel="noopener noreferrer">MapTiler</a>,
                            service commercial.
                        </li>
                    </ul>
                    <p>
                        Le détail de chaque source, son usage exact et son producteur sont listés sur notre
                        page <Link to="/donnees">sources des données</Link>.
                    </p>

                    <h2>Données personnelles et conditions d'utilisation</h2>
                    <p>
                        Le traitement de vos données personnelles est décrit dans notre{" "}
                        <Link to="/confidentialite">politique de confidentialité</Link>. L'utilisation du service
                        est régie par nos <Link to="/conditions-utilisation">conditions générales d'utilisation</Link>.
                    </p>
                </article>
            </div>
        </>
    );
}
