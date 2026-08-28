import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import i18n from '../i18n';
import { formatDistance } from '../utils/format';
import * as NavNotification from '../modules/nav-notification';
import { areNotificationsEnabled } from './notificationPreference';

let isActive = false;
let lastSignature = null;

export async function startNavigationNotification() {
    if (Platform.OS !== 'android') return;
    if (!(await areNotificationsEnabled())) return;

    try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return;

        isActive = true;
        lastSignature = null;
        // Le natif compose ses propres titres : on lui passe les libellés
        // traduits, faute de quoi il retombe sur ses valeurs françaises.
        await NavNotification.start({
            channelName: i18n.t('notification.guidage.canal'),
            startingInstruction: i18n.t('notification.guidage.demarrage'),
            startingDistanceLabel: i18n.t('notification.guidage.calcul'),
        });
    } catch (e) {
        console.warn('Notification de navigation indisponible :', e);
    }
}

export async function updateNavigationNotification(guidance) {
    if (!isActive || !guidance) return;

    const payload = _buildPayload(guidance);
    if (!payload) return;

    const signature = [
        payload.turnType,
        payload.instruction,
        payload.distanceLabel,
        payload.nextInstruction,
        payload.progress,
        payload.status,
        payload.hasArrived,
        // Sans la langue, un changement en cours de trajet laisserait la
        // notification figée : le reste de la signature, lui, n'aurait pas bougé.
        i18n.language,
    ].join('|');
    if (signature === lastSignature) return;
    lastSignature = signature;

    try {
        await NavNotification.update(payload);
    } catch (e) {
        console.warn('Mise à jour de la notification impossible :', e);
    }
}

export async function stopNavigationNotification() {
    if (Platform.OS !== 'android') return;

    isActive = false;
    lastSignature = null;
    try {
        await NavNotification.stop();
    } catch {

    }
}

// Libellés que la notification Android assemble elle-même. Relus à chaque envoi
// plutôt que mémorisés : la langue peut changer pendant un trajet.
function _labels() {
    return {
        arrivedTitle: i18n.t('notification.guidage.arrive'),
        rerouteTitle: i18n.t('notification.guidage.recalcul'),
        fallbackTitle: i18n.t('notification.guidage.titreParDefaut'),
        // Le natif recolle « préfixe instruction » : on ne lui donne que le
        // préfixe, d'où l'interpolation vidée de sa variable.
        nextPrefix: i18n.t('notification.guidage.ensuite', { instruction: '' }).trim(),
    };
}

function _buildPayload(guidance) {
    if (guidance.hasArrived) {
        return {
            ..._labels(),
            hasArrived: true,
            progress: 1,
            turnType: 'arrive',
            instruction: null,
            distanceLabel: null,
            nextInstruction: null,
            status: null,
        };
    }

    if (guidance.status === 'off_route') {
        return {
            ..._labels(),
            status: 'off_route',
            progress: guidance.progress ?? 0,
            hasArrived: false,
            turnType: null,
            instruction: null,
            distanceLabel: null,
            nextInstruction: null,
        };
    }

    if (!guidance.instruction?.text) return null;

    return {
        ..._labels(),
        turnType: guidance.instruction.turn_type ?? null,
        instruction: guidance.instruction.text,
        distanceLabel: guidance.distanceToNext != null
            ? formatDistance(guidance.distanceToNext)
            : null,
        nextInstruction: guidance.nextInstruction?.text ?? null,
        progress: guidance.progress ?? 0,
        status: guidance.status ?? null,
        hasArrived: false,
    };
}
