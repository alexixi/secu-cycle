import { apiFetch } from "./apiBack";

export const searchAddressAutocomplete = async (query) => {
    if (!query || query.trim().length < 3) return [];

    try {
        const results = await apiFetch(
            `/geo/search?q=${encodeURIComponent(query.trim())}`,
            { method: "GET" }
        );
        return results.slice(0, 3);
    } catch (error) {
        console.error("Erreur lors de la recherche d'adresse : ", error);
        return [];
    }
};
