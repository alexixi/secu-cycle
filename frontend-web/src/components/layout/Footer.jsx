import { Link } from "react-router-dom";
import Logo from "../../assets/logo.svg?react";
import "./Footer.css";

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-brand">
                <Logo className="footer-logo" />
                <span className="footer-title">Sécu'Cycle</span>
            </div>
            <nav className="footer-links" aria-label="Liens légaux">
                <Link to="/faq">FAQ</Link>
                <Link to="/mentions-legales">Mentions légales</Link>
                <Link to="/confidentialite">Politique de confidentialité</Link>
                <Link to="/conditions-utilisation">Conditions d'utilisation</Link>
                <Link to="/contact">Contact</Link>
            </nav>
            <div className="footer-copy">
                © {year} Sécu'Cycle
            </div>
        </footer>
    );
}
