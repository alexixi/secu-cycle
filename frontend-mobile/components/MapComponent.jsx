import { useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MapComponent({
    start,
    end,
    itineraires,
    selectedItineraire,
    setSelectedItineraire
}) {
    const mapRef = useRef(null);

    useEffect(() => {
        if (!mapRef.current) return;

        const points = [];
        if (start?.lat && start?.lon) points.push({ latitude: parseFloat(start.lat), longitude: parseFloat(start.lon) });
        if (end?.lat && end?.lon) points.push({ latitude: parseFloat(end.lat), longitude: parseFloat(end.lon) });

        if (selectedItineraire && itineraires) {
            const activeRoute = itineraires.find(it => it.id === selectedItineraire);
            if (activeRoute?.path) {
                activeRoute.path.forEach(p => points.push({ latitude: p[0], longitude: p[1] }));
            }
        }

        if (points.length === 1) {
            mapRef.current.animateToRegion({
                ...points[0],
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
            }, 1000);
        } else if (points.length >= 2) {
            mapRef.current.fitToCoordinates(points, {
                edgePadding: { top: 200, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
        }
    }, [start, end, selectedItineraire]);

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    latitude: 44.8378,
                    longitude: -0.5795,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >
                {start?.lat && (
                    <Marker
                        key={`start-${start.lat}`}
                        coordinate={{ latitude: parseFloat(start.lat), longitude: parseFloat(start.lon) }}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <MaterialCommunityIcons name="circle-slice-8" size={20} color="#3d46f6" />
                    </Marker>
                )}

                {end?.lat && (
                    <Marker
                        key={`end-${end.lat}`}
                        coordinate={{ latitude: parseFloat(end.lat), longitude: parseFloat(end.lon) }}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <MaterialCommunityIcons name="circle-slice-8" size={20} color="#EF4444" />
                    </Marker>
                )}

                {itineraires && itineraires.map((itineraire) => {
                    const isSelected = selectedItineraire === itineraire.id;

                    const coords = itineraire.path.map(p => ({
                        latitude: p[0],
                        longitude: p[1]
                    }));

                    return (
                        <Polyline
                            key={itineraire.id}
                            coordinates={coords}
                            strokeColor={isSelected ? "#3d46f6" : "#A0AEC0"}
                            strokeWidth={isSelected ? 6 : 4}
                            lineDashPattern={isSelected ? null : [5, 5]}
                            tappable={true}
                            onPress={() => setSelectedItineraire(itineraire.id)}
                            zIndex={isSelected ? 10 : 1}
                        />
                    );
                })}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    }
});