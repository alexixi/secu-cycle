import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import './Header.css';
import LinkButton from '../ui/LinkButton';
import Logo from "../../assets/logo.svg?react";
import { useAuth } from "../../context/AuthContext";
import { FaUser } from "react-icons/fa";
import { LuLogIn } from "react-icons/lu";
import { LuLogOut } from "react-icons/lu";
import { FaPersonCirclePlus } from "react-icons/fa6";

const isPage = (currentPage, targetPage) => {
    return currentPage === targetPage ? "active" : "";
};

const ProfileButton = ({ className, onClick }) => {
    return (
        <button id="profile-button" className={className} onClick={onClick}>
            <FaUser size={20} />
        </button>
    );
};

const Header = ({ page }) => {
    const { user, logoutAuth } = useAuth();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.profile-dropdown') && !event.target.closest('#profile-button')) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    return (
        <header>
            <a id="header-logo-title" href="/">
                <Logo id="header-logo" />
                <div id="header-title">Sécu'Cycle</div>
            </a>
            <nav>
                <LinkButton to="/" className={isPage(page, "home")}>Accueil</LinkButton>
                <LinkButton to="/itineraire" className={isPage(page, "itineraire")}>Itinéraire</LinkButton>
            </nav>
            <div className='header-user-section'>
                {user
                    ? <div className="user-connected">{user.first_name}</div>
                    : <LinkButton to="/login" className={isPage(page, "login")}>Connexion</LinkButton>
                }
                <ProfileButton
                    className={isMenuOpen || page in ["profil", "login", "signin"] ? 'active' : ''}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                />
            </div>

            {isMenuOpen && user && (
                <div className="dropdown profile-dropdown">
                    <a className="dropdown-item" href="/profil"><FaUser /> Mon Profil</a>
                    <button className="dropdown-item logout-btn" onClick={() => { logoutAuth(); setIsMenuOpen(false); navigate("/"); }}><LuLogOut /> Se déconnecter</button>
                </div>
            )}

            {isMenuOpen && !user && (
                <div className="dropdown profile-dropdown">
                    <a className="dropdown-item" href="/login"><LuLogIn /> Se connecter</a>
                    <a className="dropdown-item" href="/signin"><FaPersonCirclePlus /> Créer un compte</a>
                </div>
            )}

        </header>
    );
};

export default Header;
