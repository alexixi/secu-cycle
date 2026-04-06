import { useState, useEffect } from 'react';
import { startTracking, stopTracking } from '../services/locationService';
import { getGuidanceState } from '../services/guidanceEngine';

export default function useGuidance(itineraires, selectedItineraire, isNavigating) {
    const [currentPosition, setCurrentPosition] = useState(null);
    const [guidanceState, setGuidanceState] = useState(null);

    useEffect(() => {
        if (!isNavigating) {
            stopTracking();
            setGuidanceState(null);
            return;
        }

        const activePath = itineraires?.find(it => it.id === selectedItineraire)?.path;

        startTracking((position) => {
            setCurrentPosition(position);

            if (activePath) {
                const state = getGuidanceState(position, activePath);
                setGuidanceState(state);
            }
        }).catch((err) => {
            console.error('Erreur GPS :', err.message);
        });

        return () => stopTracking();
    }, [isNavigating, selectedItineraire]);

    return { currentPosition, guidanceState };
}