// Accès à la langue courante depuis un composant.
//
// La langue est toujours dérivée de l'URL, jamais d'un état ni du stockage
// local. C'est ce qui garantit qu'elle est correcte dès le premier rendu, donc
// au moment où react-snap fige le HTML : une langue venue d'un état produirait
// des pages /en/ prérendues en français.

import { useCallback } from 'react';
import { useLocation } from 'react-router';

import { langFromPathname, pathFor } from './routes';

export function useLang() {
    return langFromPathname(useLocation().pathname);
}

export function useLocalizedPath() {
    const lang = useLang();
    return useCallback((routeKey, params) => pathFor(routeKey, lang, params), [lang]);
}
