import './Header.css';
import LinkButton from '../ui/LinkButton';
import { FaUser } from "react-icons/fa";

const isPage = (currentPage, targetPage) => {
    return currentPage === targetPage ? "active" : "";
};

const ProfileButton = ({ className }) => {
    return (
        <a href="/profil" id="profile-button" className={className}>
            <FaUser size={20} />
        </a>
    );
};

const Header = ({ page }) => {
    return (
        <header>
            <div id="header-logo-title">
                <picture>
                    <source srcSet="src/assets/logo_clair.png" height="40" media="(prefers-color-scheme: dark)" alt="Logo Sécu'Cycle" />
                    <img src="src/assets/logo.png" height="40" alt="Logo Sécu'Cycle" />
                </picture>
                <div id="header-title">Sécu'Cycle</div>
            </div>
            <nav>
                <LinkButton to="/" className={isPage(page, "home") + ' margin-right'}>Accueil</LinkButton>
                <LinkButton to="/itineraire" className={isPage(page, "itineraire")}>Itinéraire</LinkButton>
            </nav>
            <ProfileButton className={isPage(page, "profil")} />
        </header>
    );
};

export default Header;
