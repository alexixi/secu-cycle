import './Header.css';
import LinkButton from '../ui/LinkButton';
import Logo from "../../assets/logo.svg?react";
import { FaUser } from "react-icons/fa";

const isPage = (currentPage, targetPage) => {
    return currentPage === targetPage ? "active" : "";
};

const ProfileButton = ({ className }) => {
    return (
        <a href="/login" id="profile-button" className={className}>
            <FaUser size={20} />
        </a>
    );
};

const Header = ({ page }) => {
    return (
        <header>
            <a id="header-logo-title" href="/">
                <Logo id="header-logo" />
                <div id="header-title">Sécu'Cycle</div>
            </a>
            <nav>
                <LinkButton to="/" className={isPage(page, "home") + ' margin-right'}>Accueil</LinkButton>
                <LinkButton to="/itineraire" className={isPage(page, "itineraire")}>Itinéraire</LinkButton>
            </nav>
            <ProfileButton className={isPage(page, "profil")} />
        </header>
    );
};

export default Header;
