import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from "react-router";
import './Header.css';
import LinkButton from '../ui/LinkButton';
import IconButton from '../ui/IconButton';
import ThemeToggle from '../ui/ThemeToggle';
import Logo from "../../assets/logo.svg?react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { LuLogIn, LuLogOut, LuMenu, LuCircleHelp, LuFileText, LuShield, LuScrollText, LuMail, LuDatabase } from "react-icons/lu";
import { FaUser, FaHome } from "react-icons/fa";
import { FaPersonCirclePlus } from "react-icons/fa6";
import { PiPathBold } from "react-icons/pi";

const isPage = (currentPage, targetPage) => {
    return currentPage === targetPage ? "active" : "";
};

const CONTEXTUAL_PAGES = {
    "faq": { to: "/faq", label: "FAQ", Icon: LuCircleHelp },
    "donnees": { to: "/donnees", label: "Sources des données", Icon: LuDatabase },
    "mentions-legales": { to: "/mentions-legales", label: "Mentions légales", Icon: LuFileText },
    "confidentialite": { to: "/confidentialite", label: "Politique de confidentialité", Icon: LuShield },
    "conditions-utilisation": { to: "/conditions-utilisation", label: "Conditions d'utilisation", Icon: LuScrollText },
    "contact": { to: "/contact", label: "Contact", Icon: LuMail },
    "profil": { to: "/profil", label: "Profil", Icon: FaUser, mobile: false },
};

const PATH_TO_PAGE = {
    "/": "home",
    "/itineraire": "itineraire",
    "/faq": "faq",
    "/donnees": "donnees",
    "/mentions-legales": "mentions-legales",
    "/confidentialite": "confidentialite",
    "/conditions-utilisation": "conditions-utilisation",
    "/contact": "contact",
    "/login": "login",
    "/forgot-password": "login",
    "/signin": "signin",
    "/profil": "profil",
    "/admin": "admin",
};

const CONTEXTUAL_EXIT_MS = 200;

const ProfileButton = ({ className, onClick }) => {
    return (
        <button id="profile-button" className={className} onClick={onClick} aria-label="Menu profil" aria-haspopup="true">
            <FaUser size={20} />
        </button>
    );
};

const Header = () => {
    const { user, logoutAuth } = useAuth();
    const { mode, setMode } = useTheme();
    const [isProfileMenuOpen, setisProfileMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const page = PATH_TO_PAGE[pathname] ?? "";

    const [contextual, setContextual] = useState(() => (CONTEXTUAL_PAGES[page] ? page : null));
    const [isContextualLeaving, setIsContextualLeaving] = useState(false);
    const contextualRef = useRef(contextual);
    contextualRef.current = contextual;

    useEffect(() => {
        if (CONTEXTUAL_PAGES[page]) {
            setContextual(page);
            setIsContextualLeaving(false);
            return undefined;
        }
        if (!contextualRef.current) {
            return undefined;
        }
        setIsContextualLeaving(true);
        const timer = setTimeout(() => {
            setContextual(null);
            setIsContextualLeaving(false);
        }, CONTEXTUAL_EXIT_MS);
        return () => clearTimeout(timer);
    }, [page]);

    useEffect(() => {
        setIsMobileMenuOpen(false);
        setisProfileMenuOpen(false);
    }, [pathname]);

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
                {contextual && (
                    <LinkButton
                        to={CONTEXTUAL_PAGES[contextual].to}
                        className={`active nav-contextual${isContextualLeaving ? " nav-contextual-out" : ""}`}
                    >
                        {CONTEXTUAL_PAGES[contextual].label}
                    </LinkButton>
                )}
            </nav>
            <div className='header-user-section media-large'>
                <ThemeToggle compact value={mode} onChange={setMode} />
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
                aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                <LuMenu size={24} />
            </IconButton>

            {isMobileMenuOpen && (
                <div className="dropdown mobile-dropdown media-small">
                    <div className="dropdown-theme-toggle">
                        <ThemeToggle value={mode} onChange={setMode} />
                    </div>
                    <hr className="dropdown-divider" />
                    <button className="dropdown-item" onClick={() => navigate("/")}>
                        <FaHome /> Accueil
                    </button>
                    <button className="dropdown-item" onClick={() => navigate("/itineraire")}>
                        <PiPathBold /> Itinéraires
                    </button>
                    {CONTEXTUAL_PAGES[page] && CONTEXTUAL_PAGES[page].mobile !== false && (() => {
                        const { to, label, Icon } = CONTEXTUAL_PAGES[page];
                        return (
                            <button className="dropdown-item" onClick={() => navigate(to)}>
                                <Icon /> {label}
                            </button>
                        );
                    })()}
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
