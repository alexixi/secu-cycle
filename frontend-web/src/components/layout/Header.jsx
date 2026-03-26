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
            <span id="header-logo-title" onClick={() => navigate("/")}>
                <Logo id="header-logo" />
                <div id="header-title">Sécu'Cycle</div>
            </span>
            <nav className='media-large'>
                <LinkButton to="/" className={isPage(page, "home")}>Accueil</LinkButton>
                <LinkButton to="/itineraire" className={isPage(page, "itineraire")}>Itinéraire</LinkButton>
            </nav>
            <div className='header-user-section media-large'>
                {user
                    ? <div className="user-connected" onClick={() => navigate("/profil")}>
                        {user.first_name}
                      </div>
                    : <LinkButton to="/login" className={isPage(page, "login")}>Connexion</LinkButton>
                }
                <ProfileButton
                    className={isProfileMenuOpen || page in ["profil", "login", "signin"] ? 'active' : ''}
                    onClick={() => setisProfileMenuOpen(!isProfileMenuOpen)}
                />
            </div>

            {isProfileMenuOpen && user && (
                <div className="dropdown profile-dropdown">
                    <button className="dropdown-item" onClick={() => navigate("/profil")}>
                        <FaUser /> Mon Profil
                    </button>
                    <button className="dropdown-item logout-btn" onClick={() => { logoutAuth(); setisProfileMenuOpen(false); }}>
                        <LuLogOut /> Se déconnecter
                    </button>
                </div>
            )}

            {isProfileMenuOpen && !user && (
                <div className="dropdown profile-dropdown">
                    <button className="dropdown-item" onClick={() => navigate("/login")}>
                        <LuLogIn /> Se connecter
                    </button>
                    <button className="dropdown-item" onClick={() => navigate("/signin")}>
                        <FaPersonCirclePlus /> Créer un compte
                    </button>
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
                    <button className="dropdown-item" onClick={() => navigate("/")}>
                        <FaHome /> Accueil
                    </button>
                    <button className="dropdown-item" onClick={() => navigate("/itineraire")}>
                        <PiPathBold /> Itinéraires
                    </button>
                    <hr className="dropdown-divider" />
                    {user ? (
                        <>
                            <button className="dropdown-item" onClick={() => navigate("/profil")}>
                                <FaUser /> Mon Profil
                            </button>
                            <button className="dropdown-item logout-btn" onClick={() => { logoutAuth(); setIsMobileMenuOpen(false); }}>
                                <LuLogOut /> Se déconnecter
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="dropdown-item" onClick={() => navigate("/login")}>
                                <LuLogIn /> Se connecter
                            </button>
                            <button className="dropdown-item" onClick={() => navigate("/signin")}>
                                <FaPersonCirclePlus /> Créer un compte
                            </button>
                        </>
                    )}
                </div>
            )}

        </header>
    );
};

export default Header;
