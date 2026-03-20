const API_URL = "https://api-adresse.data.gouv.fr/search/";

export const searchAddressAutocomplete = async (query) => {
    if (!query) return [];

    query = query.trim();
    if (query.length < 3) return [];

    const params = new URLSearchParams({
        q: query,
        limit: "5",
        autocomplete: "1",
        lat: "44.8378",
        lon: "-0.5795"
    });

    try {
        const response = await fetch(`${API_URL}?${params}`);

        if (!response.ok) {
            console.error("Erreur HTTP API BAN : ", response.status, response.statusText);
            return [];
        }

        const data = await response.json();

        if (!data || !data.features) {
            console.warn("Réponse API inattendue (Pas de features) : ", data);
            return [];
        }

        if (data.features.length === 0) {
            return [{id: "no-result", name: "Aucun résultat trouvé", display_name: "Aucun résultat trouvé", lat: 0, lon: 0 }];
        }

        return data.features.map((feature) => ({
            id: feature.properties.id,
            lat: feature.geometry.coordinates[1],
            lon: feature.geometry.coordinates[0],
            display_name: feature.properties.label,
            name: feature.properties.name,
            city: feature.properties.city,
            postcode: feature.properties.postcode
        }));

    } catch (error) {
        console.error("Erreur technique (Fetch) : ", error);
        return [];
    }
};

export const getCoordinatesFromAddress = async (address) => {
    if (!address) return null;

    const params = new URLSearchParams({
        q: address.trim(),
        limit: "1"
    });

    try {
        const response = await fetch(`${API_URL}?${params}`);

        if (!response.ok) {
            console.error("Erreur HTTP API BAN (Coordonnées) : ", response.status);
            return null;
        }

        const data = await response.json();

        if (!data || !data.features || data.features.length === 0) {
            console.warn("Aucune coordonnée trouvée pour l'adresse : ", address);
            return null;
        }

        const bestMatch = data.features[0];

        return {
            id: bestMatch.properties.id,
            lat: bestMatch.geometry.coordinates[1],
            lon: bestMatch.geometry.coordinates[0],
            display_name: bestMatch.properties.label,
            name: bestMatch.properties.name,
            city: bestMatch.properties.city,
            postcode: bestMatch.properties.postcode
        };

    } catch (error) {
        console.error("Erreur technique lors de la récupération des coordonnées : ", error);
        return null;
    }
};
