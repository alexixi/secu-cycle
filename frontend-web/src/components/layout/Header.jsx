import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import './Header.css';
import LinkButton from '../ui/LinkButton';
import IconButton from '../ui/IconButton';
import Logo from "../../assets/logo.svg?react";
import { useAuth } from "../../context/AuthContext";
import { LuLogIn, LuLogOut, LuMenu } from "react-icons/lu";
import { FaUser, FaHome } from "react-icons/fa";
import { FaPersonCirclePlus } from "react-icons/fa6";
import { PiPathBold } from "react-icons/pi";

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

    const [isProfileMenuOpen, setisProfileMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.profile-dropdown') && !event.target.closest('#profile-button')) {
                setisProfileMenuOpen(false);
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
            <nav className='media-large'>
                <LinkButton to="/" className={isPage(page, "home")}>Accueil</LinkButton>
                <LinkButton to="/itineraire" className={isPage(page, "itineraire")}>Itinéraire</LinkButton>
            </nav>
            <div className='header-user-section media-large'>
                {user
                    ? <div className="user-connected">{user.first_name}</div>
                    : <LinkButton to="/login" className={isPage(page, "login")}>Connexion</LinkButton>
                }
                <ProfileButton
                    className={isProfileMenuOpen || page in ["profil", "login", "signin"] ? 'active' : ''}
                    onClick={() => setisProfileMenuOpen(!isProfileMenuOpen)}
                />
            </div>

            {isProfileMenuOpen && user && (
                <div className="dropdown profile-dropdown">
                    <a className="dropdown-item" href="/profil"><FaUser /> Mon Profil</a>
                    <button className="dropdown-item logout-btn" onClick={() => { logoutAuth(); setisProfileMenuOpen(false); navigate("/"); }}><LuLogOut /> Se déconnecter</button>
                </div>
            )}

            {isProfileMenuOpen && !user && (
                <div className="dropdown profile-dropdown">
                    <a className="dropdown-item" href="/login"><LuLogIn /> Se connecter</a>
                    <a className="dropdown-item" href="/signin"><FaPersonCirclePlus /> Créer un compte</a>
                </div>
            )}

            <IconButton
                className="mobile-menu-button media-small"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                <LuMenu size={24} />
            </IconButton>

            {isMobileMenuOpen && (
                <div className="dropdown mobile-dropdown media-small">
                    <a className="dropdown-item" href="/"><FaHome /> Accueil</a>
                    <a className="dropdown-item" href="/itineraire"><PiPathBold /> Itinéraires</a>
                    <hr className="dropdown-divider" />
                    {user ? (
                        <>
                            <a className="dropdown-item" href="/profil"><FaUser /> Mon Profil</a>
                            <button className="dropdown-item logout-btn" onClick={() => { logoutAuth(); setIsMobileMenuOpen(false); navigate("/"); }}><LuLogOut /> Se déconnecter</button>
                        </>
                    ) : (
                        <>
                            <a className="dropdown-item" href="/login"><LuLogIn /> Se connecter</a>
                            <a className="dropdown-item" href="/signin"><FaPersonCirclePlus /> Créer un compte</a>
                        </>
                    )}
                </div>
            )}

        </header>
    );
};

export default Header;
