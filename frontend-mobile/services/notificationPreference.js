import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export const NOTIFICATIONS_KEY = 'userNotificationsEnabled';

let cachedEnabled = null;

export async function areNotificationsEnabled() {
    if (cachedEnabled !== null) return cachedEnabled;

    try {
        const saved = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
        cachedEnabled = saved === null ? true : saved === 'true';
    } catch {
        cachedEnabled = true;
    }
    return cachedEnabled;
}

export async function setNotificationsEnabled(enabled) {
    cachedEnabled = enabled;
    try {
        await AsyncStorage.setItem(NOTIFICATIONS_KEY, String(enabled));
    } catch (e) {
        console.warn('Préférence de notifications non sauvegardée :', e);
    }
}

// Préférence distincte de celle du guidage : on peut vouloir la notification de
// navigation sans être alerté d'une averse, et réciproquement.
export const WEATHER_ALERTS_KEY = 'userWeatherAlerts';

let cachedWeatherAlerts = null;

export async function areWeatherAlertsEnabled() {
    if (cachedWeatherAlerts !== null) return cachedWeatherAlerts;

    try {
        const saved = await AsyncStorage.getItem(WEATHER_ALERTS_KEY);
        cachedWeatherAlerts = saved === null ? true : saved === 'true';
    } catch {
        cachedWeatherAlerts = true;
    }
    return cachedWeatherAlerts;
}

export async function setWeatherAlertsEnabled(enabled) {
    cachedWeatherAlerts = enabled;
    try {
        await AsyncStorage.setItem(WEATHER_ALERTS_KEY, String(enabled));
    } catch (e) {
        console.warn('Préférence d\'alertes météo non sauvegardée :', e);
    }
}

export async function getNotificationPermission() {
    try {
        const { status } = await Notifications.getPermissionsAsync();
        return status;
    } catch {
        return 'undetermined';
    }
}

export async function requestNotificationPermission() {
    try {
        const { status } = await Notifications.requestPermissionsAsync();
        return status;
    } catch {
        return 'denied';
    }
}
