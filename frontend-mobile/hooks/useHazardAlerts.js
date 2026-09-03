import { useState, useRef, useEffect, useCallback } from 'react';
import * as Speech from 'expo-speech';
import { haversineDistance } from '../services/guidanceEngine';
import i18n from '../i18n';
import { bcp47 } from '../utils/datetime';


const ALERT_DISTANCE_M = 150;
const ON_ROUTE_M = 40;
function spokenDistance(meters) {
    return i18n.t('signalement.alerte.distanceMetres', {
        n: Math.max(10, Math.round(meters / 10) * 10),
    });
}

export default function useHazardAlerts(reports, currentPosition, activeRoute, isNavigating) {
    const [activeAlert, setActiveAlert] = useState(null);
    const announcedRef = useRef(new Set());

    useEffect(() => {
        if (!isNavigating) {
            announcedRef.current = new Set();
            setActiveAlert(null);
        }
    }, [isNavigating]);

    useEffect(() => {
        if (!isNavigating || !currentPosition || !activeRoute?.path?.length) return;
        if (!reports?.length || activeAlert) return;

        const points = activeRoute.path.map(p => [parseFloat(p[1]), parseFloat(p[0])]);
        const userPos = [currentPosition.lon, currentPosition.lat];

        let userIdx = 0;
        let userIdxDist = Infinity;
        points.forEach((p, i) => {
            const d = haversineDistance(userPos, p);
            if (d < userIdxDist) { userIdxDist = d; userIdx = i; }
        });

        for (const report of reports) {
            if (announcedRef.current.has(report.id)) continue;

            const rPos = [parseFloat(report.longitude), parseFloat(report.latitude)];

            let routeDist = Infinity;
            let rIdx = 0;
            points.forEach((p, i) => {
                const d = haversineDistance(rPos, p);
                if (d < routeDist) { routeDist = d; rIdx = i; }
            });

            if (routeDist > ON_ROUTE_M) continue;
            if (rIdx < userIdx - 2) continue;

            const userDist = haversineDistance(userPos, rPos);
            if (userDist > ALERT_DISTANCE_M) continue;

            announcedRef.current.add(report.id);
            // Le type de signalement partage ses identifiants avec la carte et l'API.
            // i18n-suffixes: accident travaux danger obstacle
            const label = i18n.t(`carte.signalement.${report.report_type}`);
            Speech.stop();
            Speech.speak(
                i18n.t('signalement.alerte.parle', { danger: label, distance: spokenDistance(userDist) }),
                { language: bcp47(i18n.language), pitch: 1, rate: 1 },
            );
            setActiveAlert({ report, distance: Math.round(userDist) });
            break;
        }
    }, [currentPosition, reports, activeRoute, isNavigating, activeAlert]);

    const dismissAlert = useCallback(() => setActiveAlert(null), []);

    return { activeAlert, dismissAlert };
}
