// Helpers purs de la couche météo. Aucune dérivation métier ici : les alertes,
// les conseils d'équipement et la suggestion de décalage de départ sont calculés
// par le backend (`backend/weather/config.py`) et servis prêts à l'emploi, pour
// que le mobile et le web ne puissent pas diverger d'un libellé.
//
// Pendant du fichier `frontend-web/src/modules/map/weather.js`. Même logique, à
// la table d'icônes près : MaterialCommunityIcons couvre bien mieux la météo que
// le jeu Material du web, on ne s'en prive pas.

import i18n from '../i18n';

export const WEATHER_ALERT_COLORS = {
    none: '#94a3b8',
    watch: '#facc15',
    warning: '#fb923c',
    severe: '#ef4444',
};

// Icône du bandeau. Les préfixes suffisent : les variantes d'intensité
// (`rain_slight`, `rain`, `rain_heavy`) partagent la même icône, l'intensité est
// déjà portée par le libellé textuel.
//
// L'ordre compte — `thunderstorm_hail` avant `thunderstorm`, `freezing_` avant
// `drizzle`, `snow_showers` avant `snow`, sinon le préfixe le plus court gagne.
const ICONS = [
    ['thunderstorm_hail', 'weather-hail'],
    ['thunderstorm', 'weather-lightning-rainy'],
    ['freezing_', 'weather-snowy-rainy'],
    ['snow_showers', 'weather-snowy-heavy'],
    ['snow', 'weather-snowy'],
    ['drizzle', 'weather-rainy'],
    ['rain', 'weather-pouring'],
    ['showers', 'weather-pouring'],
    ['rime_fog', 'weather-fog'],
    ['fog', 'weather-fog'],
    ['overcast', 'weather-cloudy'],
];

/**
 * Nom de glyphe MaterialCommunityIcons pour une condition météo.
 *
 * `isDay` vient du backend (`is_day`) et ne sert **qu'ici** : il ne doit jamais
 * alimenter l'éclairage, qui s'appuie sur `astral` et diverge au crépuscule.
 */
export function weatherIcon(condition, isDay = true) {
    const key = typeof condition === 'string' ? condition : '';

    if (key === 'clear' || key === 'mainly_clear') {
        return isDay ? 'weather-sunny' : 'weather-night';
    }
    if (key === 'partly_cloudy') {
        return isDay ? 'weather-partly-cloudy' : 'weather-night-partly-cloudy';
    }

    for (const [prefix, glyph] of ICONS) {
        if (key.startsWith(prefix)) return glyph;
    }
    return 'weather-cloudy';
}

/** Résumé de la zone où tombe le point, ou le résumé global à défaut. */
export function zoneForPoint(data, center) {
    const zones = data?.zones;
    if (!Array.isArray(zones) || zones.length === 0) return data || null;
    if (zones.length === 1 || !center) return zones[0];

    const inside = zones.find(({ bbox }) => Array.isArray(bbox)
        && center.lon >= bbox[0] && center.lon <= bbox[2]
        && center.lat >= bbox[1] && center.lat <= bbox[3]);
    if (inside) return inside;

    let best = zones[0];
    let bestDistance = Infinity;
    for (const zone of zones) {
        if (!Array.isArray(zone.bbox)) continue;
        const [w, s, e, n] = zone.bbox;
        const dLon = Math.max(w - center.lon, 0, center.lon - e)
            * Math.cos((center.lat * Math.PI) / 180);
        const dLat = Math.max(s - center.lat, 0, center.lat - n);
        const distance = Math.hypot(dLon, dLat);
        if (distance < bestDistance) {
            best = zone;
            bestDistance = distance;
        }
    }
    return best;
}

/**
 * Relevé météo le plus proche du point regardé.
 *
 * La météo est collectée sur des points placés par densité de réseau, pas au
 * centre des zones : c'est ce qui fait qu'à Bordeaux la pastille ne dit pas la
 * même chose sur les quais et à Mérignac. Chaque entrée de `points[]` a la même
 * forme qu'une entrée de `zones[]`, tout l'aval est donc indifférent au choix.
 *
 * Repli sur `zoneForPoint` si `points[]` manque — une application déjà installée
 * doit continuer d'afficher la météo face à un backend antérieur, pas la voir
 * disparaître.
 */
