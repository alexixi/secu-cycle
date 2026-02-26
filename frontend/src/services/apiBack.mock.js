// Simulation des requêtes vers le backend pour le développement frontend sans dépendance au backend

export async function calculateItineraries(start, end, bikeType) {
    console.log("Calcul des itinéraires entre", start, "et", end, "avec le vélo de type", bikeType);

    // Simuler un délai de réponse du backend
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Générer des itinéraires fictifs pour les tests
    // On calcule les différences pour faire des proportions
    const dLat = end.lat - start.lat;
    const dLon = end.lon - start.lon;

    const itineraries = [
        {
            id: "secure",
            name: "Sécurisé",
            score: 0.95,
            distance: 5.2,
            duration: 25,
            path: [
                { lat: start.lat, lon: start.lon },
                { lat: start.lat + dLat * 0.2 + 0.003, lon: start.lon + dLon * 0.2 - 0.003 },
                { lat: start.lat + dLat * 0.5 + 0.004, lon: start.lon + dLon * 0.5 - 0.004 },
                { lat: start.lat + dLat * 0.8 + 0.003, lon: start.lon + dLon * 0.8 - 0.003 },
                { lat: end.lat, lon: end.lon }
            ]
        },
        {
            id: "fast",
            name: "Rapide",
            score: 0.4,
            distance: 4.5,
            duration: 18,
            path: [
                { lat: start.lat, lon: start.lon },
                { lat: start.lat + dLat * 0.33, lon: start.lon + dLon * 0.33 },
                { lat: start.lat + dLat * 0.66, lon: start.lon + dLon * 0.66 },
                { lat: end.lat, lon: end.lon }
            ]
        },
        {
            id: "balanced",
            name: "Meilleur compromis",
            score: 0.75,
            distance: 4.8,
            duration: 21,
            path: [
                { lat: start.lat, lon: start.lon },
                { lat: start.lat + dLat * 0.25 + 0.001, lon: start.lon + dLon * 0.25 - 0.001 },
                { lat: start.lat + dLat * 0.5 + 0.0015, lon: start.lon + dLon * 0.5 - 0.0015 },
                { lat: start.lat + dLat * 0.75 + 0.001, lon: start.lon + dLon * 0.75 - 0.001 },
                { lat: end.lat, lon: end.lon }
            ]
        }
    ];
    console.log("Itinéraires simulés :", itineraries);
    return itineraries;
}

export async function login(email, password) {

    // Simuler un délai de réponse du backend
    await new Promise(resolve => setTimeout(resolve, 1500));

    return true;
}
