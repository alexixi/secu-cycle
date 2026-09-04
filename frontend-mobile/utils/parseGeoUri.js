/**
 * Parsing des URI `geo:` (RFC 5870 + variantes Android).
 * Module pur : aucune dépendance expo-*, aucun réseau. Testable en Node seul.
 */


/**
 * Zones couvertes : [latMin, latMax, lonMin, lonMax].
 * Hors de ces boîtes, on refuse de router plutôt que d'envoyer
 * le cycliste sur un point aberrant.
 * @type {Array<[number, number, number, number]>}
 */
const BBOXES = [
    [41.3, 51.6, -5.3, 9.7], // France métropolitaine + Belgique + Luxembourg
];

export function isInCoverage(lat, lon) {
    return BBOXES.some(
        ([laMin, laMax, loMin, loMax]) =>
            lat >= laMin && lat <= laMax && lon >= loMin && lon <= loMax,
    );
}

export function decodeQueryValue(raw) {
    try {
        return decodeURIComponent(raw.replace(/\+/g, ' ')).trim();
    } catch {
        return raw.replace(/\+/g, ' ').trim();
    }
}

export function normalizeText(input) {
    return String(input ?? '')
        .replace(/[\u201C\u201D\u2018\u2019]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

const COORD_PAIR = /^(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/;

export function parseBareCoords(input) {
    const m = COORD_PAIR.exec(String(input ?? '').trim());
    if (!m) return null;
    const lat = Number(m[1]);
    const lon = Number(m[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
    if (!isInCoverage(lat, lon)) return null;
    return { kind: 'coords', lat, lon };
}

function splitLabel(value) {
    const m = /^(.*?)\s*\(([^)]*)\)\s*$/.exec(value);
    if (!m) return { base: value };
    return { base: m[1].trim(), label: normalizeText(m[2]) || undefined };
}

export function parseGeoUri(uri) {
    if (!uri) return null;
    const trimmed = String(uri).trim();
    if (!/^geo:/i.test(trimmed)) return null;

    const body = trimmed.slice(4);
    const qIndex = body.indexOf('?');
    const pathPart = (qIndex === -1 ? body : body.slice(0, qIndex)).split(';')[0];
    const queryPart = qIndex === -1 ? '' : body.slice(qIndex + 1);

    let q;
    for (const pair of queryPart.split('&')) {
        const eq = pair.indexOf('=');
        if (eq === -1) continue;
        if (pair.slice(0, eq).toLowerCase() === 'q') {
            q = decodeQueryValue(pair.slice(eq + 1));
            break;
        }
    }

    if (q) {
        const { base, label } = splitLabel(q);
        const coords = parseBareCoords(base);
        if (coords) return label ? { ...coords, label } : coords;
        const text = normalizeText(base || q);
        return text ? { kind: 'text', text } : null;
    }

    const coords = parseBareCoords(pathPart);
    if (coords) return coords;

    return null;
}
