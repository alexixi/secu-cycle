import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import Logo from "../../assets/logo.svg?react";
import { langFromPathname, pathFor } from "../../i18n/routes";
import "./Footer.css";

// Ces liens sont, avec ceux de CarteHubPage, le seul maillage interne réellement
// crawlable du site : la navigation de l'en-tête passe par LinkButton, qui rend
// un <button> et non une ancre. C'est donc d'ici que react-snap et les moteurs
// découvrent l'arbre des pages — d'où l'usage de <Link>, à ne pas remplacer par
// un bouton.
// Clés de route : le libellé se résout au rendu, dans la langue de la page.
const LIENS = ["carteHub", "faq", "donnees", "mentionsLegales", "confidentialite", "conditions", "contact"];

export default function Footer() {
    const { t } = useTranslation();
    const year = new Date().getFullYear();
    const lang = langFromPathname(useLocation().pathname);

    return (
        <footer className="footer">
            <div className="footer-brand">
                <Logo className="footer-logo" />
                {/* i18n-exempt: nom de la marque */}
                <span className="footer-title">Sécu'Cycle</span>
            </div>
            <nav className="footer-links" aria-label={t('a11y.liensLegaux')}>
                {LIENS.map((routeKey) => (
                    <Link key={routeKey} to={pathFor(routeKey, lang)}>{t(`nav.${routeKey}`)}</Link>
                ))}
            </nav>
            <div className="footer-copy">
                © {year} Sécu'Cycle
            </div>
        </footer>
    );
}
