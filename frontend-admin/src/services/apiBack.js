// Client API de l'app d'administration Sécu'Cycle.
// Réutilise le backend FastAPI (mêmes endpoints /users/*) avec rafraîchissement
// automatique du token d'accès.

const STORAGE_KEYS = ["access_token", "refresh_token", "admin_user"];

function clearSession() {
    STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

function getApiBaseUrl() {
    const url = import.meta.env.VITE_API_BASE_URL;
    if (!url) {
        throw new Error("VITE_API_BASE_URL n'est pas défini dans les variables d'environnement");
    }
    return url;
}

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return null;
    try {
        const response = await fetch(`${getApiBaseUrl()}/users/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        localStorage.setItem("access_token", data.access_token);
        if (data.refresh_token) {
            localStorage.setItem("refresh_token", data.refresh_token);
        }
        window.dispatchEvent(new CustomEvent("token-refreshed", { detail: data.access_token }));
        return data.access_token;
    } catch {
        return null;
    }
}

export async function apiFetch(url, options = {}, token = null, _retried = false) {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${getApiBaseUrl()}${url}`, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.text();
        const isAuthEndpoint = url.toString().includes("/login") || url.toString().includes("/refresh");
        if (response.status === 401 && !isAuthEndpoint) {
            if (!_retried) {
                const newToken = await refreshAccessToken();
                if (newToken) {
                    return apiFetch(url, options, newToken, true);
                }
            }
            if (localStorage.getItem("access_token")) {
                clearSession();
                window.dispatchEvent(new CustomEvent("admin-force-logout"));
            }
            throw new Error("Non autorisé");
        }
        const apiError = new Error(errorData || "Erreur lors de la requête API");
        apiError.status = response.status;
        apiError.statusText = response.statusText;
        throw apiError;
    }

    if (response.status === 204) {
        return { success: true };
    }
    return response.json();
}

export async function login(email, password) {
    return apiFetch("/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email, password }),
    }, null);
}

export async function getMe(token) {
    return apiFetch("/users/me", { method: "GET" }, token);
}

export async function getAllUsers(token) {
    return apiFetch("/users/", { method: "GET" }, token);
}

export async function adminUpdateUser(token, userId, updates) {
    return apiFetch(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
    }, token);
}

export async function adminDeleteUser(token, userId) {
    return apiFetch(`/users/${userId}`, { method: "DELETE" }, token);
}

export async function getUserBadges(token, userId) {
    return apiFetch(`/badges/user/${userId}`, { method: "GET" }, token);
}

// --- Signalements (modération) ---

export async function getReportsAdmin(token) {
    return apiFetch("/reports/admin", { method: "GET" }, token);
}

export async function deleteReport(token, reportId) {
    return apiFetch(`/reports/${reportId}`, { method: "DELETE" }, token);
}

export async function setReportVerified(token, reportId, isVerified) {
    return apiFetch(`/reports/${reportId}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ is_verified: isVerified }),
    }, token);
}

// --- Administrateurs (pour l'assignation des tâches) ---

export async function getAdmins(token) {
    return apiFetch("/users/admins", { method: "GET" }, token);
}

// --- Planning (tâches d'administration) ---

export async function getTasks(token) {
    return apiFetch("/tasks/", { method: "GET" }, token);
}

export async function createTask(token, body) {
    return apiFetch("/tasks/", {
        method: "POST",
        body: JSON.stringify(body),
    }, token);
}

export async function updateTask(token, taskId, updates) {
    return apiFetch(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
    }, token);
}

export async function deleteTask(token, taskId) {
    return apiFetch(`/tasks/${taskId}`, { method: "DELETE" }, token);
}

export async function reorderTasks(token, items) {
    return apiFetch("/tasks/reorder", {
        method: "PUT",
        body: JSON.stringify({ items }),
    }, token);
}

// --- Étiquettes (thèmes des tâches) ---

export async function getTags(token) {
    return apiFetch("/tags/", { method: "GET" }, token);
}

export async function createTag(token, body) {
    return apiFetch("/tags/", {
        method: "POST",
        body: JSON.stringify(body),
    }, token);
}

export async function updateTag(token, tagId, updates) {
    return apiFetch(`/tags/${tagId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
    }, token);
}

export async function deleteTag(token, tagId) {
    return apiFetch(`/tags/${tagId}`, { method: "DELETE" }, token);
}

export async function getAccidentStats(token) {
    return apiFetch("/accidents/admin/stats", { method: "GET" }, token);
}

