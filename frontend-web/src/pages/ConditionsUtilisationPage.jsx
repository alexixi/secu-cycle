import { Link } from "react-router-dom";
import Meta from "../components/Meta";
import Header from "../components/layout/Header";
import "./legal.css";

export default function ConditionsUtilisationPage() {
    return (
        <>
            <Meta
                title="Sécu'Cycle | Conditions générales d'utilisation"
                description="Conditions générales d'utilisation du site et de l'application Sécu'Cycle : accès au service, obligations, avertissement de sécurité et responsabilité."
            />
            <Header page="conditions-utilisation" />
            <main className="legal-page">
                <article className="legal-content">
                    <h1>Conditions générales d'utilisation</h1>
                    <p className="legal-updated">Dernière mise à jour : 7 juillet 2026</p>

                    <h2>1. Objet</h2>
                    <p>
                        Les présentes conditions générales d'utilisation (« CGU ») définissent les modalités
                        d'accès et d'utilisation du site <strong>secu-cycle.fr</strong> et de l'application
                        mobile <strong>Sécu'Cycle</strong> (ci-après « le Service »). En créant un compte ou en
                        utilisant le Service, vous acceptez sans réserve les présentes CGU.
                    </p>

                    <h2>2. Description du Service</h2>
                    <p>
                        Sécu'Cycle est un service <strong>gratuit</strong> qui aide les cyclistes à trouver des
                        itinéraires adaptés à la sécurité, à naviguer en temps réel et à signaler des dangers. Le
                        Service repose sur des données ouvertes (OpenStreetMap, IGN, Base Adresse Nationale,
                        AVATAR du Cerema) et propose des itinéraires à titre indicatif.
                    </p>

                    <h2>3. Accès et compte</h2>
                    <p>
                        Certaines fonctionnalités nécessitent la création d'un compte. Vous vous engagez à
                        fournir des informations exactes et à préserver la confidentialité de vos identifiants.
                        Le Service est réservé aux personnes âgées d'au moins <strong>15 ans</strong>&nbsp;; les
                        personnes plus jeunes doivent obtenir l'accord de leurs représentants légaux.
                    </p>

                    <h2>4. Obligations de l'utilisateur</h2>
                    <ul>
                        <li>Utiliser le Service de manière licite et conforme à sa destination&nbsp;;</li>
                        <li>Ne pas tenter de porter atteinte au fonctionnement, à la sécurité ou à l'intégrité du Service&nbsp;;</li>
                        <li>Effectuer des signalements de bonne foi et véridiques&nbsp;;</li>
                        <li>Respecter les droits des tiers et la réglementation applicable.</li>
                    </ul>

                    <h2>5. Avertissement de sécurité</h2>
                    <div className="legal-callout">
                        <p>
                            Le guidage proposé par Sécu'Cycle est une <strong>aide à la navigation</strong> et ne
                            saurait se substituer à votre vigilance. Vous restez seul responsable de votre
                            conduite.
                        </p>
                        <p>
                            Vous devez à tout moment <strong>respecter le Code de la route</strong>, adapter votre
                            comportement aux conditions réelles de circulation et <strong>ne pas manipuler votre
                            téléphone en roulant</strong>. Les itinéraires et informations fournis sont indicatifs
                            et leur exactitude ou leur sécurité ne sont pas garanties.
                        </p>
                    </div>

                    <h2>6. Propriété intellectuelle</h2>
                    <p>
                        Le Service, sa marque, son logo et son interface sont protégés. Les données
                        cartographiques et de mobilité restent la propriété de leurs fournisseurs respectifs et
                        sont utilisées conformément à leurs licences (notamment la licence ODbL d'OpenStreetMap).
                        Aucune licence ou cession n'est accordée au-delà de l'usage personnel du Service.
                    </p>

                    <h2>7. Responsabilité</h2>
                    <p>
                        Le Service est fourni « en l'état », dans le cadre d'un projet étudiant, sans garantie de
                        disponibilité, d'exactitude ou d'adéquation à un usage particulier. Dans les limites
                        permises par la loi, les éditeurs ne peuvent être tenus responsables des dommages
                        résultant de l'utilisation ou de l'impossibilité d'utiliser le Service, ni d'une décision
                        prise sur la base d'un itinéraire proposé.
                    </p>

                    <h2>8. Données personnelles</h2>
                    <p>
                        Le traitement de vos données personnelles est décrit dans notre{" "}
                        <Link to="/confidentialite">politique de confidentialité</Link>, qui fait partie
                        intégrante des présentes CGU.
                    </p>

                    <h2>9. Modification et résiliation</h2>
                    <p>
                        Les éditeurs peuvent faire évoluer le Service et les présentes CGU. Vous pouvez cesser
                        d'utiliser le Service et supprimer votre compte à tout moment. En cas de manquement aux
                        CGU, l'accès au Service peut être suspendu ou résilié.
                    </p>

                    <h2>10. Droit applicable et litiges</h2>
                    <p>
                        Les présentes CGU sont soumises au <strong>droit français</strong>. En cas de litige, une
                        solution amiable sera recherchée en priorité en nous contactant à{" "}
                        <a href="mailto:contact@secu-cycle.fr">contact@secu-cycle.fr</a>. À défaut, le
                        consommateur peut recourir gratuitement à un médiateur de la consommation ou à la
                        plateforme européenne de règlement en ligne des litiges&nbsp;:{" "}
                        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.
                        Les tribunaux français sont compétents.
                    </p>

                    <h2>11. Contact</h2>
                    <p>
                        Pour toute question relative aux présentes CGU :{" "}
                        <a href="mailto:contact@secu-cycle.fr">contact@secu-cycle.fr</a>. Les informations
                        relatives à l'éditeur et à l'hébergeur figurent dans les{" "}
                        <Link to="/mentions-legales">mentions légales</Link>.
                    </p>
                </article>
            </main>
        </>
    );
}
