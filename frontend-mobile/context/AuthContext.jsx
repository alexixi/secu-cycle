import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { useRouter } from 'expo-router';
import { syncProfileLanguage } from '../services/profileLanguage';
import { saveAccessToken, getAccessToken, saveRefreshToken, clearTokens } from '../services/tokenStorage';
import { clearPendingDestination } from '../services/pendingDestination';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [bikes, setBikes] = useState([]);
    const [historic, setHistoric] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const loadStorageData = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                const storedToken = await getAccessToken();
                const storedBikes = await AsyncStorage.getItem('bikes');
                const storedHistoric = await AsyncStorage.getItem('historic');
                if (storedUser) setUser(JSON.parse(storedUser));
                if (storedToken) setToken(storedToken);
                if (storedBikes) setBikes(JSON.parse(storedBikes));
                if (storedHistoric) setHistoric(JSON.parse(storedHistoric));
            } catch (error) {
                console.error("Erreur de chargement du stockage", error);
            }
        };
        loadStorageData();
    }, []);

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('force-logout', async () => {
            await logoutAuth();
            router.replace('/login');
        });

        return () => {
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('token-refreshed', (newToken) => {
            setToken(newToken);
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const updateUser = async (userData) => {
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        const langue = await syncProfileLanguage();
        if (langue) setUser((actuel) => ({ ...actuel, language: langue }));
    }

    const updateBikes = async (bikesData) => {
        setBikes(bikesData);
        await AsyncStorage.setItem('bikes', JSON.stringify(bikesData));
    }

    const updateHistoric = async (historicData) => {
        setHistoric(historicData);
        await AsyncStorage.setItem('historic', JSON.stringify(historicData));
    }

    const loginAuth = async (newToken, refreshToken) => {
        setToken(newToken);
        await saveAccessToken(newToken);
        if (refreshToken) {
            await saveRefreshToken(refreshToken);
        }
    };

    const logoutAuth = async () => {
        clearPendingDestination();
        setUser(null);
        setToken(null);
        setBikes([]);
        setHistoric([]);
        await clearTokens();
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('bikes');
        await AsyncStorage.removeItem('historic');
    };

    return (
        <AuthContext.Provider value={{ user, token, bikes, historic, loginAuth, logoutAuth, updateUser, updateBikes, updateHistoric }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
