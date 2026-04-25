import { useRef, useState, useEffect, useMemo, use } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, Text, Animated, Dimensions, Alert, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Map, Camera, ViewAnnotation, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { getReports, createReport, deleteReport } from '../services/apiBack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

export default function MapComponent({
    start, end, itineraires, selectedItineraire,
    setSelectedItineraire, currentPosition, isNavigating,
    canReport, miniMap = false
}) {
    const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY;
    if (!MAPTILER_KEY) {
        console.warn("⚠️ EXPO_PUBLIC_MAPTILER_KEY n'est pas défini ! Assurez-vous de l'avoir dans votre .env");
    }

    const { colors, typography } = useTheme();
    const { token } = useAuth();

    const MAP_STYLES = [
        { id: "dataviz-dark", label: "Sombre", icon: "🌙" },
        { id: "outdoor-v2", label: "Outdoor", icon: "🚴" },
        { id: "openstreetmap", label: "Détaillée", icon: "🗺️" },
        { id: "streets-v2", label: "Rues", icon: "🛣️" },
        { id: "topo-v2", label: "Relief", icon: "⛰️" },
        { id: "hybrid", label: "Satellite", icon: "🛰️" },
        { id: "basic-v2", label: "Basic", icon: "🍃" },
    ];

    const REPORT_TYPES = [
        { id: 'accident', label: 'Accident', icon: '🚨' },
        { id: 'travaux', label: 'Travaux', icon: '🚧' },
        { id: 'danger', label: 'Danger', icon: '⚠️' },
        { id: 'obstacle', label: 'Obstacle', icon: '🪨' },
    ];

    const [activeStyleId, setActiveStyleId] = useState("basic-v2");
    const [isLayerMenuVisible, setLayerMenuVisible] = useState(false);
    const [isReportMenuVisible, setIsReportMenuVisible] = useState(false);
    const [selectedReportType, setSelectedReportType] = useState(null);
    const [reportDescription, setReportDescription] = useState("");
    const [reports, setReports] = useState([]);
    const [activeReport, setActiveReport] = useState(null);
    const [recenterTrigger, setRecenterTrigger] = useState(0);
    const [compassHeading, setCompassHeading] = useState(0);
    const lastHeadingRef = useRef(0);
    const lastUpdateRef = useRef(0);
    const headingKey = useMemo(() =>
        Math.round(compassHeading / 5) * 5
        , [compassHeading]);

    useEffect(() => {
        let subscription;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            subscription = await Location.watchHeadingAsync((headingObj) => {
                if (headingObj && headingObj.magHeading !== undefined) {
                    const newHeading = Math.round(headingObj.magHeading);
                    const diff = Math.abs(newHeading - lastHeadingRef.current);
                    const now = Date.now();
                    const timeElapsed = now - lastUpdateRef.current;
                    if (timeElapsed >= 1000 && diff > 5 && diff < 355) {
                        lastHeadingRef.current = newHeading;
                        setCompassHeading(newHeading);
                    }
                }
            });
        })();

        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, []);

    useEffect(() => {
        getReports().then(setReports).catch(console.error);
    }, []);

    useEffect(() => {
        const loadSavedStyle = async () => {
            const savedStyle = await AsyncStorage.getItem('userMapStyle');
            if (savedStyle) {
                setActiveStyleId(savedStyle);
            }
        };
        loadSavedStyle();
    }, []);

    const handleRecenter = () => {
        if (!currentPosition || !cameraRef.current) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                "Position introuvable",
                "Veuillez patienter pendant la recherche de votre position GPS."
            );
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });

        cameraRef.current.flyTo({
            center: [currentPosition.lon, currentPosition.lat],
            zoom: 16,
            duration: 1500,
        });

    };

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
                bearing: compassHeading || 0,
                zoom: 18,
                duration: 600,
                easing: "fly",
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
                easing: "fly",
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
                easing: "fly",
            };
        }
        if (currentPosition && !start?.lat && !end?.lat) {
            return {
                center: [currentPosition.lon, currentPosition.lat],
                pitch: 0,
                zoom: 15,
                duration: 1000,
                easing: "fly",
            };
        }
        return {
            center: [-0.5795, 44.8378],
            pitch: 0,
            zoom: 12,
        };
    }, [start, end, selectedItineraire, itineraires, isNavigating, currentPosition, recenterTrigger]);

    const onRoutePress = (event) => {
        Haptics.selectionAsync().catch(() => { });
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

    useEffect(() => {
        if (isReportMenuVisible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 7
            }).start();
        }
    }, [isReportMenuVisible]);

    const closeMenu = (handleClose) => {
        Animated.timing(slideAnim, {
            toValue: screenHeight,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            handleClose(false);
        });
    };

    const closeLayerMenu = () => closeMenu(setLayerMenuVisible);
    const closeReportMenu = () => closeMenu(setIsReportMenuVisible);

    const handleDeleteReport = async (reportId) => {
        try {
            await deleteReport(token, reportId);
            setReports(prev => prev.filter(r => r.id !== reportId));
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            console.error("Erreur suppression signalement:", error);
        }
    };

    const handleReportSubmit = async ({ reportType, description, lat, lon }) => {
        try {
            const newReport = await createReport(token, reportType, description, lat, lon);
            setReports(prev => [...prev, newReport]);
            setSelectedReportType(null);
            setReportDescription("");
            closeReportMenu();
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            console.error("Erreur signalement:", error);
        }
    };

    return (
        <View style={styles.container}>
            <Map
                style={styles.map}
                mapStyle={`https://api.maptiler.com/maps/${activeStyleId}/style.json?key=${MAPTILER_KEY}`}
                logo={false}
                attribution={true}
                attributionPosition={{ bottom: 5, right: 5 }}
                compass={!miniMap}
                compassPosition={{ bottom: 80, right: 20 }}
                compassHiddenFacingNorth={false}
            >
                <Camera ref={cameraRef} {...cameraSettings} />

                {start?.lat && (
                    <ViewAnnotation id="start" lngLat={[parseFloat(start.lon), parseFloat(start.lat)]} anchor="center">
                        <View style={{ width: 30, height: 30, justifyContent: 'center', alignItems: 'center' }}>
                            <MaterialCommunityIcons name="circle-slice-8" size={20} color={colors.primary} />
                        </View>
                    </ViewAnnotation>
                )}

                {end?.lat && (
                    <ViewAnnotation id="end" lngLat={[parseFloat(end.lon), parseFloat(end.lat)]} anchor="center">
                        <View style={{ width: 30, height: 30, justifyContent: 'center', alignItems: 'center' }}>
                            <MaterialCommunityIcons name="circle-slice-8" size={20} color={colors.error} />
                        </View>
                    </ViewAnnotation>
                )}

                {currentPosition && (
                    <ViewAnnotation
                        key={`current-${headingKey}`}
                        id="current"
                        lngLat={[currentPosition.lon, currentPosition.lat]}
                        anchor="center"
                    >
                        <View style={{
                            width: 40,
                            height: 40,
                            justifyContent: 'center',
                            alignItems: 'center',
                            transform: [{ rotate: `${compassHeading || 0}deg` }]
                        }}>
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

                {!miniMap && reports && reports.map((report) => (
                    <ViewAnnotation
                        key={report.id}
                        id={`report-${report.id}`}
                        lngLat={[parseFloat(report.longitude), parseFloat(report.latitude)]}
                        anchor="center"
                        onPress={() => {
                            setActiveReport(report);
                            Haptics.selectionAsync();
                        }}
                        hitbox={{ width: 44, height: 44 }}
                    >
                        <Text style={{ fontSize: 24 }}>
                            {REPORT_TYPES.find(t => t.id === report.report_type)?.icon || '?'}
                        </Text>
                    </ViewAnnotation>
                ))}
            </Map>

            {!miniMap && currentPosition && (
                <TouchableOpacity
                    style={[styles.mapButton, styles.recenterButton, { backgroundColor: colors.bgSurface }]}
                    onPress={handleRecenter}
                >
                    <MaterialCommunityIcons name="crosshairs-gps" size={26} color={colors.textMain} />
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={[styles.mapButton, styles.layerButton, { backgroundColor: colors.bgSurface }]}
                onPress={() => {
                    Haptics.selectionAsync();
                    setLayerMenuVisible(true);
                }}
            >
                <MaterialCommunityIcons name="layers-outline" size={26} color={colors.textMain} />
            </TouchableOpacity>

            <Modal
                visible={isLayerMenuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeLayerMenu}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={closeLayerMenu}
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
                                    Haptics.selectionAsync();
                                    handleStyleChange(style.id);
                                    closeLayerMenu();
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

            {canReport && !miniMap && currentPosition && (
                <TouchableOpacity
                    style={[styles.mapButton, styles.reportButton, { backgroundColor: colors.bgSurface }]}
                    onPress={() => {
                        if (!currentPosition) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                            Alert.alert(
                                "Position introuvable",
                                "Veuillez patienter pendant la recherche de votre position GPS."
                            );
                            return;
                        }
                        setIsReportMenuVisible(true);
                        Haptics.selectionAsync();
                    }}
                >
                    <Ionicons name="warning-outline" size={26} color={colors.textMain} />
                </TouchableOpacity>
            )}

            <Modal
                visible={isReportMenuVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={closeReportMenu}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.reportOverlay}>

                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={closeReportMenu}
                    />

                    <Animated.View style={[styles.modalContainer, { backgroundColor: colors.bgSurface, transform: [{ translateY: slideAnim }] }]}>

                        <View style={styles.header}>
                            <Text style={[typography.h1, { fontSize: 20, color: colors.textMain }]}>Signaler un incident</Text>
                            <TouchableOpacity onPress={closeReportMenu}>
                                <Ionicons name="close" size={28} color={colors.textMain} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[typography.body, { color: colors.textSecondary, marginBottom: 15 }]}>
                            Quel type d'incident rencontrez-vous ?
                        </Text>

                        <View style={styles.grid}>
                            {REPORT_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[
                                        styles.typeCard,
                                        { backgroundColor: colors.bgMain, borderColor: colors.borderLight },
                                        selectedReportType === type.id && { borderColor: colors.primary, backgroundColor: colors.primaryLight }
                                    ]}
                                    onPress={() => {
                                        setSelectedReportType(type.id);
                                        Haptics.selectionAsync();
                                    }}
                                >
                                    <Text style={styles.typeIcon}>{type.icon}</Text>
                                    <Text style={[typography.body, { fontSize: 14, color: selectedReportType === type.id ? colors.primary : colors.textMain }]}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={[styles.input, typography.body, { backgroundColor: colors.bgMain, color: colors.textMain, borderColor: colors.borderLight }]}
                            placeholder="Description (optionnel)..."
                            placeholderTextColor={colors.textSecondary}
                            value={reportDescription}
                            onChangeText={setReportDescription}
                            multiline
                            maxLength={100}
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: selectedReportType ? colors.primary : colors.borderStrong }]}
                            disabled={!selectedReportType}
                            onPress={() => {
                                handleReportSubmit({
                                    reportType: selectedReportType,
                                    description: reportDescription,
                                    lat: currentPosition.lat,
                                    lon: currentPosition.lon
                                });
                                Haptics.selectionAsync();
                            }}
                        >
                            <Text style={[typography.body, { color: '#FFF', fontWeight: 'bold' }]}>
                                Envoyer le signalement
                            </Text>
                        </TouchableOpacity>

                    </Animated.View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal
                visible={!!activeReport}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setActiveReport(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setActiveReport(null)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.bgMain, width: '90%' }]}>

                        <View style={styles.header}>
                            <Text style={[typography.h1, { fontSize: 20, color: colors.textMain, textTransform: 'capitalize' }]}>
                                {activeReport ? REPORT_TYPES.find(t => t.id === activeReport.report_type)?.icon : ''} {activeReport?.report_type}
                            </Text>
                            <TouchableOpacity onPress={() => setActiveReport(null)}>
                                <Ionicons name="close" size={28} color={colors.textMain} />
                            </TouchableOpacity>
                        </View>

                        {activeReport?.report_description ? (
                            <Text style={[typography.body, { color: colors.textSecondary, marginBottom: 20 }]}>
                                {activeReport.report_description}
                            </Text>
                        ) : null}

                        {handleDeleteReport && (
                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: colors.error }]}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    handleDeleteReport(activeReport.id);
                                    setActiveReport(null);
                                }}
                            >
                                <Text style={[typography.body, { color: '#FFF', fontWeight: 'bold' }]}>
                                    Supprimer ce signalement
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    mapButton: {
        height: 50,
        width: 50,
        padding: 10,
        borderRadius: 50,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        alignItems: 'center',
        justifyContent: 'center',
    },
    layerButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
    },
    recenterButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
    },
    reportButton: {
        position: 'absolute',
        bottom: 80,
        left: 20,
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
    },
    reportOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 25,
        paddingBottom: 40
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20
    },
    typeCard: {
        width: '48%',
        padding: 15,
        borderRadius: 15,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeIcon: {
        fontSize: 32,
        marginBottom: 5
    },
    input: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 15,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    submitButton: {
        padding: 16,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center'
    },
    reportDetailCard: {
        borderRadius: 24,
        padding: 20,
        width: '88%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
    },
    reportDetailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 15,
        borderBottomWidth: 1,
        marginBottom: 15,
    },
    closeButton: {
        padding: 6,
        borderRadius: 20,
    },
    reportDescription: {
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
    },
    deleteButton: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
