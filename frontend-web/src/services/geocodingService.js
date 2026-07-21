import { apiFetch } from "./apiBack";

const IP_LOCATION_API_URL = "https://ipapi.co/json/";

export const getApproxLocationFromIp = async () => {
    try {
        const response = await fetch(IP_LOCATION_API_URL);

        if (!response.ok) {
            console.error("Erreur HTTP API géoloc IP : ", response.status);
            return null;
        }

        const data = await response.json();
        const lat = Number(data.latitude);
        const lon = Number(data.longitude);

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

        return { lat, lon, city: data.city };

    } catch (error) {
        console.error("Erreur technique lors de la géolocalisation IP : ", error);
        return null;
    }
};

export const searchAddressAutocomplete = async (query) => {
    if (!query) return [];

    query = query.trim();
    if (query.length < 3) return [];

    try {
        return await apiFetch(`/geo/search?q=${encodeURIComponent(query)}`, { method: "GET" });
    } catch (error) {
        console.error("Erreur lors de la recherche d'adresse : ", error);
        return [];
    }
};

export const getCoordinatesFromAddress = async (address) => {
    if (!address) return null;

    const results = await searchAddressAutocomplete(address);
    return results.length > 0 ? results[0] : null;
};

export const getAddressFromCoordinates = async (lat, lon) => {
    if (lat === null || lat === undefined || lon === null || lon === undefined) return null;

    try {
        return await apiFetch(`/geo/reverse?lat=${lat}&lon=${lon}`, { method: "GET" });
    } catch (error) {
        // 404 = pas d'adresse à cet endroit : c'est un cas normal, pas une panne.
        if (error.status !== 404) {
            console.error("Erreur lors du géocodage inverse : ", error);
        }
        return null;
    }
};
