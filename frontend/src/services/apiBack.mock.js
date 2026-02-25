// Simulation des requêtes vers le backend pour le développement frontend sans dépendance au backend

export async function calculateItineraries(start, end) {
    console.log("Calcul des itinéraires entre", start, "et", end);

    // Simuler un délai de réponse du backend
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Générer des itinéraires fictifs pour les tests
    const itineraries = [
        [
            { lat: start.lat, lon: start.lon },
            { lat: (start.lat + end.lat) / 2 - 0.01, lon: (start.lon + end.lon) / 2 + 0.01 },
            { lat: end.lat, lon: end.lon }
        ],
        [
            { lat: start.lat, lon: start.lon },
            { lat: (start.lat + end.lat) / 2 + 0.01, lon: (start.lon + end.lon) / 2 - 0.01 },
            { lat: end.lat, lon: end.lon }
        ]
    ];

    console.log("Itinéraires simulés :", itineraries);
    return itineraries;
}

export async function login(email, password) {

    // Simuler un délai de réponse du backend
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return true;    
}