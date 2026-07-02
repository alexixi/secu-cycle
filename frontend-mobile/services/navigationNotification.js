import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { formatDistance } from '../utils/format';

const CHANNEL_ID = 'navigation-guidance';
const NOTIFICATION_ID = 'nav-guidance';

let isActive = false;
let lastSignature = null;

if (Platform.OS === 'android') {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: false,
            shouldShowList: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
        }),
    });
}

export async function startNavigationNotification() {
    if (Platform.OS !== 'android') return;

    try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return;

        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
            name: 'Navigation',
            importance: Notifications.AndroidImportance.LOW,
            sound: null,
            enableVibrate: false,
            showBadge: false,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });

        isActive = true;
        lastSignature = null;
        await _post('Navigation en cours', 'Calcul du guidage...');
    } catch (e) {
        console.warn('Notification de navigation indisponible :', e);
    }
}

export async function updateNavigationNotification(guidance) {
    if (!isActive || !guidance) return;

    let title;
    let body = '';

    if (guidance.hasArrived) {
        title = 'Vous êtes arrivé !';
    } else if (guidance.status === 'off_route') {
        title = "Recalcul de l'itinéraire...";
    } else if (guidance.instruction?.text) {
        title = guidance.instruction.text;
        const distance = formatDistance(guidance.distanceToNext);
        const percent = guidance.progress != null
            ? `${Math.round(guidance.progress * 100)} %`
            : null;
        body = [distance, percent].filter(Boolean).join(' • ');
    } else {
        return;
    }

    const signature = `${title}|${body}`;
    if (signature === lastSignature) return;
    lastSignature = signature;

    try {
        await _post(title, body);
    } catch (e) {
        console.warn('Mise à jour de la notification impossible :', e);
    }
}

export async function stopNavigationNotification() {
    if (Platform.OS !== 'android') return;

    isActive = false;
    lastSignature = null;
    try {
        await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
    } catch {

    }
}

async function _post(title, body) {
    await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_ID,
        content: {
            title,
            body,
            sticky: true,
            autoDismiss: false,
            color: '#646cff',
            sound: false,
        },
        trigger: { channelId: CHANNEL_ID },
    });
}
