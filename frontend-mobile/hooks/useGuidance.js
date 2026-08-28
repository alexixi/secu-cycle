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
import i18n from '../i18n';
import { bcp47, makeFormatters } from '../utils/datetime';

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
    const pathSentRef = useRef(false);

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
        pathSentRef.current = false;
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

            const sendPath = !pathSentRef.current;

            const result = await updateNavigation(
                pos.lat,
                pos.lon,
                stepIdxRef.current,
                activeRoute.nodes,
                activeRoute.maneuvers,
                sendPath ? activeRoute.path : null,
            );

            if (!result) return;
            if (sendPath) pathSentRef.current = true;

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
        // La voix suit la langue de l'application : lire un texte anglais avec une
        // voix française le rend inintelligible en roulant.
        Speech.speak(text, { language: bcp47(i18n.language), pitch: 1, rate: 1 });
    }

    function _spokenDistance(meters) {
        // Le séparateur décimal vient d'Intl et non d'un replace(',') : la virgule
        // française et le point anglais se choisissent seuls.
        const f = makeFormatters(i18n.language);
        if (meters >= 1000) {
            return i18n.t('itineraire.guidage.parleDansKilometres', {
                distance: f.nombre(meters / 1000, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
            });
        }
        return i18n.t('itineraire.guidage.parleDansMetres', {
            distance: f.nombre(Math.round(meters / 10) * 10),
        });
    }

    function _announce(step, instruction, distance, status, hasArrived) {
        if (hasArrived) {
            if (!arrivedSpokenRef.current) {
                _speak(i18n.t('itineraire.guidage.parleArrive'));
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
