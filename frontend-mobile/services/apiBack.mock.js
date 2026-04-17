// Simulation des requêtes vers le backend pour le développement frontend sans dépendance au backend

export async function calculateItineraries(token, start, end, bikeType, maxDuration) {
    console.log("Calcul des itinéraires entre", start, "et", end, "avec le vélo de type", bikeType, "et une durée maximale de", maxDuration, "minutes");

    // Simuler un délai de réponse du backend
    await new Promise(resolve => setTimeout(resolve, 500));

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
            percent_bike_lane: 0.8,
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
            percent_bike_lane: 0.3,
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
            percent_bike_lane: 0.5,
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
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
        access_token: "fake_token_12345",
        token_type: "bearer",
        expires_in: 3600
    };
}

export async function register(firstName, lastName, birthdate, email, password) {
    await new Promise(resolve => setTimeout(resolve, 500));
}

export async function getUserProfile(token) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
        id: 1,
        first_name: "Henri",
        last_name: "Dupond",
        email: "henri.dupond@example.com",
        birth_date: "1990-01-01",
        sport_level: "intermédiaire",
        home_address: "12 Avenue Carnot 33200 Bordeaux",
        work_address: "1 Avenue des Facultes 33400 Talence"
    };
}

export async function changeProfileInfo(token, firstName, lastName, email, birthDate, password, level) {
    await new Promise(resolve => setTimeout(resolve, 500));
}

export async function changeAddress(token, homeAddress, workAddress) {
    await new Promise(resolve => setTimeout(resolve, 500));
}

export async function getUserBikes(token) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
        {
            id: 1,
            name: "Mon VTT électrique",
            type: "VTT",
            isElectric: true
        },
        {
            id: 2,
            name: "Mon vélo de route",
            type: "Route",
            isElectric: false
        }
    ];
}

export async function addBike(token, name, type, isElectric) {
    await new Promise(resolve => setTimeout(resolve, 500));
}

export async function suppressBike(token, bike) {
    await new Promise(resolve => setTimeout(resolve, 500));
}

export async function getUserHistoric(token) {
    await new Promise(resolve => setTimeout(resolve, 250));
    return [
        {
            "route_id": 0,
            "action_type": "string",
            "id": 1,
            "user_id": 0,
            "created_at": "2026-04-04T14:20:39.484Z",
            "route": {
                "start_coordinates": {
                    "lat": 44.8378,
                    "lon": -0.5795
                },
                "end_coordinates": {
                    "lat": 44.8526,
                    "lon": -0.5669
                },
                "start_address": "Avenue de Collegno 33400 Talence",
                "end_address": "12 Rue du Commandant Arnould 33000, Bordeaux",
                "route_type": "safe",
                "distance_km": 12.34,
                "duration_min": 10.12,
                "safety_score": 8.5,
                "id": 0,
                "user_id": 0,
                "created_at": "2026-04-04T14:20:39.484Z",
                "path": [
                    { "lat": 44.8378, "lon": -0.5795 },
                    { "lat": 44.8400, "lon": -0.5750 },
                    { "lat": 44.8450, "lon": -0.5700 },
                    { "lat": 44.8526, "lon": -0.5669 }
                ]
            }
        },
        {
            "route_id": 0,
            "action_type": "string",
            "id": 2,
            "user_id": 0,
            "created_at": "2026-04-04T14:20:39.484Z",
            "route": {
                "start_coordinates": {
                    "lat": 44.8378,
                    "lon": -0.5795
                },
                "end_coordinates": {
                    "lat": 44.8526,
                    "lon": -0.5669
                },
                "start_address": "Avenue de Collegno 33400 Talence",
                "end_address": "12 Rue du Commandant Arnould 33000, Bordeaux",
                "route_type": "safe",
                "distance_km": 12.34,
                "duration_min": 10.12,
                "safety_score": 8.5,
                "id": 0,
                "user_id": 0,
                "created_at": "2026-04-04T14:20:39.484Z",
                "path": [
                    { "lat": 44.8378, "lon": -0.5795 },
                    { "lat": 44.8400, "lon": -0.5750 },
                    { "lat": 44.8450, "lon": -0.5700 },
                    { "lat": 44.8526, "lon": -0.5669 }
                ]
            }
        },
        {
            "route_id": 0,
            "action_type": "string",
            "id": 3,
            "user_id": 0,
            "created_at": "2026-04-04T14:20:39.484Z",
            "route": {
                "start_coordinates": {
                    "lat": 44.8378,
                    "lon": -0.5795
                },
                "end_coordinates": {
                    "lat": 44.8526,
                    "lon": -0.5669
                },
                "start_address": "Avenue de Collegno 33400 Talence",
                "end_address": "12 Rue du Commandant Arnould 33000, Bordeaux",
                "route_type": "safe",
                "distance_km": 12.34,
                "duration_min": 10.12,
                "safety_score": 8.5,
                "id": 0,
                "user_id": 0,
                "created_at": "2026-04-04T14:20:39.484Z",
                "path": [
                    { "lat": 44.8378, "lon": -0.5795 },
                    { "lat": 44.8400, "lon": -0.5750 },
                    { "lat": 44.8450, "lon": -0.5700 },
                    { "lat": 44.8526, "lon": -0.5669 }
                ]
            }
        }
    ]
}

export async function deleteHistoricEntry(token, historyId) {
    await new Promise(resolve => setTimeout(resolve, 500));
}
