import { useState, useRef, useEffect, useCallback } from 'react';
import * as Speech from 'expo-speech';

import { pointForCenter, weatherSummary, rainBanner, formatHM } from '../services/weather';
import { notifyWeather, resetWeatherNotifications } from '../services/weatherNotification';
import i18n from '../i18n';
import { bcp47 } from '../utils/datetime';

// Même structure que `useHazardAlerts` : une seule alerte visible à la fois, un
// `Set` de ce qui a déjà été annoncé, remis à zéro à la fin de la navigation.
const SEVERITY_RANK = { none: 0, watch: 1, warning: 2, severe: 3 };

// Fenêtre de dédoublonnage des alertes de pluie. Le nowcast avance par pas de
// 15 minutes : sans cette clé, `rainBanner` renverrait le même message à chaque
// point GPS et l'alerte se rejouerait en boucle.
const RAIN_BUCKET_MS = 15 * 60 * 1000;

const HAZARD_ICONS = {
    hail: '🧊',
    thunderstorm: '⛈️',
    ice: '🧊',
    freezing: '❄️',
    snow: '🌨️',
    gust: '💨',
    heavy_rain: '🌧️',
    fog: '🌫️',
};

/**
 * Alertes météo pendant la navigation : bandeau, annonce vocale et notification.
 *
 * Ne déclenche rien hors navigation : l'utilisateur qui consulte la carte voit
 * déjà la légende de la couche météo, l'interrompre serait du bruit.
 */
export default function useWeatherAlerts(weatherData, currentPosition, isNavigating) {
    const [activeAlert, setActiveAlert] = useState(null);
    const announcedRef = useRef(new Set());

    useEffect(() => {
        if (!isNavigating) {
            announcedRef.current = new Set();
            resetWeatherNotifications();
            setActiveAlert(null);
        }
    }, [isNavigating]);

    useEffect(() => {
        if (!isNavigating || !weatherData || activeAlert) return;

        // Le relevé le plus proche de la position, pas celui de la zone : en
        // navigation, c'est justement la position qui bouge. Gardé en variable :
        // `rainBanner` a besoin du relevé lui-même, pas de son résumé.
        const point = pointForCenter(weatherData, currentPosition);
        const summary = weatherSummary(point);
        if (!summary) return;

        const candidates = [];

        // 1. Vigilance du backend : c'est ce sur quoi on peut réellement agir
        //    (se mettre à l'abri, renoncer), donc priorité maximale.
        for (const alert of summary.alerts || []) {
            if (SEVERITY_RANK[alert.level] < SEVERITY_RANK.warning) continue;
            candidates.push({
                key: `alert-${alert.key}-${alert.at || 'now'}`,
                rank: SEVERITY_RANK[alert.level],
                level: alert.level,
                icon: HAZARD_ICONS[alert.key] || '⚠️',
                title: alert.label,
                // La provenance n'est affichée que pour les vigilances officielles :
                // c'est ce qui distingue un bulletin d'institut de nos seuils.
                body: (alert.at
                    ? i18n.t('meteo.alerte.prevuVers', { heure: formatHM(alert.at) || alert.at })
                    : i18n.t('meteo.alerte.enCours'))
                    + (alert.official && alert.source ? i18n.t('meteo.alerte.source', { source: alert.source }) : ''),
                spoken: alert.at
                    ? i18n.t('meteo.alerte.parlePrevu', { alerte: alert.label, heure: formatHM(alert.at) || '' })
                    : i18n.t('meteo.alerte.parleEnCours', { alerte: alert.label }),
            });
        }

        // 2. Début d'averse dans la demi-heure.
        const rain = rainBanner(point);
        if (rain?.kind === 'onset') {
            const imminent = (rain.minutes ?? 99) <= 15;
            candidates.push({
                key: `rain-${Math.floor(Date.now() / RAIN_BUCKET_MS)}`,
                rank: imminent ? 2 : 1,
                level: imminent ? 'warning' : 'watch',
                icon: '🌧️',
                title: imminent ? i18n.t('meteo.alerte.averseImminente') : i18n.t('meteo.alerte.pluieApproche'),
                body: rain.text,
                spoken: imminent
                    ? i18n.t('meteo.alerte.parleAverseImminente')
                    : i18n.t('meteo.alerte.parlePluieDans', { minutes: rain.minutes }),
            });
        }

        const best = candidates
            .filter((candidate) => !announcedRef.current.has(candidate.key))
            .sort((a, b) => b.rank - a.rank)[0];
        if (!best) return;

        announcedRef.current.add(best.key);
        Speech.stop();
        // La voix suit la langue de l'application : une voix française lisant de
        // l'anglais est inintelligible, et bien plus gênante qu'un libellé non traduit.
        Speech.speak(best.spoken, { language: bcp47(i18n.language), pitch: 1, rate: 1 });
        // Sans await : une notification lente ne doit pas retarder le bandeau.
        notifyWeather(best);
        setActiveAlert(best);
    }, [weatherData, currentPosition, isNavigating, activeAlert]);

    const dismissAlert = useCallback(() => setActiveAlert(null), []);

    return { activeAlert, dismissAlert };
}
