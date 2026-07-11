import { DeviceEventEmitter } from 'react-native';
import Constants from 'expo-constants';
import { getRefreshToken, saveAccessToken } from './tokenStorage';

let API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (__DEV__) {
    if (Constants.expoConfig?.hostUri) {
        const IP_PC = Constants.expoConfig.hostUri.split(':')[0];
        API_BASE_URL = `http://${IP_PC}:8000`;
        console.log("🔌 [DEV] Connecté automatiquement au backend sur :", API_BASE_URL);
    } else {
        API_BASE_URL = 'http://127.0.0.1:8000';
        console.log("🔌 [DEV] Connecté au backend local :", API_BASE_URL);
    }
} else {
    if (!API_BASE_URL) {
        console.warn("⚠️ [PROD] EXPO_PUBLIC_API_URL n'est pas défini dans le fichier .env !");
    } else if (!API_BASE_URL.startsWith('http')) {
        console.warn("⚠️ [PROD] EXPO_PUBLIC_API_URL doit commencer par http:// ou https://");
    } else {
        console.log("🚀 [PROD] Connecté au serveur de production sur :", API_BASE_URL);
    }
}

async function refreshAccessToken() {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/users/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        await saveAccessToken(data.access_token);
        DeviceEventEmitter.emit("token-refreshed", data.access_token);
        return data.access_token;
    } catch {
        return null;
    }
}

export async function apiFetch(endpoint, options = {}, token = null, _retried = false) {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.text();
        const isAuthEndpoint = url.includes("/login") || url.includes("/refresh");
        if (response.status === 401 && !isAuthEndpoint && errorData.includes("token")) {
            if (!_retried) {
                const newToken = await refreshAccessToken();
                if (newToken) {
                    return apiFetch(endpoint, options, newToken, true);
                }
            }
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

export async function verifyEmail(email, code) {
    try {
        const data = await apiFetch("/users/verify", {
            method: "POST",
            body: JSON.stringify({
                email: email,
                code: code,
            })
        }, null);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function resendVerification(email) {
    try {
        const data = await apiFetch("/users/resend-verification", {
            method: "POST",
            body: JSON.stringify({
                email: email,
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
    try {
        const data = await apiFetch("/users/me/password", {
            method: "PATCH",
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword
            })
        }, token);
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

export async function deleteHistoricEntry(token, historyId) {
    try {
        const data = await apiFetch(`/history/${historyId}`, { method: "DELETE" }, token);
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

export async function getPois(category) {
    try {
        const data = await apiFetch(`/pois/?categories=${encodeURIComponent(category)}`, { method: "GET" });
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

export async function updateNavigation(lat, lon, stepIdx, routeNodes, maneuvers, path = null) {
    try {
        const body = {
            lat,
            lon,
            step_idx: stepIdx,
            route_nodes: routeNodes,
            maneuvers,
        };
        if (path) body.path = path;
        const data = await apiFetch("/navigation/update", {
            method: "POST",
            body: JSON.stringify(body),
        });
        return data;
    } catch (error) {
        console.error("Erreur navigation update:", error);
        return null;
    }
}
