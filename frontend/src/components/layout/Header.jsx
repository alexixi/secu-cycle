import './Header.css';
import LinkButton from '../ui/LinkButton';

const isPage = (currentPage, targetPage) => {
  return currentPage === targetPage ? "active" : "";
};

const ProfileButton = () => {
  return (
    <a href="/profil" id="profile-button">
        <img id="profile-icon" src="https://img.icons8.com/ios-glyphs/30/user--v1.png" alt="user--v1"/>
    </a>
  );
};

const Header = ({ page }) => {
  return (
    <header>
        <div id="header-logo-title">
            {/* <img src="" alt="" /> */}
            <div id="header-title">🚲 Itinéraire vélo</div>
        </div>
        <nav>
            <LinkButton to="/" className={isPage(page, "home") + ' margin-right'}>Accueil</LinkButton>
            <LinkButton to="/itineraire" className={isPage(page, "itineraire")}>Itinéraire</LinkButton>
        </nav>
        <ProfileButton />
    </header>
  );
};

export default Header;
