import { Link, useLocation } from "react-router";
import Logo from "../../assets/logo.svg?react";
import { langFromPathname, pathFor } from "../../i18n/routes";
import "./Footer.css";

// Ces liens sont, avec ceux de CarteHubPage, le seul maillage interne réellement
// crawlable du site : la navigation de l'en-tête passe par LinkButton, qui rend
// un <button> et non une ancre. C'est donc d'ici que react-snap et les moteurs
// découvrent l'arbre des pages — d'où l'usage de <Link>, à ne pas remplacer par
// un bouton.
const LIENS = [
    { routeKey: "carteHub", label: "Cartes par ville" },
    { routeKey: "faq", label: "FAQ" },
    { routeKey: "donnees", label: "Sources des données" },
    { routeKey: "mentionsLegales", label: "Mentions légales" },
    { routeKey: "confidentialite", label: "Politique de confidentialité" },
    { routeKey: "conditions", label: "Conditions d'utilisation" },
    { routeKey: "contact", label: "Contact" },
];

export default function Footer() {
    const year = new Date().getFullYear();
    const lang = langFromPathname(useLocation().pathname);

    return (
        <footer className="footer">
            <div className="footer-brand">
                <Logo className="footer-logo" />
                <span className="footer-title">Sécu'Cycle</span>
            </div>
            <nav className="footer-links" aria-label="Liens légaux">
                {LIENS.map(({ routeKey, label }) => (
                    <Link key={routeKey} to={pathFor(routeKey, lang)}>{label}</Link>
                ))}
            </nav>
            <div className="footer-copy">
                © {year} Sécu'Cycle
            </div>
        </footer>
    );
}
