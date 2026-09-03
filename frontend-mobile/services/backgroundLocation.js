import { Alert, DeviceEventEmitter } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { hasAcceptedBackgroundLocation } from './locationDisclosure';
import i18n from '../i18n';

export const LOCATION_TASK = 'background-location-task';
export const BACKGROUND_LOCATION_EVENT = 'background-location';

TaskManager.defineTask(LOCATION_TASK, ({ data, error }) => {
    if (error) {
        console.error("Erreur TaskManager:", error);
        return;
    }
    if (data) {
        const { locations } = data;
        const location = locations?.[0];
        if (location?.coords) {
            DeviceEventEmitter.emit(BACKGROUND_LOCATION_EVENT, location.coords);
        }
    }
});

export const startBackgroundLocation = async () => {
    if (!(await hasAcceptedBackgroundLocation())) return;

    const foreground = await Location.requestForegroundPermissionsAsync();
    if (foreground.status !== 'granted') {
        Alert.alert(
            i18n.t('notification.localisation.permissionRequise'),
            i18n.t('notification.localisation.gpsNecessaire'),
        );
        return;
    }

    const background = await Location.requestBackgroundPermissionsAsync();
    if (background.status !== 'granted') {
        Alert.alert(
            i18n.t('notification.localisation.modeRestreint'),
            i18n.t('notification.localisation.modeRestreintTexte'),
        );
        return;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 2000,
        distanceInterval: 5,
        foregroundService: {
            notificationTitle: "Sécu'Cycle",
            notificationBody: i18n.t('notification.localisation.corps'),
            notificationColor: "#646cff",
            killServiceOnDestroy: true,
        },
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
    });
};

export const stopBackgroundLocation = async () => {
    try {
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
        if (hasStarted) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK);
        }
    } catch (error) {
        console.warn("stopBackgroundLocation:", error?.message ?? error);
    }
};
