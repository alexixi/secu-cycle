import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from "react-router-dom";

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
        navigate("/login");
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
            navigate("/login", {
                state: {
                    sessionExpired: true,
                    message: "Votre session a expiré pour des raisons de sécurité. Veuillez vous reconnecter."
                }
            });
        };

        window.addEventListener("force-logout", handleForceLogout);

        return () => {
            window.removeEventListener("force-logout", handleForceLogout);
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, userBikes, historic, loginAuth, logoutAuth, updateUser, updateBikes, updateHistoric }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
