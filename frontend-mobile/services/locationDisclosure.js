import AsyncStorage from '@react-native-async-storage/async-storage';

export const BACKGROUND_LOCATION_KEY = 'backgroundLocationDisclosure';

export const ACCEPTED = 'accepted';
export const DECLINED = 'declined';

let cachedChoice;

export async function getBackgroundLocationChoice() {
    if (cachedChoice !== undefined) return cachedChoice;

    try {
        const saved = await AsyncStorage.getItem(BACKGROUND_LOCATION_KEY);
        cachedChoice = saved === ACCEPTED || saved === DECLINED ? saved : null;
    } catch {
        cachedChoice = null;
    }
    return cachedChoice;
}

export async function hasAcceptedBackgroundLocation() {
    return (await getBackgroundLocationChoice()) === ACCEPTED;
}

export async function setBackgroundLocationChoice(choice) {
    cachedChoice = choice;
    try {
        await AsyncStorage.setItem(BACKGROUND_LOCATION_KEY, choice);
    } catch (e) {
        console.warn('Consentement de localisation non sauvegardé :', e);
    }
}
