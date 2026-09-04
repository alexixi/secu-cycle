import { apiFetch } from './apiBack';
import { normalizeText, parseBareCoords, parseGeoUri } from '../utils/parseGeoUri';
import { isShortLink, parseMapsUrl } from '../utils/parseMapsUrl';

function normalizeItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const p = raw.properties ?? raw;
    const coords = raw.geometry?.coordinates;

    const lat = Number(p.lat ?? p.latitude ?? p.y ?? (coords ? coords[1] : NaN));
    const lon = Number(p.lon ?? p.lng ?? p.longitude ?? p.x ?? (coords ? coords[0] : NaN));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    const label = p.label ?? p.name ?? p.display_name ?? p.formatted ?? p.address ?? '';

    return {
        label: normalizeText(String(label)),
        lat,
        lon,
        score: typeof p.score === 'number' ? p.score : undefined,
        type: typeof p.type === 'string' ? p.type : undefined,
    };
}

const HIGH_CONFIDENCE = 0.8;
const MIN_CONFIDENCE = 0.4;
const PRECISE_TYPES = ['housenumber', 'street', 'poi', 'address'];

function decide(items, query, source) {
    if (items.length === 0) {
        return { kind: 'raw', text: query, source, reason: 'no_match' };
    }

    const best = items[0];
    const scored = typeof best.score === 'number';
    const precise = !best.type || PRECISE_TYPES.includes(best.type);
    const alone = items.length === 1;

    if (precise && (alone || (scored && best.score >= HIGH_CONFIDENCE))) {
        return { kind: 'coords', lat: best.lat, lon: best.lon, label: best.label, source };
    }

    const usable = items.filter((i) => !scored || (i.score ?? 0) >= MIN_CONFIDENCE);
    if (usable.length > 0) {
        return { kind: 'candidates', items: usable.slice(0, 8), query, source };
    }

    return { kind: 'raw', text: query, source, reason: 'low_confidence' };
}

const cache = new Map();

export async function geocode(query, bias) {
    const key = `${query}|${bias ? `${bias.lat.toFixed(2)},${bias.lon.toFixed(2)}` : ''}`;
    if (cache.has(key)) return cache.get(key);

    let path = `/geo/search?q=${encodeURIComponent(query)}&limit=8&autocomplete=0`;
    if (bias) path += `&lat=${bias.lat}&lon=${bias.lon}`;

    const raw = await apiFetch(path, { method: 'GET' });
    const list = Array.isArray(raw) ? raw : (raw?.features ?? raw?.results ?? []);
    const items = list.map(normalizeItem).filter(Boolean);

    cache.set(key, items);
    return items;
}

export async function resolveDestination(input, opts = {}) {
    const source = opts.source ?? 'text';
    const text = normalizeText(input);
    if (!text) return { kind: 'raw', text: '', source, reason: 'unparsable' };

    const geo = parseGeoUri(text);
    if (geo?.kind === 'coords') return { ...geo, source: 'geo' };
    if (geo?.kind === 'text') return geocodeStep(geo.text, 'geo', opts.bias);

    const bare = parseBareCoords(text);
    if (bare) return { ...bare, source };

    const maps = parseMapsUrl(text);
    if (maps?.kind === 'coords') return { ...maps, source: 'url' };
    if (maps?.kind === 'text') return geocodeStep(maps.text, 'url', opts.bias);
    if (maps?.kind === 'shortlink') return resolveShortlink(maps.url, source);

    if (/^https?:\/\//i.test(text) && !isShortLink(text)) {
        return { kind: 'raw', text, source, reason: 'unparsable' };
    }

    return geocodeStep(text, source, opts.bias);
}

async function geocodeStep(query, source, bias) {
    try {
        const items = await geocode(query, bias);
        return decide(items, query, source);
    } catch {
        return { kind: 'raw', text: query, source, reason: 'network' };
    }
}

async function resolveShortlink(url, source) {
    try {
        const raw = await apiFetch(`/geo/resolve?url=${encodeURIComponent(url)}`, { method: 'GET' });
        const item = normalizeItem(raw);
        if (!item) return { kind: 'raw', text: url, source, reason: 'no_match' };
        return { kind: 'coords', lat: item.lat, lon: item.lon, label: item.label, source };
    } catch {
        return { kind: 'raw', text: url, source, reason: 'network' };
    }
}
