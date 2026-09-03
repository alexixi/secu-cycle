import { useCallback, useState } from 'react';

// Contraintes horaires du calcul d'itinéraire : heure d'arrivée au plus tard et
// durée maximale de trajet.
//
// Ce sont deux faces d'une même donnée. Le backend n'en connaît qu'une —
// `temps_max_min`, une durée en minutes (schemas/route.py) — et l'heure
// d'arrivée s'y ramène par une soustraction. La durée est donc la valeur de
// référence, l'heure ce qu'on en montre.
//
// Les deux sont pourtant stockées séparément, et mises à jour l'une par l'autre
// à chaque saisie. Une heure DÉRIVÉE en continu de `Date.now()` reculerait à
// chaque rendu — l'utilisateur verrait « 18:30 » devenir « 18:29 » sans avoir
// rien touché. Ici chaque valeur est figée au moment où elle est calculée, et ne
// bouge plus jusqu'à la saisie suivante. Pour la même raison la synchronisation
// se fait dans les setters, jamais dans un useEffect : deux effets qui se
// répondent, c'est une boucle.

// Bornes de `temps_max_min` côté API. Les reproduire ici évite un aller-retour
// qui reviendrait en 422, affiché comme une erreur de calcul d'itinéraire.
const MIN_DURATION = 1;
const MAX_DURATION = 1440;

/** Combien de minutes d'ici `date` ? `null` si c'est déjà passé. */
export function minutesUntil(date, now = new Date()) {
    if (!date) return null;
    const minutes = Math.round((date.getTime() - now.getTime()) / 60000);
    return minutes >= MIN_DURATION ? Math.min(minutes, MAX_DURATION) : null;
}

/** Une durée en minutes utilisable telle quelle par l'API, ou `null`. */
export function clampDuration(minutes) {
    if (!Number.isFinite(minutes) || minutes < MIN_DURATION) return null;
    return Math.min(Math.round(minutes), MAX_DURATION);
}

export function useMaxTime() {
    // Minutes, ou null quand aucune contrainte n'est posée. C'est ce qui part
    // à l'API.
    const [maxDuration, setMaxDuration] = useState(null);
    // Date, ou null. Seule l'heure du jour compte ; la partie date sert à faire
    // la soustraction.
    const [arrivalTime, setArrivalTime] = useState(null);

    const setDuration = useCallback((minutes) => {
        const duration = clampDuration(minutes);
        setMaxDuration(duration);
        setArrivalTime(duration === null ? null : new Date(Date.now() + duration * 60000));
    }, []);

    const setArrival = useCallback((date) => {
        setArrivalTime(date);
        setMaxDuration(minutesUntil(date));
    }, []);

    const clear = useCallback(() => {
        setMaxDuration(null);
        setArrivalTime(null);
    }, []);

    return {
        maxDuration,
        arrivalTime,
        // Une heure posée qui ne donne aucune durée ne peut être que derrière
        // nous : c'est ce qui distingue « 8 h alors qu'il est 20 h » de « rien
        // n'a été saisi », les deux ayant `maxDuration` à null.
        isPastTime: arrivalTime !== null && maxDuration === null,
        setDuration,
        setArrival,
        clear,
    };
}
