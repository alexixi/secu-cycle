import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from "react-router";
import { useLocalizedPath } from '../i18n/useLang';
import i18n from '../i18n/index';
import { setProfileLanguage } from '../services/apiBack';

const AuthContext = createContext();

const readStored = (key, { parse = false, fallback = null } = {}) => {
    const raw = localStorage.getItem(key);
    if (!raw || raw === "undefined" || raw === "null") {
        return fallback;
    }
    if (!parse) {
        return raw;
    }
    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
};

export const AuthProvider = ({ children }) => {
    const path = useLocalizedPath();
    const [user, setUser] = useState(() => readStored('user', { parse: true }));
    const [token, setToken] = useState(() => readStored('access_token'));
    const [userBikes, setUserBikes] = useState(() => readStored('bikes', { parse: true, fallback: [] }));
    const [historic, setHistoric] = useState(() => readStored('historic', { parse: true, fallback: [] }));
    const navigate = useNavigate();

    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    }

    const updateBikes = (bikesData) => {
        setUserBikes(bikesData);
        localStorage.setItem('bikes', JSON.stringify(bikesData));
    }

    const updateHistoric = (historicData) => {
        setHistoric(historicData);
        localStorage.setItem('historic', JSON.stringify(historicData));
    }

    const loginAuth = (token, refreshToken) => {
        localStorage.setItem('access_token', token);
        if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
        }
        setToken(token);
    };

    const logoutAuth = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('bikes');
        localStorage.removeItem('historic');
        setUser(null);
        setToken(null);
        setUserBikes([]);
        setHistoric([]);
        navigate(path("login"));
    };

    useEffect(() => {
        const handleTokenRefreshed = (event) => {
            setToken(event.detail);
        };
        window.addEventListener("token-refreshed", handleTokenRefreshed);
        return () => window.removeEventListener("token-refreshed", handleTokenRefreshed);
    }, []);

    useEffect(() => {
        const handleForceLogout = () => {
            console.log("Session expired, logging out...");
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            localStorage.removeItem('bikes');
            localStorage.removeItem('historic');
            setUser(null);
            setToken(null);
            setUserBikes([]);
            setHistoric([]);
            navigate(path("login"), {
                state: {
                    sessionExpired: true,
                    message: i18n.t('compte.sessionExpiree', { ns: 'common' })
                }
            });
        };

        window.addEventListener("force-logout", handleForceLogout);

        return () => {
            window.removeEventListener("force-logout", handleForceLogout);
        };
    }, []);

    // La langue du site vit dans l'URL ; celle des e-mails vit en base. Cet effet
    // est le seul pont entre les deux : sans lui, quelqu'un qui passe sur /en/
    // continuerait de recevoir ses récapitulatifs en français, puisqu'ils partent
    // d'une boucle de fond sans requête d'où lire la langue de la page.
    //
    // Au montage suffit : sur le web, changer de langue est une navigation, donc
    // un rechargement. En échec — hors ligne, session expirée — on ne fait rien :
    // la préférence n'est pas un réglage assez critique pour perturber l'écran.
    useEffect(() => {
        if (!user || !token || !i18n.language) return;
        if (user.language === i18n.language) return;

        const langue = i18n.language;
        setProfileLanguage(token, langue)
            .then(() => updateUser({ ...user, language: langue }))
            .catch(() => { });
    }, [user, token]);

    return (
        <AuthContext.Provider value={{ user, token, userBikes, historic, loginAuth, logoutAuth, updateUser, updateBikes, updateHistoric }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
