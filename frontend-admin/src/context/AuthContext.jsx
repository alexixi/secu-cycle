import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { login as apiLogin, getMe } from "../services/apiBack";

const AuthContext = createContext();

const readStoredUser = () => {
    const raw = localStorage.getItem("admin_user");
    if (!raw || raw === "undefined" || raw === "null") return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(readStoredUser);
    const [token, setToken] = useState(() => localStorage.getItem("access_token"));
    // `booting` : on revalide le token stocké au démarrage avant d'afficher l'app.
    const [booting, setBooting] = useState(() => !!localStorage.getItem("access_token"));

    const logout = useCallback(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("admin_user");
        setToken(null);
        setUser(null);
    }, []);

    // Connexion : n'autorise l'accès qu'aux comptes administrateurs.
    const login = useCallback(async (email, password) => {
        const tokens = await apiLogin(email, password);
        const profile = await getMe(tokens.access_token);
        if (!profile.is_admin) {
            const err = new Error("Accès réservé aux administrateurs.");
            err.code = "NOT_ADMIN";
            throw err;
        }
        localStorage.setItem("access_token", tokens.access_token);
        if (tokens.refresh_token) {
            localStorage.setItem("refresh_token", tokens.refresh_token);
        }
        localStorage.setItem("admin_user", JSON.stringify(profile));
        setToken(tokens.access_token);
        setUser(profile);
        return profile;
    }, []);

    // Revalidation du token au démarrage.
    useEffect(() => {
        let cancelled = false;
        const stored = localStorage.getItem("access_token");
        if (!stored) {
            setBooting(false);
            return;
        }
        getMe(stored)
            .then((profile) => {
                if (cancelled) return;
                if (!profile.is_admin) {
                    logout();
                    return;
                }
                localStorage.setItem("admin_user", JSON.stringify(profile));
                setUser(profile);
            })
            .catch(() => {
                if (!cancelled) logout();
            })
            .finally(() => {
                if (!cancelled) setBooting(false);
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Le client API émet cet événement quand le refresh échoue (session expirée).
    useEffect(() => {
        const handleForceLogout = () => logout();
        const handleTokenRefreshed = (e) => setToken(e.detail);
        window.addEventListener("admin-force-logout", handleForceLogout);
        window.addEventListener("token-refreshed", handleTokenRefreshed);
        return () => {
            window.removeEventListener("admin-force-logout", handleForceLogout);
            window.removeEventListener("token-refreshed", handleTokenRefreshed);
        };
    }, [logout]);

    return (
        <AuthContext.Provider value={{ user, token, booting, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
