import i18n, { DEFAULT_LANG } from '../i18n/index';
import { pathFor } from '../i18n/routes';

function clearSession() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("bikes");
    localStorage.removeItem("historic");
}

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return null;

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    try {
        const response = await fetch(`${API_BASE_URL}/users/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept-Language": i18n.language || DEFAULT_LANG,
            },
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

// Signal machine posé par get_current_user quand c'est la SESSION qui est morte.
// Les autres 401 sont métier (mot de passe erroné dans le corps de la requête)
// et ne doivent surtout pas déclencher de déconnexion.
//
// Il doit être listé dans expose_headers du CORSMiddleware côté API, sinon le
// navigateur le masque et seul le repli ci-dessous fonctionne.
const SESSION_INVALID_HEADER = "X-Auth-Error";
const SESSION_INVALID_CODE = "session_invalid";

// Repli sur les messages, pour les API pas encore passées à l'en-tête. Cette
// liste ne survivra pas à la traduction du backend — c'est exactement pourquoi
// l'en-tête existe — et elle disparaîtra une fois l'API déployée partout.
const SESSION_INVALID_DETAILS = [
    "Invalid token",
    "Invalid token payload",
    // i18n-exempt: détail de 401 renvoyé par l'API, comparé et non affiché — voir X-Auth-Error
    "Token révoqué",
    "Compte suspendu.",
];

function isSessionInvalid(response, errorData) {
    if (response.headers.get(SESSION_INVALID_HEADER) === SESSION_INVALID_CODE) {
        return true;
    }

    let detail = errorData;
    try {
        const parsed = JSON.parse(errorData)?.detail;
        if (typeof parsed === "string") detail = parsed;
    } catch {
        // Corps non-JSON : on retombe sur le texte brut.
    }
    return typeof detail === "string"
        && SESSION_INVALID_DETAILS.some((message) => detail.includes(message));
}

export async function apiFetch(url, options = {}, token = null, _retried = false) {
    const headers = {
        "Content-Type": "application/json",
        // Le backend négocie ?lang= > Accept-Language > fr. Le navigateur en
        // envoie un, mais c'est celui du système : sur /en/ avec un navigateur
        // français, les messages d'erreur et la météo revenaient en français.
        // C'est aussi lui qui renseigne users.language à l'inscription, donc la
        // langue des e-mails. DEFAULT_LANG couvre le prérendu, où i18next peut
        // ne pas être initialisé.
        "Accept-Language": i18n.language || DEFAULT_LANG,
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    let API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    if (!API_BASE_URL) {
        // i18n-exempt: erreur de configuration du build, jamais servie à un visiteur
        throw new Error("VITE_API_BASE_URL n'est pas défini dans les variables d'environnement");
    }
    const fullUrl = `${API_BASE_URL}${url}`
    const response = await fetch(fullUrl, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.text();
        const isAuthEndpoint = url.toString().includes("/login") || url.toString().includes("/refresh");
        if (response.status === 401 && !isAuthEndpoint && isSessionInvalid(response, errorData)) {
            if (!_retried) {
                const newToken = await refreshAccessToken();
                if (newToken) {
                    return apiFetch(url, options, newToken, true);
                }
            }
            if (localStorage.getItem("access_token")) {
                clearSession();
                // Une redirection en dur renverrait un visiteur de /en/ vers la
                // page française : la cible se résout dans la langue de la page.
                window.location.href = pathFor('login', i18n.language) || '/login';
            }
            // i18n-exempt: message d'Error interne, jamais rendu
            throw new Error("Non autorisé");
        }
        // i18n-exempt: message d'Error interne, jamais rendu — le texte affiché vient de l'API
        const apiError = new Error(errorData || "Erreur lors de la requête API");
        apiError.status = response.status;
        apiError.statusText = response.statusText;
        try {
            const detail = JSON.parse(errorData)?.detail;
            apiError.code = detail?.code ?? null;
            apiError.detailMessage = detail?.message ?? null;
        } catch {
            apiError.code = null;
        }
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
        return { routes: data.routes, weather: data.weather || null };
    } catch (error) {
        throw error;
    }
}

export async function isCovered(lat, lon) {
    try {
        const data = await apiFetch(`/graph/coverage?lat=${lat}&lon=${lon}`, { method: "GET" });
        return data.covered !== false;
    } catch {
        return true;
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
            body: JSON.stringify({ email: email, code: code })
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
            body: JSON.stringify({ email: email })
        }, null);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function forgotPassword(email) {
    try {
        const data = await apiFetch("/users/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email: email })
        }, null);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function resetPassword(email, code, newPassword) {
    try {
        const data = await apiFetch("/users/reset-password", {
            method: "POST",
            body: JSON.stringify({ email: email, code: code, new_password: newPassword })
        }, null);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function sendContactMessage(firstName, lastName, email, subject, message) {
    try {
        const data = await apiFetch("/contact/", {
            method: "POST",
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                email: email,
                subject: subject,
                message: message,
            })
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


export async function deleteAccount(token, password) {
    try {
        const data = await apiFetch("/users/me", {
            method: "DELETE",
            body: JSON.stringify({ password: password }),
        }, token);
        return data;
    } catch (error) {
        throw error;
    }
}


export async function requestEmailChange(token, newEmail, password) {
    try {
        const data = await apiFetch("/users/me/email", {
            method: "POST",
            body: JSON.stringify({ new_email: newEmail, password: password }),
        }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

// L'adresse cible n'est pas renvoyée : elle est scellée côté serveur avec le code.
export async function confirmEmailChange(token, code) {
    try {
        const data = await apiFetch("/users/me/email/confirm", {
            method: "POST",
            body: JSON.stringify({ code: code }),
        }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function setProfileLanguage(token, language) {
    // La langue du site est dans l'URL ; la colonne users.language, elle, sert
    // aux e-mails — dont le récapitulatif, envoyé par une boucle de fond qui
    // n'a aucune requête d'où lire une préférence.
    return apiFetch("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ language }),
    }, token);
}

export async function setRecapEmails(token, enabled) {
    // Charge utile posée telle quelle : un `false` ne doit pas être confondu avec
    // un champ vide et disparaître du corps de la requête.
    const data = await apiFetch("/users/me", {
        method: "PATCH",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ recap_emails: enabled })
    }, token);
    return data;
}

export async function changeAddress(token, homeAddress, workAddress) {
    try {
        const data = await apiFetch("/users/me", {
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
        const data = await apiFetch(`/bikes/${bike.id}`, {
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
        const data = await apiFetch("/history/", { method: "GET" }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function getBadges(token) {
    try {
        const data = await apiFetch("/badges/", { method: "GET" }, token);
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

export async function deleteHistoricEntry(token, historyId) {
    try {
        const data = await apiFetch(`/history/${historyId}`, { method: "DELETE" }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function reportAbuse(token, reportId, reason) {
    try {
        const data = await apiFetch(`/reports/${reportId}/abuse`, {
            method: "POST",
            body: JSON.stringify({ reason: reason || "other" }),
        }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function blockReportAuthor(token, reportId) {
    try {
        const data = await apiFetch(`/reports/${reportId}/block-author`, {
            method: "POST",
        }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function getMyBlocks(token) {
    try {
        const data = await apiFetch("/users/me/blocks", { method: "GET" }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function unblockUser(token, blockedId) {
    try {
        const data = await apiFetch(`/users/me/blocks/${blockedId}`, { method: "DELETE" }, token);
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

export async function getReports(token = null) {
    try {
        const data = await apiFetch("/reports/", { method: "GET" }, token);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function voteReport(token, reportId, isPresent) {
    try {
        const data = await apiFetch(`/reports/${reportId}/vote`, {
            method: "POST",
            body: JSON.stringify({ is_present: isPresent }),
        }, token);
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

export async function getPois(category, bbox = null) {
    try {
        const filtre = bbox ? `&bbox=${encodeURIComponent(bbox)}` : "";
        const data = await apiFetch(`/pois/?categories=${encodeURIComponent(category)}${filtre}`, { method: "GET" });
        return data;
    } catch (error) {
        throw error;
    }
}

export async function getAccidents(bbox = null) {
    try {
        const filtre = bbox ? `?bbox=${encodeURIComponent(bbox)}` : "";
        const data = await apiFetch(`/accidents/${filtre}`, { method: "GET" });
        return data;
    } catch (error) {
        throw error;
    }
}

export async function getStreetlights(bbox = null) {
    try {
        const filtre = bbox ? `?bbox=${encodeURIComponent(bbox)}` : "";
        const data = await apiFetch(`/streetlights/${filtre}`, { method: "GET" });
        return data;
    } catch (error) {
        throw error;
    }
}

export async function getLitRoads() {
    try {
        const data = await apiFetch("/streetlights/lit-roads", { method: "GET" });
        return data;
    } catch (error) {
        throw error;
    }
}

export async function getStreetlightSources() {
    try {
        const data = await apiFetch("/streetlights/sources", { method: "GET" });
        return data;
    } catch (error) {
        throw error;
    }
}

export async function getTraffic() {
    try {
        const data = await apiFetch("/traffic/", { method: "GET" });
        return data;
    } catch (error) {
        throw error;
    }
}

export async function getAirQuality() {
    try {
        const data = await apiFetch("/air-quality/", { method: "GET" });
        return data;
    } catch (error) {
        throw error;
    }
}

export async function getWeather() {
    try {
        const data = await apiFetch("/weather/", { method: "GET" });
        return data;
    } catch (error) {
        throw error;
    }
}

export async function getBikeshareStations() {
    try {
        const data = await apiFetch("/bikeshare/", { method: "GET" });
        return data;
    } catch (error) {
        throw error;
    }
}