export function pointForCenter(data, center) {
    const points = data?.points;
    if (!Array.isArray(points) || points.length === 0) return zoneForPoint(data, center);
    if (points.length === 1 || !center) return points[0];

    let best = points[0];
    let bestDistance = Infinity;
    for (const point of points) {
        if (typeof point.lat !== 'number' || typeof point.lon !== 'number') continue;
        // Même approximation équirectangulaire que `zoneForPoint` : on compare des
        // distances, la constante de conversion en kilomètres ne changerait rien.
        const dLon = (point.lon - center.lon) * Math.cos((center.lat * Math.PI) / 180);
        const dLat = point.lat - center.lat;
        const distance = Math.hypot(dLon, dLat);
        if (distance < bestDistance) {
            best = point;
            bestDistance = distance;
        }
    }
    return best;
}

/**
 * Résumé météo, quelle que soit sa provenance.
 *
 * `/weather/` imbrique le résumé sous `summary` ; le bloc `weather` de
 * `/routes/route` est déjà à plat. Les deux portent les mêmes champs.
 */
export const weatherSummary = (data) => (data?.summary || data || null);

/**
 * Heure « 18h05 » d'un horodatage renvoyé par l'API météo.
 *
 * Découpage de chaîne et non `new Date()` : le backend renvoie déjà l'heure
 * locale de la zone, sans décalage. La repasser par `Date` la réinterpréterait
 * dans le fuseau du téléphone.
 */
export function formatHM(iso) {
    if (typeof iso !== 'string' || iso.length < 16) return null;
    return iso.slice(11, 16).replace(':', 'h');
}

const roughMinutes = (minutes) => Math.max(5, Math.round(minutes / 5) * 5);

// Pas du nowcast, et âge à partir duquel l'instantané est présenté comme un
// dernier relevé plutôt que comme le temps qu'il fait. Aligné sur
// `STALE_AFTER_S = 1800` du backend.
export const MINUTELY_STEP_MIN = 15;
export const STALE_AGE_MIN = 30;

/**
 * Âge de l'instantané, en minutes, ou `null` s'il est indatable.
 *
 * ⚠️ À calculer ici et **jamais** en lisant le drapeau `stale` du payload : ce
 * drapeau est évalué par le serveur au moment de la réponse puis figé. Un client
 * qui n'arrive plus à rafraîchir garde donc un `stale: false` indéfiniment, et
 * afficherait un nowcast vieux de plusieurs heures comme s'il était courant.
 */
export function snapshotAgeMin(updatedAt, now = Date.now()) {
    if (!updatedAt) return null;
    const at = Date.parse(updatedAt);
    if (Number.isNaN(at)) return null;
    return Math.max(0, (now - at) / 60000);
}

/**
 * Créneaux d'une série encore à venir, les écoulés étant retirés.
 *
 * Deux décalages se cumulent et justifient ce filtre : Open-Meteo cale la série
 * sur les quarts d'heure ronds (une collecte à 10h44 démarre à 10h30), et
 * l'instantané vieillit jusqu'à `refresh_interval_s` avant d'être lu.
 *
 * Les horodatages des séries sont locaux **naïfs**. On les lit comme de l'UTC et
 * on ramène `now` dans le même référentiel via `utc_offset_seconds` : les deux
 * côtés deviennent comparables sans jamais mélanger fuseau et heure murale.
 */
export function freshSteps(series, utcOffsetSeconds, stepMin = MINUTELY_STEP_MIN, now = Date.now()) {
    if (!Array.isArray(series) || series.length === 0) return [];
    const nowLocal = now + (utcOffsetSeconds || 0) * 1000;
    return series.filter((step) => {
        const start = Date.parse(`${step.time}Z`);
        return !Number.isNaN(start) && start + stepMin * 60000 > nowLocal;
    });
}

