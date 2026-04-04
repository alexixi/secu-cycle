import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [userBikes, setUserBikes] = useState([]);
    const [historic, setHistoric] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('access_token');
        const storedBikes = localStorage.getItem('bikes');
        const storedHistoric = localStorage.getItem('historic');
        if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
            setUser(JSON.parse(storedUser));
        } else {
            localStorage.removeItem('user');
            setUser(null);
        }
        if (storedToken && storedToken !== "undefined" && storedToken !== "null") {
            setToken(storedToken);
        } else {
            localStorage.removeItem('access_token');
            setToken(null);
        }
        if (storedBikes && storedBikes !== "undefined" && storedBikes !== "null") {
            setUserBikes(JSON.parse(storedBikes));
        } else {
            localStorage.removeItem('bikes');
            setUserBikes([]);
        }
        if (storedHistoric && storedHistoric !== "undefined" && storedHistoric !== "null") {
            setHistoric(JSON.parse(storedHistoric));
        } else {
            localStorage.removeItem('historic');
            setHistoric([]);
        }
    }, []);

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

    const loginAuth = (token) => {
        localStorage.setItem('access_token', token);
        setToken(token);
    };

    const logoutAuth = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('bikes');
        setUser(null);
        setToken(null);
        setUserBikes([]);
        setHistoric([]);
        navigate("/login");
    };

    useEffect(() => {
        const handleForceLogout = () => {
            console.log("Session expired, logging out...");
            localStorage.removeItem('access_token');
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
