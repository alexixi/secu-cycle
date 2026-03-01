export async function calculateItineraries(start, end, bikeType, maxDuration) {
    try {
        const response = await fetch("/api/itineraries", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                start_lat: start.lat,
                start_lon: start.lon,
                end_lat: end.lat,
                end_lon: end.lon,
                bike_type: bikeType,
                max_duration: maxDuration
            })
        });

        if (!response.ok) {
            console.error("Erreur HTTP API Itinéraires : ", response.status, response.statusText);
            return null;
        }

        const data = await response.json();
        return data.itineraries;

    } catch (error) {
        console.error("Erreur de la récupération des itinéraires : ", error);
        return null;
    }
}

export async function login(email, password) {
    try {
        const response = await fetch("/api/users/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                username: email,
                password: password
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData.detail || "Erreur lors de la connexion");
        }

        console.log("Réponse du serveur login : ", response);

        const data = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
}

export async function register(name, birthdate, email, password) {
    try {
        const response = await fetch("/api/users/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                first_name: name,
                last_name: "test",
                birth_date: birthdate,
                email: email,
                password: password,
                sport_level: "test",
                home_adress: "test",
                work_adress: "test",
            })
        });
        console.log("Réponse du serveur register : ", response);
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData.detail || "Erreur lors de la création du compte");
        }

        const data = await response.json();
        return data;

    } catch (error) {
        throw error;
    }

}

export async function getUserProfile(token) {
    try {
        const response = await fetch("/api/users/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData.detail || "Erreur lors de la récupération du profil");
        }

        const data = await response.json();
        return data;

    } catch (error) {
        throw error;
    }
}