export async function triggerAccidentSync(token) {
    return apiFetch("/accidents/admin/sync", { method: "POST" }, token);
}

export async function getAccidentSyncRuns(token, limit = 20) {
    return apiFetch(`/accidents/admin/runs?limit=${limit}`, { method: "GET" }, token);
}

export async function getAccidentSyncSettings(token) {
    return apiFetch("/accidents/admin/settings", { method: "GET" }, token);
}

export async function updateAccidentSyncSettings(token, updates) {
    return apiFetch("/accidents/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(updates),
    }, token);
}

export async function getPoiStats(token) {
    return apiFetch("/pois/admin/stats", { method: "GET" }, token);
}

export async function triggerPoiSync(token) {
    return apiFetch("/pois/admin/sync", { method: "POST" }, token);
}

export async function getPoiSyncRuns(token, limit = 20) {
    return apiFetch(`/pois/admin/runs?limit=${limit}`, { method: "GET" }, token);
}

export async function getPoiSyncSettings(token) {
    return apiFetch("/pois/admin/settings", { method: "GET" }, token);
}

export async function updatePoiSyncSettings(token, updates) {
    return apiFetch("/pois/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(updates),
    }, token);
}


export async function getStreetlightStats(token) {
    return apiFetch("/streetlights/admin/stats", { method: "GET" }, token);
}

export async function triggerStreetlightSync(token) {
    return apiFetch("/streetlights/admin/sync", { method: "POST" }, token);
}

export async function getStreetlightSyncRuns(token, limit = 20) {
    return apiFetch(`/streetlights/admin/runs?limit=${limit}`, { method: "GET" }, token);
}

export async function getStreetlightSyncSettings(token) {
    return apiFetch("/streetlights/admin/settings", { method: "GET" }, token);
}

export async function updateStreetlightSyncSettings(token, updates) {
    return apiFetch("/streetlights/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(updates),
    }, token);
}


export async function getGraphStats(token) {
    return apiFetch("/graph/admin/stats", { method: "GET" }, token);
}

export async function getGraphProfiles(token) {
    return apiFetch("/graph/admin/profiles", { method: "GET" }, token);
}

export async function createGraphProfile(token, body) {
    return apiFetch("/graph/admin/profiles", {
        method: "POST",
        body: JSON.stringify(body),
    }, token);
}

export async function updateGraphProfile(token, profileId, updates) {
    return apiFetch(`/graph/admin/profiles/${profileId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
    }, token);
}

export async function deleteGraphProfile(token, profileId) {
    return apiFetch(`/graph/admin/profiles/${profileId}`, { method: "DELETE" }, token);
}

export async function getGraphProfileExtent(token, profileId) {
    return apiFetch(`/graph/admin/profiles/${profileId}/extent`, { method: "GET" }, token);
}

export async function buildGraphProfile(token, profileId, wipeIgn = false) {
    return apiFetch(`/graph/admin/profiles/${profileId}/build?wipe_ign=${wipeIgn}`, {
        method: "POST",
    }, token);
}

export async function activateGraphProfile(token, profileId) {
    return apiFetch(`/graph/admin/profiles/${profileId}/activate`, { method: "POST" }, token);
}

export async function setGraphDataScope(token, profileId) {
    return apiFetch(`/graph/admin/profiles/${profileId}/data-scope`, { method: "POST" }, token);
}

export async function getCommuneLighting(token) {
    return apiFetch("/graph/admin/communes/lighting", { method: "GET" }, token);
}

export async function updateCommuneLighting(token, schedules) {
    return apiFetch("/graph/admin/communes/lighting", {
        method: "PUT",
        body: JSON.stringify({ schedules }),
    }, token);
}

export async function getGraphBuilds(token, limit = 20) {
    return apiFetch(`/graph/admin/builds?limit=${limit}`, { method: "GET" }, token);
}

// Le fichier d'échange transite en JSON dans les deux sens : le navigateur
// fabrique lui-même le téléchargement, et relit le fichier importé avant de le
// poster. Pas de multipart, donc rien à changer à `apiFetch`.
export async function exportGraphProfiles(token, profileId = null) {
    const query = profileId ? `?profile_id=${profileId}` : "";
    return apiFetch(`/graph/admin/profiles/export${query}`, { method: "GET" }, token);
}

export async function importGraphProfiles(token, bundle) {
    return apiFetch("/graph/admin/profiles/import", {
        method: "POST",
        body: JSON.stringify(bundle),
    }, token);
}
