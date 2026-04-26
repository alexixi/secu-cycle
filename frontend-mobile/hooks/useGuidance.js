import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { updateNavigation } from '../services/apiBack';

const UPDATE_INTERVAL_MS = 2000;

export default function useGuidance(itineraires, selectedItineraire, isNavigating, onStop) {
    const [currentPosition, setCurrentPosition] = useState(null);
    const [guidanceState, setGuidanceState] = useState(null);

    const stepIdxRef = useRef(0);
    const navIntervalRef = useRef(null);
    const locationSubRef = useRef(null);
    const lastPositionRef = useRef(null);

    // GPS toujours actif — pour afficher la position sur la carte
    useEffect(() => {
        let sub = null;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            sub = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 500,
                    distanceInterval: 2,
                },
                (loc) => {
                    const pos = {
                        lat: loc.coords.latitude,
                        lon: loc.coords.longitude,
                        heading: loc.coords.heading ?? 0,
                    };
                    setCurrentPosition(pos);
                    lastPositionRef.current = pos;
                }
            );
            locationSubRef.current = sub;
        })();

        return () => {
            sub?.remove();
        };
    }, []);

    useEffect(() => {
        if (!isNavigating) {
            _stopNavInterval();
            setGuidanceState(null);
            return;
        }

        const activeRoute = itineraires?.find(it => it.id === selectedItineraire);
        if (!activeRoute?.nodes || !activeRoute?.maneuvers) return;

        stepIdxRef.current = 0;
        _startNavInterval(activeRoute);

        return () => _stopNavInterval();
    }, [isNavigating, selectedItineraire]);

    function _startNavInterval(activeRoute) {
        _stopNavInterval();

        navIntervalRef.current = setInterval(async () => {
            const pos = lastPositionRef.current;
            if (!pos) return;

            const result = await updateNavigation(
                pos.lat,
                pos.lon,
                stepIdxRef.current,
                activeRoute.nodes,
                activeRoute.maneuvers,
            );

            if (!result) return;

            if (result.current_step_idx !== undefined) {
                stepIdxRef.current = result.current_step_idx;
            }

            const totalSteps = activeRoute.maneuvers.length;
            const progress = totalSteps > 1
                ? stepIdxRef.current / (totalSteps - 1)
                : 1;

            const hasArrived = result.current_maneuver?.turn_type === 'arrive';

            setGuidanceState({
                status: result.status,
                instruction: result.instruction ?? null,
                nextInstruction: result.next_instruction ?? null,
                distanceToNext: result.distance_to_next_m ?? null,
                snappedLat: result.snapped_lat,
                snappedLon: result.snapped_lon,
                recalculate: result.recalculate ?? false,
                hasArrived,
                progress,
            });

            if (hasArrived) {
                _stopNavInterval();
                setTimeout(() => onStop?.(), 3000);
            }

        }, UPDATE_INTERVAL_MS);
    }

    function _stopNavInterval() {
        if (navIntervalRef.current) {
            clearInterval(navIntervalRef.current);
            navIntervalRef.current = null;
        }
    }

    return { currentPosition, guidanceState };
}