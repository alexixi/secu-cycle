import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from "react-router";
import { langFromPathname, matchPath, pathFor } from "../../i18n/routes";
import './Header.css';
import LinkButton from '../ui/LinkButton';
import IconButton from '../ui/IconButton';
import ThemeToggle from '../ui/ThemeToggle';
import Logo from "../../assets/logo.svg?react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { LuLogIn, LuLogOut, LuMenu, LuCircleHelp, LuFileText, LuShield, LuScrollText, LuMail, LuDatabase, LuMap } from "react-icons/lu";
import { FaUser, FaHome } from "react-icons/fa";
import { FaPersonCirclePlus } from "react-icons/fa6";
import { PiPathBold } from "react-icons/pi";

const isPage = (currentPage, targetPage) => {
    return currentPage === targetPage ? "active" : "";
};

// Indexé par clé de route : le chemin est résolu au rendu, dans la langue
// courante, plutôt que codé en dur ici.
const CONTEXTUAL_PAGES = {
    carteHub: { label: "Cartes par ville", Icon: LuMap },
    faq: { label: "FAQ", Icon: LuCircleHelp },
    donnees: { label: "Sources des données", Icon: LuDatabase },
    mentionsLegales: { label: "Mentions légales", Icon: LuFileText },
    confidentialite: { label: "Politique de confidentialité", Icon: LuShield },
    conditions: { label: "Conditions d'utilisation", Icon: LuScrollText },
    contact: { label: "Contact", Icon: LuMail },
    profil: { label: "Profil", Icon: FaUser, mobile: false },
};

// Routes qui allument la même entrée de navigation qu'une autre : les trois
// pages carte partagent un seul onglet, et le mot de passe oublié garde le
// bouton « Connexion » actif.
const PAGE_ALIASES = {
    forgotPassword: "login",
    carteVille: "carteHub",
    carteTheme: "carteHub",
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
    const lang = langFromPathname(pathname);
    const routeKey = matchPath(pathname)?.routeKey ?? "";
    const page = PAGE_ALIASES[routeKey] ?? routeKey;

    // Raccourci de navigation : la langue courante est appliquée une fois ici,
    // au lieu d'être répétée à chaque appel.
    const go = (cle) => navigate(pathFor(cle, lang));

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
            <span id="header-logo-title" onClick={() => go("home")}>
                <Logo id="header-logo" />
                <div id="header-title">Sécu'Cycle</div>
            </span>
            <nav className='media-large'>
                <LinkButton to={pathFor("home", lang)} className={isPage(page, "home")}>Accueil</LinkButton>
                <LinkButton to={pathFor("itineraire", lang)} className={isPage(page, "itineraire")}>Itinéraire</LinkButton>
                {contextual && (
                    <LinkButton
                        to={pathFor(contextual, lang)}
                        className={`active nav-contextual${isContextualLeaving ? " nav-contextual-out" : ""}`}
                    >
                        {CONTEXTUAL_PAGES[contextual].label}
                    </LinkButton>
                )}
            </nav>
            <div className='header-user-section media-large'>
                <ThemeToggle compact value={mode} onChange={setMode} />
                {user
                    ? <div className="user-connected" onClick={() => go("profil")}>
                        {user.first_name}
                      </div>
                    : <LinkButton to={pathFor("login", lang)} className={isPage(page, "login")}>Connexion</LinkButton>
                }
                <ProfileButton
                    className={isProfileMenuOpen || page in ["profil", "login", "signin"] ? 'active' : ''}
                    onClick={() => setisProfileMenuOpen(!isProfileMenuOpen)}
                />
            </div>

            {isProfileMenuOpen && user && (
                <div className="dropdown profile-dropdown">
                    <button className="dropdown-item" onClick={() => go("profil")}>
                        <FaUser /> Mon Profil
                    </button>
                    <button className="dropdown-item logout-btn" onClick={() => { logoutAuth(); setisProfileMenuOpen(false); }}>
                        <LuLogOut /> Se déconnecter
                    </button>
                </div>
            )}

            {isProfileMenuOpen && !user && (
                <div className="dropdown profile-dropdown">
                    <button className="dropdown-item" onClick={() => go("login")}>
                        <LuLogIn /> Se connecter
                    </button>
                    <button className="dropdown-item" onClick={() => go("signin")}>
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
                    <button className="dropdown-item" onClick={() => go("home")}>
                        <FaHome /> Accueil
                    </button>
                    <button className="dropdown-item" onClick={() => go("itineraire")}>
                        <PiPathBold /> Itinéraires
                    </button>
                    {CONTEXTUAL_PAGES[page] && CONTEXTUAL_PAGES[page].mobile !== false && (() => {
                        const { label, Icon } = CONTEXTUAL_PAGES[page];
                        return (
                            <button className="dropdown-item" onClick={() => go(page)}>
                                <Icon /> {label}
                            </button>
                        );
                    })()}
                    <hr className="dropdown-divider" />
                    {user ? (
                        <>
                            <button className="dropdown-item" onClick={() => go("profil")}>
                                <FaUser /> Mon Profil
                            </button>
                            <button className="dropdown-item logout-btn" onClick={() => { logoutAuth(); setIsMobileMenuOpen(false); }}>
                                <LuLogOut /> Se déconnecter
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="dropdown-item" onClick={() => go("login")}>
                                <LuLogIn /> Se connecter
                            </button>
                            <button className="dropdown-item" onClick={() => go("signin")}>
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
