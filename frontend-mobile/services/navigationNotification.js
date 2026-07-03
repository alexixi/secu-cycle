import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { formatDistance } from '../utils/format';
import * as NavNotification from '../modules/nav-notification';

let isActive = false;
let lastSignature = null;

export async function startNavigationNotification() {
    if (Platform.OS !== 'android') return;

    try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return;

        isActive = true;
        lastSignature = null;
        await NavNotification.start();
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

function _buildPayload(guidance) {
    if (guidance.hasArrived) {
        return {
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
