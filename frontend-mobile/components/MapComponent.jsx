import { useRef, useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, Text, Animated, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Map, Camera, ViewAnnotation, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export default function MapComponent({
    start, end, itineraires, selectedItineraire,
    setSelectedItineraire, currentPosition, isNavigating, miniMap = false
}) {
    const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY;
    if (!MAPTILER_KEY) {
        console.warn("⚠️ EXPO_PUBLIC_MAPTILER_KEY n'est pas défini ! Assurez-vous de l'avoir dans votre .env");
    }

    const MAP_STYLES = [
        { id: "dataviz-dark", label: "Sombre", icon: "🌙" },
        { id: "outdoor-v2", label: "Outdoor", icon: "🚴" },
        { id: "openstreetmap", label: "Détaillée", icon: "🗺️" },
        { id: "streets-v2", label: "Rues", icon: "🛣️" },
        { id: "topo-v2", label: "Relief", icon: "⛰️" },
        { id: "hybrid", label: "Satellite", icon: "🛰️" },
        { id: "basic-v2", label: "Basic", icon: "🍃" },
    ];

    const { colors, typography } = useTheme();

    const [activeStyleId, setActiveStyleId] = useState("basic-v2");
    const [isLayerMenuVisible, setLayerMenuVisible] = useState(false);

    useEffect(() => {
        const loadSavedStyle = async () => {
            const savedStyle = await AsyncStorage.getItem('userMapStyle');
            if (savedStyle) {
                setActiveStyleId(savedStyle);
            }
        };
        loadSavedStyle();
    }, []);

    const handleStyleChange = async (id) => {
        setActiveStyleId(id);
        setLayerMenuVisible(false);
        await AsyncStorage.setItem('userMapStyle', id);
    };

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
                    coordinates: it.path.map(p => [parseFloat(p[1]), parseFloat(p[0])])
                }
            }))
        };
    }, [itineraires, selectedItineraire]);

    const cameraRef = useRef(null);

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
                activeRoute.path.forEach(p => points.push([parseFloat(p[1]), parseFloat(p[0])]));
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
                padding: miniMap ? { top: 40, right: 40, bottom: 40, left: 40 } : { top: 250, right: 50, bottom: 50, left: 50 },
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

    const screenHeight = Dimensions.get('window').height;
    const slideAnim = useRef(new Animated.Value(screenHeight)).current;

    useEffect(() => {
        if (isLayerMenuVisible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 7
            }).start();
        }
    }, [isLayerMenuVisible]);

    const closeMenu = () => {
        Animated.timing(slideAnim, {
            toValue: screenHeight,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setLayerMenuVisible(false);
        });
    };

    return (
        <View style={styles.container}>
            <Map
                style={styles.map}
                mapStyle={`https://api.maptiler.com/maps/${activeStyleId}/style.json?key=${MAPTILER_KEY}`}
                logo={false}
                attribution={true}
                attributionPosition={{ bottom: 8, left: 8 }}
                compass={!miniMap}
                compassPosition={{ bottom: 80, right: 20 }}
                compassHiddenFacingNorth={false}
            >
                <Camera ref={cameraRef} {...cameraSettings} />

                {start?.lat && (
                    <ViewAnnotation id="start" lngLat={[parseFloat(start.lon), parseFloat(start.lat)]} anchor="center">
                        <MaterialCommunityIcons name="circle-slice-8" size={20} color={colors.primary} />
                    </ViewAnnotation>
                )}

                {end?.lat && (
                    <ViewAnnotation id="end" lngLat={[parseFloat(end.lon), parseFloat(end.lat)]} anchor="center">
                        <MaterialCommunityIcons name="circle-slice-8" size={20} color={colors.error} />
                    </ViewAnnotation>
                )}

                {currentPosition && (
                    <ViewAnnotation
                        id="current"
                        lngLat={[currentPosition.lon, currentPosition.lat]}
                        anchor="center"
                    >
                        <View style={{ transform: [{ rotate: `${currentPosition.heading ?? 0}deg` }] }}>
                            <MaterialCommunityIcons name="navigation" size={28} color={colors.primary} />
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
                            paint={{ lineColor: colors.inactiveRoute, lineWidth: 4 }}
                            layout={{ lineJoin: 'round', lineCap: 'round' }}
                            hitbox={{ width: 44, height: 44 }}
                        />
                        <Layer
                            id="active-route"
                            type="line"
                            filter={['==', ['get', 'isSelected'], true]}
                            paint={{ lineColor: colors.activeRoute, lineWidth: 6 }}
                            layout={{ lineJoin: 'round', lineCap: 'round' }}
                            hitbox={{ width: 44, height: 44 }}
                        />
                    </GeoJSONSource>
                )}
            </Map>

            <TouchableOpacity
                style={[styles.layerButton, { backgroundColor: colors.bgSurface }]}
                onPress={() => setLayerMenuVisible(true)}
            >
                <MaterialCommunityIcons name="layers-outline" size={26} color={colors.textMain} />
            </TouchableOpacity>

            <Modal
                visible={isLayerMenuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeMenu}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={closeMenu}
                >
                    <Animated.View
                        style={[
                            styles.modalContent,
                            {
                                transform: [{ translateY: slideAnim }],
                                backgroundColor: colors.bgMain
                            }
                        ]}
                    >
                        <Text style={[styles.modalTitle, typography.h1, { fontSize: 20, color: colors.textMain }]}>
                            Fonds de carte
                        </Text>
                        {MAP_STYLES.map((style) => (
                            <TouchableOpacity
                                key={style.id}
                                style={styles.layerOption}
                                onPress={() => {
                                    handleStyleChange(style.id);
                                    closeMenu();
                                }}
                            >
                                <Text style={styles.layerEmoji}>{style.icon}</Text>
                                <Text style={[
                                    styles.layerText,
                                    typography.body,
                                    { color: colors.textSecondary },
                                    activeStyleId === style.id && { color: colors.primary, fontWeight: 'bold' }
                                ]}>
                                    {style.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    layerButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        padding: 10,
        borderRadius: 50,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        borderRadius: 20,
        padding: 20,
        width: '80%',
        alignItems: 'flex-start',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    layerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        width: '100%',
    },
    layerEmoji: {
        fontSize: 22,
    },
    layerText: {
        fontSize: 16,
        marginLeft: 15,
    },
    activeLayerText: {
        fontWeight: 'bold',
    }
});
