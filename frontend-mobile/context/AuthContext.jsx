import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { useRouter } from 'expo-router';

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
                const storedToken = await AsyncStorage.getItem('access_token');
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

    const updateUser = async (userData) => {
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
    }

    const updateBikes = async (bikesData) => {
        setBikes(bikesData);
        await AsyncStorage.setItem('bikes', JSON.stringify(bikesData));
    }

    const updateHistoric = async (historicData) => {
        setHistoric(historicData);
        await AsyncStorage.setItem('historic', JSON.stringify(historicData));
    }

    const loginAuth = async (newToken) => {
        setToken(newToken);
        await AsyncStorage.setItem('access_token', newToken);
    };

    const logoutAuth = async () => {
        setUser(null);
        setToken(null);
        setBikes([]);
        setHistoric([]);
        await AsyncStorage.removeItem('access_token');
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
