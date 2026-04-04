export async function apiFetch(url, options = {}, token = null) {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.text();
        if (response.status === 401 && !url.toString().includes("/login") && errorData.includes("token")) {
            console.warn("Token expiré ! Déconnexion forcée.");
            window.dispatchEvent(new Event("force-logout"));
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

export async function calculateItineraries(token, start, end, bikeId, maxDuration) {
    try {
        const body = {
            start_lat: start.lat,
            start_lon: start.lon,
            end_lat: end.lat,
            end_lon: end.lon,
            temps_max_min: maxDuration
        };

        if (Number.isInteger(bikeId)) {
            body.bike_id = bikeId;
        } else if (typeof bikeId === "string" && bikeId.startsWith("default-")) {
            const parts = bikeId.split("-");
            body.bike_type = parts[1];
            body.is_electric = parts[2] === "electric";
        }

        const data = await apiFetch("/api/routes/route", {
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
        const data = await apiFetch("/api/users/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                username: email,
                password: password
            })
        }, null);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function register(firstName, lastName, birthdate, email, password) {
    try {
        const data = await apiFetch("/api/users/", {
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
        const data = await apiFetch("/api/users/me", { method: "GET" }, token);
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
        const data = await apiFetch("/api/users/me", {
            method: "PATCH",
            body: JSON.stringify(payload),
        }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function changePassword(token, oldPassword, newPassword) {
    const url = new URL("/api/users/me/password", window.location.origin);
    url.searchParams.append("old_password", oldPassword);
    url.searchParams.append("new_password", newPassword);
    try {
        const data = await apiFetch(url, { method: "PATCH" }, token);
        return data;
    } catch (error) {
        throw error;
    }
}


export async function changeAddress(token, homeAddress, workAddress) {
    try {
        const data = await apiFetch("/api/users/me", {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
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
        const data = await apiFetch("/api/bikes/", { method: "GET" }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function addBike(token, name, type, isElectric) {
    try {
        const data = await apiFetch("/api/bikes/", {
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
        const data = await apiFetch(`/api/bikes/${bikeId}`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
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
        const data = await apiFetch(`/api/bikes/${bike.id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function getUserHistoric(token) {
    try {
        const data = await apiFetch("/api/history/", { method: "GET" }, token);
        return data;
    } catch (error) {
        throw error;
    }
}
