const BASE_API_URL = "localhost:8000"

export async function calculateItineraries(token, start, end, bikeType, maxDuration) {
    try {
        const response = await fetch(`${BASE_API_URL}/routes/route`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                start_lat: start.lat,
                start_lon: start.lon,
                end_lat: end.lat,
                end_lon: end.lon,
                bike_type: bikeType,
                temps_max_min: maxDuration
            })
        });

        if (!response.ok) {
            console.error("Erreur HTTP API Itinéraires : ", response.status, response.statusText);
            return null;
        }

        const data = await response.json();
        return data.routes;

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

export async function register(firstName, lastName, birthdate, email, password) {
    try {
        const response = await fetch("/api/users/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                birth_date: birthdate,
                email: email,
                password: password,
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

export async function changeProfileInfo(token, firstName, lastName, email, birthDate, password, level) {
    try {
        const response = await fetch("/api/users/me", {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                email: email,
                birth_date: birthDate,
                password: password,
                sport_level: level
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData.detail || "Erreur lors de la modification du profil");
        }

        const data = await response.json();
        return data;

    } catch (error) {
        throw error;
    }
}

export async function changeAddress(token, homeAddress, workAddress) {
    try {
        const response = await fetch("/api/users/me", {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                home_address: homeAddress,
                work_address: workAddress
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData.detail || "Erreur lors de la modification des adresses");
        }

        const data = await response.json();
        return data;

    } catch (error) {
        throw error;
    }
}

export async function addBike(token, name, type, isElectric) {
    try {
        const response = await fetch("/api/bikes/", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                type: type,
                is_electric: isElectric
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData.detail || "Erreur lors de l'ajout du vélo");
        }

        const data = await response.json();
        return data;

    } catch (error) {
        throw error;
    }
}

export async function suppressBike(token, bike) {
    try {
        const response = await fetch(`/api/bikes/${bike.id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData.detail || "Erreur lors de la suppression du vélo");
        }

        return response.json();

    } catch (error) {
        throw error;
    }
}
