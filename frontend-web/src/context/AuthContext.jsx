import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [userBikes, setUserBikes] = useState([]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('access_token');
        const storedBikes = localStorage.getItem('bikes');
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
    }, []);

    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    }

    const updateBikes = (bikesData) => {
        setUserBikes(bikesData);
        localStorage.setItem('bikes', JSON.stringify(bikesData));
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
    };

    return (
        <AuthContext.Provider value={{ user, token, userBikes, loginAuth, logoutAuth, updateUser, updateBikes }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
