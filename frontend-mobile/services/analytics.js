import { init as aptabaseInit, trackEvent as aptabaseTrackEvent } from '@aptabase/react-native';

const APP_KEY = process.env.EXPO_PUBLIC_APTABASE_KEY;
const HOST = process.env.EXPO_PUBLIC_APTABASE_HOST;

let enabled = false;

export function initAnalytics() {
    if (!APP_KEY || enabled) return;
    aptabaseInit(APP_KEY, HOST ? { host: HOST } : undefined);
    enabled = true;
}

export function trackEvent(name, props) {
    if (!enabled) return;
    try {
        aptabaseTrackEvent(name, props);
    } catch (e) {
        console.warn('Analytics indisponible :', e);
    }
}

export function trackScreen(pathname) {
    trackEvent('screen_view', { screen: pathname });
}
