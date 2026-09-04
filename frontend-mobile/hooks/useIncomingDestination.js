import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useShareIntent } from 'expo-share-intent';

import { resolveDestination } from '../services/destinationResolver';
import { setPendingDestination } from '../services/pendingDestination';

/**
 * Capte les destinations entrantes et les dépose dans le store.
 * Ne navigue PAS : c'est l'écran carte qui consomme.
 */

const WINDOW_MS = 3000;

/**
 * Intents `geo:` et App Links.
 * @param {{ bias?: { lat: number, lon: number } }} [options]
 */
export function useIncomingDestination(options = {}) {
    const { bias } = options;
    const seen = useRef(new Map());
    const biasRef = useRef(bias);
    biasRef.current = bias;

    useEffect(() => {
        let cancelled = false;

        // Au cold start, getInitialURL() et l'event 'url' livrent souvent
        // le même intent : fenêtre de 3 s sur la chaîne brute.
        const isDuplicate = (raw) => {
            const now = Date.now();
            for (const [k, t] of seen.current) {
                if (now - t > WINDOW_MS) seen.current.delete(k);
            }
            if (seen.current.has(raw)) return true;
            seen.current.set(raw, now);
            return false;
        };

        const handle = async (raw, source) => {
            if (!raw || isDuplicate(raw)) return;
            const resolved = await resolveDestination(raw, {
                bias: biasRef.current,
                source,
            });
            if (cancelled) return;
            setPendingDestination(resolved);
        };

        Linking.getInitialURL()
            .then((url) => {
                if (url) handle(url, url.startsWith('geo:') ? 'geo' : 'url');
            })
            .catch((e) => console.warn('[incoming] getInitialURL', e));

        const sub = Linking.addEventListener('url', ({ url }) => {
            handle(url, url.startsWith('geo:') ? 'geo' : 'url');
        });

        return () => {
            cancelled = true;
            sub.remove();
        };
    }, []);
}

/**
 * Partage entrant (ACTION_SEND).
 * ACTION_SEND ne passe pas par Linking : le texte est dans
 * Intent.EXTRA_TEXT, donc getInitialURL() renvoie null.
 *
 * Sur Android, une URL partagée arrive dans `text` (EXTRA_TEXT) ;
 * `webUrl` n'est renseigné que sur iOS. L'ordre couvre les deux.
 *
 * @param {{ bias?: { lat: number, lon: number } }} [options]
 */
export function useIncomingShare(options = {}) {
    const { bias } = options;
    const biasRef = useRef(bias);
    biasRef.current = bias;

    const { isReady, hasShareIntent, shareIntent, resetShareIntent } = useShareIntent({
        resetOnBackground: true,
    });
    console.log('[share] hook', isReady, hasShareIntent, JSON.stringify(shareIntent));
    useEffect(() => {
        if (!isReady || !hasShareIntent) return;

        const raw = shareIntent?.webUrl ?? shareIntent?.text;

        if (__DEV__) console.log('[share] reçu:', JSON.stringify(shareIntent));

        if (!raw) {
            resetShareIntent();
            return;
        }

        resolveDestination(raw, { bias: biasRef.current, source: 'share' })
            .then((resolved) => {
                if (__DEV__) console.log('[share] résolu:', JSON.stringify(resolved));
                setPendingDestination(resolved);
            })
            .catch((e) => console.warn('[share] résolution', e))
            .finally(() => resetShareIntent());
    }, [isReady, hasShareIntent]);
}
