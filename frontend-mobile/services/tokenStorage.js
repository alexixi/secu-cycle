import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

export async function saveAccessToken(token) {
    await SecureStore.setItemAsync(ACCESS_KEY, token);
}

export async function getAccessToken() {
    return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function saveRefreshToken(token) {
    await SecureStore.setItemAsync(REFRESH_KEY, token);
}

export async function getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function clearTokens() {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
}
