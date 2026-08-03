import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { areWeatherAlertsEnabled } from './notificationPreference';

// Alertes météo en notification locale.
//
// ⚠️ Tout ici doit rester du JavaScript pur. Le canal Android est créé à
// l'exécution (`setNotificationChannelAsync`) et non déclaré dans la config du
// plugin `expo-notifications` : une entrée de plugin entrerait dans l'empreinte
// native calculée par `.github/workflows/mobile-ota.yml`, ce qui imposerait un
// rebuild et une resoumission au Play Store. En restant en JS, la fonctionnalité
// part par `eas update`.
//
// Conséquence à connaître : une fois le canal créé, Android n'autorise plus le
// code à en modifier l'importance ni le son. Ils sont donc choisis du premier
// coup ; les changer exigerait un nouvel identifiant de canal.
const CHANNEL_ID = 'weather-alerts';

let handlerInstalled = false;
let channelReady = false;

// Dédoublonnage à l'échelle d'une session de navigation : sans lui, la même
// alerte se rejouerait à chaque point GPS.
const posted = new Set();

/**
 * Pose le gestionnaire de présentation des notifications.
 *
 * Il n'en existait aucun dans l'application : sans lui, une notification reçue
 * alors que l'app est au premier plan ne s'affiche tout simplement pas.
 *
 * Appelé au démarrage (`app/_layout.jsx`) et par sécurité avant chaque envoi.
 */
export function ensureNotificationHandler() {
    if (handlerInstalled) return;
    Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
            const isWeather = notification.request.content.data?.kind === 'weather';
            return {
                // Au premier plan, le bandeau `WeatherAlert` est déjà affiché :
                // empiler une bannière système par-dessus ferait doublon. On
                // garde le son, qui lui porte l'information hors du regard.
                shouldShowBanner: !isWeather,
                shouldShowList: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
            };
        },
    });
    handlerInstalled = true;
}

async function ensureChannel() {
    if (channelReady || Platform.OS !== 'android') {
        channelReady = true;
        return;
    }
    try {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
            name: 'Alertes météo',
            description: "Averse, grêle, orage ou verglas pendant un trajet.",
            // HIGH, contrairement au canal de guidage qui est en LOW : celui-ci
            // doit percer alors que le téléphone est en mode navigation.
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#646cff',
            sound: 'default',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
    } catch (e) {
        console.warn('Canal de notifications météo non créé :', e);
    }
    channelReady = true;
}

/** Vide le dédoublonnage — à appeler à la fin d'une navigation. */
export function resetWeatherNotifications() {
    posted.clear();
}

/**
 * Envoie une alerte météo, si l'utilisateur les a laissées actives.
 *
 * `alert.key` sert au dédoublonnage. Ne demande jamais la permission : elle est
 * gérée dans l'écran de réglages, et solliciter l'utilisateur en plein trajet
 * serait le pire moment.
 */
export async function notifyWeather(alert) {
    if (!alert?.key || posted.has(alert.key)) return;
    if (!(await areWeatherAlertsEnabled())) return;

    try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') return;
    } catch {
        return;
    }

    ensureNotificationHandler();
    await ensureChannel();
    posted.add(alert.key);

    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: alert.title,
                body: alert.body,
                data: { kind: 'weather' },
                sound: 'default',
                ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
                ...(Platform.OS === 'ios' ? { interruptionLevel: 'timeSensitive' } : {}),
            },
            trigger: null,   // immédiat
        });
    } catch (e) {
        // Remis dans la file : un échec ponctuel ne doit pas condamner l'alerte
        // pour toute la session.
        posted.delete(alert.key);
        console.warn('Notification météo impossible :', e);
    }
}
