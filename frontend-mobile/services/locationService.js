import * as Location from 'expo-location';

let subscription = null;

export async function startTracking(callback) {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        throw new Error('Permission GPS refusée');
    }

    // Si un watcher tourne déjà, on le stoppe proprement
    if (subscription) {
        subscription.remove();
        subscription = null;
    }

    subscription = await Location.watchPositionAsync(
        {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 3,   // émet si déplacé de 3m minimum
            timeInterval: 1000,    // ou toutes les 1s
        },
        (location) => {
            callback({
                lat: location.coords.latitude,
                lon: location.coords.longitude,
                heading: location.coords.heading ?? 0,
                speed: location.coords.speed ?? 0,
            });
        }
    );
}

export function stopTracking() {
    if (subscription) {
        subscription.remove();
        subscription = null;
    }
}