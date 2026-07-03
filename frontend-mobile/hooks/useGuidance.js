import { useState, useEffect, useRef } from 'react';
import { DeviceEventEmitter } from 'react-native';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { updateNavigation } from '../services/apiBack';
import {
    startBackgroundLocation,
    stopBackgroundLocation,
    BACKGROUND_LOCATION_EVENT,
} from '../services/backgroundLocation';
import {
    startNavigationNotification,
    updateNavigationNotification,
    stopNavigationNotification,
} from '../services/navigationNotification';
import { trackEvent } from '../services/analytics';

const UPDATE_INTERVAL_MS = 2000;
const APPROACH_DISTANCE_M = 200;
const IMMINENT_DISTANCE_M = 40;

export default function useGuidance(itineraires, selectedItineraire, isNavigating, onStop) {
    const [currentPosition, setCurrentPosition] = useState(null);
    const [guidanceState, setGuidanceState] = useState(null);

    const stepIdxRef = useRef(0);
    const navIntervalRef = useRef(null);
    const locationSubRef = useRef(null);
    const lastPositionRef = useRef(null);

    const approachStepRef = useRef(-1);
    const imminentStepRef = useRef(-1);
    const arrivedSpokenRef = useRef(false);

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
        const subscription = DeviceEventEmitter.addListener(
            BACKGROUND_LOCATION_EVENT,
            (coords) => {
                const pos = {
                    lat: coords.latitude,
                    lon: coords.longitude,
                    heading: coords.heading ?? 0,
                };
                setCurrentPosition(pos);
                lastPositionRef.current = pos;
            }
        );

        return () => subscription.remove();
    }, []);

    useEffect(() => {
        if (!isNavigating) {
            _stopNavInterval();
            stopBackgroundLocation();
            stopNavigationNotification();
            setGuidanceState(null);
            return;
        }

        const activeRoute = itineraires?.find(it => it.id === selectedItineraire);
        if (!activeRoute?.nodes || !activeRoute?.maneuvers) return;

        stepIdxRef.current = 0;
        approachStepRef.current = -1;
        imminentStepRef.current = -1;
        arrivedSpokenRef.current = false;
        _startNavInterval(activeRoute);
        startBackgroundLocation();
        startNavigationNotification();

        return () => {
            _stopNavInterval();
            stopBackgroundLocation();
            stopNavigationNotification();
        };
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

            _announce(
                stepIdxRef.current,
                result.instruction,
                result.distance_to_next_m,
                result.status,
                hasArrived,
            );

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

            updateNavigationNotification({
                status: result.status,
                instruction: result.instruction ?? null,
                nextInstruction: result.next_instruction ?? null,
                distanceToNext: result.distance_to_next_m ?? null,
                progress,
                hasArrived,
            });

            if (hasArrived) {
                trackEvent('navigation_arrived');
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

    function _speak(text) {
        Speech.stop();
        Speech.speak(text, { language: 'fr-FR', pitch: 1, rate: 1 });
    }

    function _spokenDistance(meters) {
        if (meters >= 1000) {
            const km = (meters / 1000).toFixed(1).replace('.', ',');
            return `dans ${km} kilomètres`;
        }
        return `dans ${Math.round(meters / 10) * 10} mètres`;
    }

    function _announce(step, instruction, distance, status, hasArrived) {
        if (hasArrived) {
            if (!arrivedSpokenRef.current) {
                _speak("Vous êtes arrivé à destination");
                arrivedSpokenRef.current = true;
            }
            return;
        }

        if (status === 'off_route' || !instruction?.text || distance == null) return;

        if (distance <= IMMINENT_DISTANCE_M) {
            if (imminentStepRef.current !== step) {
                imminentStepRef.current = step;
                _speak(instruction.text);
            }
            return;
        }

        if (distance <= APPROACH_DISTANCE_M) {
            if (approachStepRef.current !== step) {
                approachStepRef.current = step;
                _speak(`${_spokenDistance(distance)}, ${instruction.text}`);
            }
        }
    }

    return { currentPosition, guidanceState };
}
