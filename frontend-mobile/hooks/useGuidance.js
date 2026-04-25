import { useState, useEffect } from 'react';
import { startTracking, stopTracking } from '../services/locationService';
import { getGuidanceState } from '../services/guidanceEngine';

export default function useGuidance(itineraires, selectedItineraire, isNavigating, onError) {
    const [currentPosition, setCurrentPosition] = useState(null);
    const [guidanceState, setGuidanceState] = useState(null);

    useEffect(() => {
        if (!isNavigating) {
            stopTracking();
            setGuidanceState(null);
            return;
        }

        const activeRoute = itineraires?.find(it => it.id === selectedItineraire);

        startTracking((position) => {
            setCurrentPosition(position);

            if (activeRoute) {
                const state = getGuidanceState(position, activeRoute);
                setGuidanceState(state);
            }
        }).catch((err) => {
            console.error('Erreur GPS :', err.message);
            onError?.();
        });

        return () => stopTracking();

    }, [isNavigating, selectedItineraire, itineraires, onError]);

    return { currentPosition, guidanceState };
}