/**
 * Un `departure_hint` est-il encore exploitable ?
 *
 * Il porte des délais comptés depuis sa production ; passé son propre pas de
 * temps, « Pluie dans ~20 min » ne veut plus rien dire. Un repli horaire tient
 * donc une heure, un vrai nowcast un quart d'heure.
 */
export function isHintUsable(hint, ageMin) {
    if (!hint) return false;
    if (ageMin == null) return true;
    return ageMin < (hint.resolution_min || 60);
}

/**
 * Heure d'un horodatage décalé de `minutes`, au format « 12h30 ».
 *
 * Sert à afficher la **fin de couverture** d'une série : les horodatages servis
 * sont des débuts de créneau, donc le dernier point d'un nowcast à 12h15 couvre
 * en réalité jusqu'à 12h30. Afficher 12h15 comme borne faisait perdre un pas et
 * contredisait le cumul annoncé.
 */
export function formatHMShifted(iso, minutes) {
    const at = Date.parse(`${iso}Z`);
    if (Number.isNaN(at)) return null;
    return new Date(at + minutes * 60000).toISOString().slice(11, 16).replace(':', 'h');
}

// Millimètres par quart d'heure correspondant à une barre pleine. 2 mm en 15 min
// est une averse franche ; au-delà on écrête.
export const PRECIP_FULL_BAR_MM = 2;

/**
 * Hauteur d'une barre de nowcast, entre 0 et 1.
 *
 * Échelle **fixe**, délibérément : normaliser sur le maximum de la série ferait
 * toujours une barre pleine, et une bruine à 0,2 mm ressemblerait à un orage. Le
 * plancher à 0,04 sert à distinguer « une goutte » de « rien du tout », que 0
 * confondrait visuellement.
 */
export function precipBarHeight(mm) {
    const value = typeof mm === 'number' && mm > 0 ? mm : 0;
    if (value === 0) return 0;
    return Math.max(0.04, Math.min(1, value / PRECIP_FULL_BAR_MM));
}

/** `{ kind, text }` de la bannière pluie, ou `null` s'il n'y a rien à dire. */
export function rainBanner(zone) {
    const hint = weatherSummary(zone)?.departure_hint;
    if (!hint) return null;

    const precise = hint.resolution_min === 15;

    if (hint.wet_now) {
        if (hint.dry_in_min == null) {
            return { kind: 'persistent', text: i18n.t('carte.ui.meteo.pluiePersistante') };
        }
        const at = formatHM(hint.dry_from);
        return {
            kind: 'clearing',
            minutes: hint.dry_in_min,
            text: precise
                ? (at
                    ? i18n.t('carte.ui.meteo.accalmieDansVers', { minutes: roughMinutes(hint.dry_in_min), heure: at })
                    : i18n.t('carte.ui.meteo.accalmieDans', { minutes: roughMinutes(hint.dry_in_min) }))
                : (at
                    ? i18n.t('carte.ui.meteo.accalmieVers', { heure: at })
                    : i18n.t('carte.ui.meteo.accalmie')),
        };
    }

    if (hint.worsens_in_min == null) return null;
    return {
        kind: 'onset',
        minutes: hint.worsens_in_min,
        text: precise
            ? i18n.t('carte.ui.meteo.pluieDans', { minutes: roughMinutes(hint.worsens_in_min) })
            : i18n.t('carte.ui.meteo.pluieProchainesHeures'),
    };
}

/** Suggestion « partez vers 8h20 », ou `null`. Nowcast 15 min uniquement. */
export function departureSuggestion(zone) {
    const hint = weatherSummary(zone)?.departure_hint;
    if (!hint || !hint.wet_now || hint.dry_in_min == null) return null;
    if (hint.dry_in_min <= 0 || hint.resolution_min !== 15) return null;

    const at = formatHM(hint.dry_from);
    if (!at) return null;
    return {
        delayMin: hint.dry_in_min,
        at,
        text: i18n.t('carte.ui.meteo.departConseille', { heure: at, minutes: hint.dry_in_min }),
    };
}
