/**
 * Extraction de coordonnées ou d'adresse depuis une URL de cartographie.
 * Module pur : pas de réseau, donc pas de suivi de redirection.
 * Les liens courts sont détectés mais NON résolus ici.
 */

import { decodeQueryValue, isInCoverage, normalizeText } from './parseGeoUri';

const SHORT_HOSTS = ['maps.app.goo.gl', 'goo.gl', 'g.co'];

export function extractFirstUrl(text) {
    const m = /https?:\/\/[^\s<>"')]+/i.exec(String(text ?? ''));
    return m ? m[0] : null;
}

export function isShortLink(url) {
    return SHORT_HOSTS.some((h) => String(url ?? '').includes(h));
}

function coordsIfValid(lat, lon) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    if (!isInCoverage(lat, lon)) return null;
    return { kind: 'coords', lat, lon };
}

export function parseMapsUrl(input) {
    const url = extractFirstUrl(input) ?? String(input ?? '').trim();
    if (!/^https?:\/\//i.test(url)) return null;

    if (isShortLink(url)) return { kind: 'shortlink', url };

    let search = '';
    let path = '';
    try {
        const u = new URL(url);
        search = u.search;
        path = u.pathname;
    } catch {
        return null;
    }

    // /@44.84,-0.57,16z (Google)
    const at = /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/.exec(path + search);
    // ?ll= (Apple) | ?q=coords | ?daddr=
    const ll = /[?&](?:ll|sll|daddr|q)=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/.exec(search);
    // #map=16/44.84/-0.57 (OSM)
    const osm = /#map=\d+\/(-?\d{1,3}\.\d+)\/(-?\d{1,3}\.\d+)/.exec(url);
    const hit = ll ?? at ?? osm;

    if (hit) {
        const found = coordsIfValid(Number(hit[1]), Number(hit[2]));
        if (found) return found;
    }

    const qMatch = /[?&](?:q|query|daddr|destination)=([^&]+)/.exec(search);
    if (qMatch) {
        const text = normalizeText(decodeQueryValue(qMatch[1]));
        if (text && !/^-?\d+\.\d+,/.test(text)) return { kind: 'text', text };
    }

    const place = /\/maps\/(?:place|dir)\/([^/@]+)/.exec(path);
    if (place) {
        const text = normalizeText(decodeQueryValue(place[1]));
        if (text) return { kind: 'text', text };
    }

    return null;
}
