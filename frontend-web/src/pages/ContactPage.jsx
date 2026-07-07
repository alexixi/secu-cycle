import { Link } from "react-router-dom";
import Meta from "../components/Meta";
import Header from "../components/layout/Header";
import "./legal.css";

export default function ContactPage() {
    return (
        <>
            <Meta
                title="Sécu'Cycle | Contact"
                description="Contacter l'équipe Sécu'Cycle : support, questions et exercice de vos droits sur vos données personnelles."
            />
            <Header page="contact" />
            <main className="legal-page">
                <article className="legal-content">
                    <h1>Contact</h1>

                    <p>
                        Une question, un retour, un bug à signaler ou une demande
                        concernant vos données&nbsp;? Nous lisons tous les messages et vous répondons avec
                        plaisir.
                    </p>

                    <div className="legal-callout">
                        <p>
                            <strong>Écrivez-nous à&nbsp;:</strong>{" "}
                            <a href="mailto:contact@secu-cycle.fr">contact@secu-cycle.fr</a>
                        </p>
                    </div>

                    <h2>Objet de votre demande</h2>
                    <p>
                        Toutes les demandes passent par cette même adresse. Pour nous aider à traiter votre
                        message plus vite, précisez l'objet dans le sujet de votre e-mail&nbsp;:
                    </p>
                    <ul>
                        <li>
                            <strong>Support et bugs</strong> — un problème technique, une erreur, un
                            comportement inattendu du site ou de l'application.
                        </li>
                        <li>
                            <strong>Suggestions</strong> — une idée, un retour d'expérience ou une amélioration
                            à proposer.
                        </li>
                        <li>
                            <strong>Données personnelles (RGPD)</strong> — pour exercer vos droits d'accès, de
                            rectification, d'effacement, de limitation, d'opposition ou de portabilité. Les
                            modalités sont détaillées dans notre{" "}
                            <Link to="/confidentialite">politique de confidentialité</Link>.
                        </li>
                        <li>
                            <strong>Signalement</strong> — pour nous signaler un contenu ou un usage
                            problématique.
                        </li>
                    </ul>

                    <h2>Délai de réponse</h2>
                    <p>
                        Sécu'Cycle étant un projet étudiant mené bénévolement, nous ne pouvons pas garantir de
                        délai de réponse. Nous faisons néanmoins de notre mieux pour répondre dans les meilleurs
                        délais.
                    </p>

                    <h2>Informations légales</h2>
                    <p>
                        Pour en savoir plus, consultez nos{" "}
                        <Link to="/mentions-legales">mentions légales</Link>, notre{" "}
                        <Link to="/confidentialite">politique de confidentialité</Link> et nos{" "}
                        <Link to="/conditions-utilisation">conditions générales d'utilisation</Link>.
                    </p>
                </article>
            </main>
        </>
    );
}
