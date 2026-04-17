import { useRef, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Map, Camera, ViewAnnotation, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MapComponent({
    start, end, itineraires, selectedItineraire,
    setSelectedItineraire, currentPosition, isNavigating, customPadding = { top: 250, right: 50, bottom: 50, left: 50 }
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
                center: [currentPosition.lon, currentPosition.lat],
                pitch: 60,
                bearing: currentPosition.heading ?? 0,
                zoom: 18,
                duration: 600,
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
            return {
                center: points[0],
                zoom: 14,
                duration: 1000,
            };
        } else if (points.length >= 2) {
            const lons = points.map(p => p[0]);
            const lats = points.map(p => p[1]);
            return {
                bounds: [
                    Math.min(...lons),
                    Math.min(...lats),
                    Math.max(...lons),
                    Math.max(...lats),
                ],
                padding: customPadding,
                duration: 1000,
            };
        }

        return {
            center: [-0.5795, 44.8378],
            zoom: 12,
        };
    }, [start, end, selectedItineraire, itineraires, isNavigating, currentPosition]);

    const onRoutePress = (event) => {
        const native = event?.nativeEvent || {};
        const features = native?.features || [];
        const id = features?.[0]?.properties?.id;
        if (id) { setSelectedItineraire(id); }
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
                    <ViewAnnotation id="start" lngLat={[parseFloat(start.lon), parseFloat(start.lat)]} anchor="center">
                        <MaterialCommunityIcons name="circle-slice-8" size={20} color="#3d46f6" />
                    </ViewAnnotation>
                )}

                {end?.lat && (
                    <ViewAnnotation id="end" lngLat={[parseFloat(end.lon), parseFloat(end.lat)]} anchor="center">
                        <MaterialCommunityIcons name="circle-slice-8" size={20} color="#EF4444" />
                    </ViewAnnotation>
                )}

                {currentPosition && (
                    <ViewAnnotation
                        id="current"
                        lngLat={[currentPosition.lon, currentPosition.lat]}
                        anchor="center"
                    >
                        <View style={{ transform: [{ rotate: `${currentPosition.heading ?? 0}deg` }] }}>
                            <MaterialCommunityIcons name="navigation" size={28} color="#3d46f6" />
                        </View>
                    </ViewAnnotation>
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
                            filter={['!=', ['get', 'isSelected'], true]}
                            paint={{ lineColor: '#A0AEC0', lineWidth: 4 }}
                            layout={{ lineJoin: 'round', lineCap: 'round' }}
                            hitbox={{ width: 44, height: 44 }}
                        />
                        <Layer
                            id="active-route"
                            type="line"
                            filter={['==', ['get', 'isSelected'], true]}
                            paint={{ lineColor: '#3d46f6', lineWidth: 6 }}
                            layout={{ lineJoin: 'round', lineCap: 'round' }}
                            hitbox={{ width: 44, height: 44 }}
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
