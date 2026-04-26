import { DeviceEventEmitter } from 'react-native';
import Constants from 'expo-constants';

let API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!process.env.EXPO_PUBLIC_API_PORT) {
    console.warn("⚠️ EXPO_PUBLIC_API_PORT n'est pas défini dans le fichier .env ! Utilisation de la valeur par défaut 8000");
}

const API_PORT = process.env.EXPO_PUBLIC_API_PORT || 8000;

if (__DEV__ && Constants.expoConfig?.hostUri) {
    const IP_PC = Constants.expoConfig.hostUri.split(':')[0];
    API_BASE_URL = `http://${IP_PC}`
    console.log("🔌 Connecté automatiquement au backend sur :", API_BASE_URL);
} else if (!API_BASE_URL) {
    console.warn("⚠️ EXPO_PUBLIC_API_URL n'est pas défini dans le fichier .env !");
} else if (!API_BASE_URL.startsWith('http')) {
    console.warn("⚠️ EXPO_PUBLIC_API_URL ne commence pas par http !");
}


export async function apiFetch(endpoint, options = {}, token = null) {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}:${API_PORT}${endpoint}`;

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.text();
        if (response.status === 401 && !url.includes("/login") && errorData.includes("token")) {
            console.warn("Token expiré ! Déconnexion forcée.");
            DeviceEventEmitter.emit("force-logout");
            throw new Error("Session expirée");
        }
        const apiError = new Error(errorData || "Erreur lors de la requête API");
        apiError.status = response.status;
        apiError.statusText = response.statusText;
        throw apiError;
    }

    if (response.status === 204) {
        return { success: true };
    }

    const data = await response.json();
    return data;
}

export async function calculateItineraries(token, start, end, bikeId, maxDuration, startAddress, endAddress) {
    try {
        const body = {
            start_lat: start.lat,
            start_lon: start.lon,
            end_lat: end.lat,
            end_lon: end.lon,
            temps_max_min: maxDuration,
            start_address: startAddress || `${start.lat}, ${start.lon}`,
            end_address: endAddress || `${end.lat}, ${end.lon}`,
        };

        if (Number.isInteger(bikeId)) {
            body.bike_id = bikeId;
        } else if (typeof bikeId === "string" && bikeId.startsWith("default-")) {
            const parts = bikeId.split("-");
            body.bike_type = parts[1];
            body.is_electric = parts[2] === "electric";
        }

        const data = await apiFetch("/routes/route", {
            method: "POST",
            body: JSON.stringify(body)
        }, token);
        return data.routes;
    } catch (error) {
        throw error;
    }
}

export async function login(email, password) {
    try {
        const data = await apiFetch("/users/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                username: email,
                password: password
            }).toString()
        }, null);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function register(firstName, lastName, birthdate, email, password) {
    try {
        const data = await apiFetch("/users/", {
            method: "POST",
            body: JSON.stringify({
                first_name: firstName || null,
                last_name: lastName || null,
                birth_date: birthdate || null,
                email: email,
                password: password,
            })
        }, null);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function getUserProfile(token) {
    try {
        const data = await apiFetch("/users/me", { method: "GET" }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function changeProfileInfo(token, firstName, lastName, email, birthDate, level) {
    try {
        const payload = Object.fromEntries(
            Object.entries({
                first_name: firstName,
                last_name: lastName,
                birth_date: birthDate,
                sport_level: level,
            }).filter(([, v]) => v !== undefined && v !== null && v !== "")
        );
        const data = await apiFetch("/users/me", {
            method: "PATCH",
            body: JSON.stringify(payload),
        }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function changePassword(token, oldPassword, newPassword) {
    const url = new URL("/users/me/password", API_BASE_URL);
    url.searchParams.append("old_password", oldPassword);
    url.searchParams.append("new_password", newPassword);

    try {
        const data = await apiFetch(url.toString(), { method: "PATCH" }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function changeAddress(token, homeAddress, workAddress) {
    try {
        const data = await apiFetch("/users/me", {
            method: "PATCH",
            body: JSON.stringify({
                home_address: homeAddress,
                work_address: workAddress
            })
        }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function getUserBikes(token) {
    try {
        const data = await apiFetch("/bikes/", { method: "GET" }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function addBike(token, name, type, isElectric) {
    try {
        const data = await apiFetch("/bikes/", {
            method: "POST",
            body: JSON.stringify({
                name: name,
                type: type,
                is_electric: isElectric
            })
        }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function editBike(token, bikeId, name, type, isElectric) {
    try {
        const data = await apiFetch(`/bikes/${bikeId}`, {
            method: "PATCH",
            body: JSON.stringify({
                name: name,
                type: type,
                is_electric: isElectric
            })
        }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function suppressBike(token, bike) {
    try {
        const data = await apiFetch(`/bikes/${bike.id}`, {
            method: "DELETE"
        }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function getUserHistoric(token) {
    try {
        const data = await apiFetch("/history/", { method: "GET" }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function deleteAllHistoric(token) {
    try {
        const data = await apiFetch("/history/", { method: "DELETE" }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function deleteReport(token, reportId) {
    try {
        const data = await apiFetch(`/reports/${reportId}`, { method: "DELETE" }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function getReports() {
    try {
        const data = await apiFetch("/reports/", { method: "GET" });
        return data;
    } catch (error) {
        throw error;
    }
}

export async function createReport(token, reportType, description, latitude, longitude) {
    try {
        const data = await apiFetch("/reports/", {
            method: "POST",
            body: JSON.stringify({
                report_type: reportType,
                report_description: description || null,
                latitude,
                longitude,
            }),
        }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function deleteHistoricEntry(token, historyId) {
    try {
        const data = await apiFetch(`/history/${historyId}`, { method: "DELETE" }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function updateNavigation(lat, lon, stepIdx, routeNodes, maneuvers) {
    try {
        const data = await apiFetch("/navigation/update", {
            method: "POST",
            body: JSON.stringify({
                lat,
                lon,
                step_idx: stepIdx,
                route_nodes: routeNodes,
                maneuvers,
            }),
        });
        return data;
    } catch (error) {
        console.error("Erreur navigation update:", error);
        return null;
    }
}