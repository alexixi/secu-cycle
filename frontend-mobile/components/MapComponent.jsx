import { useRef, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Map, Camera, Marker, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MapComponent({
    start, end, itineraires, selectedItineraire,
    setSelectedItineraire, currentPosition, isNavigating
}) {
    const cameraRef = useRef(null);
    const mapStyle = `https://api.maptiler.com/maps/basic-v2/style.json?key=${process.env.EXPO_PUBLIC_MAPTILER_KEY}`;

    const routesGeoJSON = useMemo(() => {
        if (!itineraires) return null;
        return {
            type: 'FeatureCollection',
            features: itineraires.map(it => ({
                type: 'Feature',
                id: it.id,
                properties: { id: it.id, isSelected: selectedItineraire === it.id },
                geometry: {
                    type: 'LineString',
                    coordinates: it.path.map(p => [parseFloat(p.lon), parseFloat(p.lat)])
                }
            }))
        };
    }, [itineraires, selectedItineraire]);

    const cameraSettings = useMemo(() => {
        if (isNavigating && currentPosition) {
            return {
                centerCoordinate: [currentPosition.lon, currentPosition.lat],
                pitch: 60,
                heading: currentPosition.heading ?? 0,
                zoomLevel: 18,
                animationDuration: 600,
            };
        }

        const points = [];
        if (start?.lat && start?.lon) points.push([parseFloat(start.lon), parseFloat(start.lat)]);
        if (end?.lat && end?.lon) points.push([parseFloat(end.lon), parseFloat(end.lat)]);
        if (selectedItineraire && itineraires) {
            const activeRoute = itineraires.find(it => it.id === selectedItineraire);
            if (activeRoute?.path) {
                activeRoute.path.forEach(p => points.push([parseFloat(p.lon), parseFloat(p.lat)]));
            }
        }

        if (points.length === 1) {
            return { centerCoordinate: points[0], zoomLevel: 14, animationDuration: 1000 };
        } else if (points.length >= 2) {
            const lons = points.map(p => p[0]);
            const lats = points.map(p => p[1]);
            return {
                bounds: {
                    ne: [Math.max(...lons), Math.max(...lats)],
                    sw: [Math.min(...lons), Math.min(...lats)],
                    paddingTop: 280, paddingRight: 50, paddingBottom: 50, paddingLeft: 50,
                },
                animationDuration: 1000,
            };
        }

        return { centerCoordinate: [-0.5795, 44.8378], zoomLevel: 12 };
    }, [start, end, selectedItineraire, itineraires, isNavigating, currentPosition]);

    const onRoutePress = (event) => {
        if (event.features && event.features.length > 0) {
            setSelectedItineraire(event.features[0].properties.id);
        }
    };

    return (
        <View style={styles.container}>
            <Map
                style={styles.map}
                mapStyle={mapStyle}
                logoEnabled={false}
                attributionEnabled={true}
            >
                <Camera ref={cameraRef} {...cameraSettings} />

                {start?.lat && (
                    <Marker id="start" coordinate={[parseFloat(start.lon), parseFloat(start.lat)]} anchor={{ x: 0.5, y: 0.5 }}>
                        <MaterialCommunityIcons name="circle-slice-8" size={20} color="#3d46f6" />
                    </Marker>
                )}
                {end?.lat && (
                    <Marker id="end" coordinate={[parseFloat(end.lon), parseFloat(end.lat)]} anchor={{ x: 0.5, y: 0.5 }}>
                        <MaterialCommunityIcons name="circle-slice-8" size={20} color="#EF4444" />
                    </Marker>
                )}

                {currentPosition && (
                    <Marker
                        id="current"
                        coordinate={[currentPosition.lon, currentPosition.lat]}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={{ transform: [{ rotate: `${currentPosition.heading ?? 0}deg` }] }}>
                            <MaterialCommunityIcons name="navigation" size={28} color="#3d46f6" />
                        </View>
                    </Marker>
                )}

                {routesGeoJSON && (
                    <GeoJSONSource
                        id="routes"
                        data={routesGeoJSON}
                        onPress={onRoutePress}
                    >
                        <Layer
                            id="inactive-routes"
                            type="line"
                            filter={['!=', 'isSelected', true]}
                            paint={{ lineColor: '#A0AEC0', lineWidth: 4, lineJoin: 'round', lineCap: 'round' }}
                        />
                        <Layer
                            id="active-route"
                            type="line"
                            filter={['==', 'isSelected', true]}
                            paint={{ lineColor: '#3d46f6', lineWidth: 6, lineJoin: 'round', lineCap: 'round' }}
                        />
                    </GeoJSONSource>
                )}
            </Map>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 }
});
