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
