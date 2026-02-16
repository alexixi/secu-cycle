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
