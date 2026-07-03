import { Alert, DeviceEventEmitter } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

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
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (foreground.status !== 'granted') {
        Alert.alert("Permission requise", "Le GPS est nécessaire pour la navigation.");
        return;
    }

    const background = await Location.requestBackgroundPermissionsAsync();
    if (background.status !== 'granted') {
        Alert.alert(
            "Mode restreint",
            "La navigation s'arrêtera si vous verrouillez votre téléphone. Autorisez 'Toujours' dans les paramètres pour corriger ça."
        );
        return;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 2000,
        distanceInterval: 5,
        foregroundService: {
            notificationTitle: "Sécu'Cycle",
            notificationBody: "Guidage en cours",
            notificationColor: "#646cff",
            killServiceOnDestroy: true,
        },
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
    });
};

export const stopBackgroundLocation = async () => {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
    if (isRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    }
};
