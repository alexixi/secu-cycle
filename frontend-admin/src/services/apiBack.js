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

// --- Cases de la page d'accueil ---

export async function getHomeCases(token) {
    return apiFetch("/home-cases/", { method: "GET" }, token);
}

export async function createHomeCase(token, body) {
    return apiFetch("/home-cases/", {
        method: "POST",
        body: JSON.stringify(body),
    }, token);
}

export async function updateHomeCase(token, caseId, updates) {
    return apiFetch(`/home-cases/${caseId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
    }, token);
}

export async function deleteHomeCase(token, caseId) {
    return apiFetch(`/home-cases/${caseId}`, { method: "DELETE" }, token);
}

export async function reorderHomeCases(token, ids) {
    return apiFetch("/home-cases/reorder", {
        method: "PUT",
        body: JSON.stringify({ ids }),
    }, token);
}

export async function getFaqs(token) {
    return apiFetch("/faqs/admin", { method: "GET" }, token);
}

export async function createFaq(token, body) {
    return apiFetch("/faqs/", {
        method: "POST",
        body: JSON.stringify(body),
    }, token);
}

export async function updateFaq(token, faqId, updates) {
    return apiFetch(`/faqs/${faqId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
    }, token);
}

export async function deleteFaq(token, faqId) {
    return apiFetch(`/faqs/${faqId}`, { method: "DELETE" }, token);
}

export async function reorderFaqs(token, ids) {
    return apiFetch("/faqs/reorder", {
        method: "PUT",
        body: JSON.stringify({ ids }),
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

export async function getGraphBuilds(token, limit = 20) {
    return apiFetch(`/graph/admin/builds?limit=${limit}`, { method: "GET" }, token);
}
