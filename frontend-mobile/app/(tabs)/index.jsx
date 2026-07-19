import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Text, Alert } from 'react-native';
import MapComponent from '../../components/MapComponent';
import SearchContainer from '../../components/SearchContainer';
import { calculateItineraries, completeRoute } from "../../services/apiBack";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from '../../hooks/useTheme';
import useGuidance from '../../hooks/useGuidance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GuidancePanel from '../../components/GuidancePanel';
import ItineraryPanel from '../../components/ItineraryPanel';
import BadgeUnlockedModal from '../../components/BadgeUnlockedModal';
import * as Haptics from 'expo-haptics';
import { trackEvent } from '../../services/analytics';

export default function Index() {
    const [startPoint, setStartPoint] = useState(null);
    const [endPoint, setEndPoint] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [routePaths, setRoutePaths] = useState(null);
    const [selectedItineraire, setSelectedItineraire] = useState(null);
    const [selectedBike, setSelectedBike] = useState('classic');
    const [maxDuration, setMaxDuration] = useState(null);
    const [errorPath, setErrorPath] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [pendingPoiRoute, setPendingPoiRoute] = useState(false);
    // File des badges gagnés à l'arrivée : le modal affiche la tête, onNext dépile.
    const [unlockedBadges, setUnlockedBadges] = useState([]);
    // Garde anti-double-appel : un trajet n'est complété qu'une fois par calcul.
    const completedRouteRef = useRef(null);

    const { token, user, bikes } = useAuth();
    const { colors, typography } = useTheme();

    const handleStartNavigation = () => {
        if (!selectedItineraire) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        trackEvent('navigation_started', { bike: selectedBike });
        setIsNavigating(true);
    };

    const handleStopNavigation = () => {
        if (isNavigating && !guidanceState?.hasArrived) {
            trackEvent('navigation_stopped');
        }
        setIsNavigating(false);
    };
    const handleSelectItineraire = React.useCallback((id) => {
        setSelectedItineraire(id);
    }, []);

    const { currentPosition, guidanceState } = useGuidance(
        routePaths,
        selectedItineraire,
        isNavigating,
        handleStopNavigation,
    );

    useEffect(() => {
        if (!startPoint || !endPoint) {
            setRoutePaths(null);
            setSelectedItineraire(null);
            setErrorPath(false);
            setIsNavigating(false);
            completedRouteRef.current = null;
        }
    }, [startPoint, endPoint]);

    // À l'arrivée, on marque terminée la seule variante réellement suivie : le backend
    // a persisté 2-3 routes au calcul, mais l'utilisateur n'en a parcouru qu'une.
    // On dépend du booléen hasArrived, pas de guidanceState (recréé à chaque tick de 2 s).
    useEffect(() => {
        if (!guidanceState?.hasArrived) return;

        const activeRoute = routePaths?.find(it => it.id === selectedItineraire);
        const routeId = activeRoute?.route_id ?? null;

        // Pas de token (calcul anonyme, aucune route persistée) ou déjà complété.
        if (!token || routeId == null) return;
        if (completedRouteRef.current === routeId) return;
        completedRouteRef.current = routeId;

        (async () => {
            try {
                const result = await completeRoute(token, routeId);
                if (result?.newly_unlocked?.length) {
                    setUnlockedBadges(result.newly_unlocked);
                }
            } catch (error) {
                console.error("Erreur lors de la validation du trajet:", error);
            }
        })();
    }, [guidanceState?.hasArrived, token, routePaths, selectedItineraire]);

    const handleCalculate = React.useCallback(async () => {
        if (!startPoint?.lat || !startPoint?.lon || !endPoint?.lat || !endPoint?.lon) {
            console.log("Coordonnées manquantes pour le calcul");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        setIsLoading(true);
        setRoutePaths(null);
        setSelectedItineraire(null);
        setErrorPath(false);
        setIsNavigating(false);
        completedRouteRef.current = null;

        try {
            const itineraries = await calculateItineraries(token, startPoint, endPoint, selectedBike, maxDuration, startPoint?.name, endPoint?.name);

            if (itineraries && itineraries.length > 0) {
                setErrorPath(false);
                setRoutePaths(itineraries);
                setSelectedItineraire(itineraries[0].id);
                trackEvent('route_calculated', { bike: selectedBike, count: itineraries.length });
            } else {
                setErrorPath(true);
                trackEvent('route_calculation_failed', { bike: selectedBike });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        } catch (error) {
            console.error("Erreur calcul itinéraire:", error);
            setErrorPath(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            if (error.code === "OUT_OF_ZONE") {
                trackEvent('address_out_of_zone', { city: startPoint?.city || endPoint?.city || "inconnue" });
                Alert.alert(
                    "Hors zone couverte",
                    error.detailMessage || "Cette adresse est en dehors de la zone couverte par Sécu-Cycle.",
                );
            } else {
                trackEvent('route_calculation_failed', { bike: selectedBike });
            }
        } finally {
            setIsLoading(false);
        }
    }, [startPoint, endPoint, selectedBike, maxDuration, token]);

    const handleNavigateToPoi = React.useCallback((poi) => {
        if (!startPoint && !currentPosition) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                "Position introuvable",
                "Veuillez patienter pendant la recherche de votre position GPS.",
            );
            return;
        }
        if (!startPoint) {
            setStartPoint({ lat: currentPosition.lat, lon: currentPosition.lon, name: 'Ma position actuelle' });
        }
        setEndPoint({ lat: poi.lat, lon: poi.lon, name: poi.name });
        setPendingPoiRoute(true);
    }, [startPoint, currentPosition]);

    useEffect(() => {
        if (pendingPoiRoute && startPoint && endPoint) {
            setPendingPoiRoute(false);
            handleCalculate();
        }
    }, [pendingPoiRoute, startPoint, endPoint, handleCalculate]);

    const insets = useSafeAreaInsets();
    const tabClear = insets.bottom + 74;

    return (
        <View style={styles.container}>
            <MapComponent
                start={startPoint}
                end={endPoint}
                itineraires={routePaths}
                selectedItineraire={selectedItineraire}
                setSelectedItineraire={handleSelectItineraire}
                currentPosition={currentPosition}
                isNavigating={isNavigating}
                canReport={!!token}
                onNavigateToPoi={handleNavigateToPoi}
                miniMap={false}
                bottomInset={tabClear}
            />

            {isNavigating && (
                <GuidancePanel
                    guidanceState={guidanceState}
                    onStop={handleStopNavigation}
                />
            )}

            {!isNavigating && (
                <View style={styles.absoluteSearch}>
                    <SearchContainer
                        onStartSelect={setStartPoint}
                        onEndSelect={setEndPoint}
                        start={startPoint}
                        end={endPoint}
                        onCalculate={handleCalculate}
                        currentPosition={currentPosition}
                        homeAddress={user?.home_address}
                        workAddress={user?.work_address}
                        bikes={bikes}
                        selectedBike={selectedBike}
                        setSelectedBike={setSelectedBike}
                        maxDuration={maxDuration}
                        setMaxDuration={setMaxDuration}
                    />

                    {isLoading && (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    )}
                </View>
            )}

            {!isNavigating && (
                <ItineraryPanel
                    itineraires={routePaths}
                    selectedItineraire={selectedItineraire}
                    setSelectedItineraire={handleSelectItineraire}
                    bottomOffset={tabClear}
                />
            )}

            {isNavigating && (
                <TouchableOpacity
                    style={[styles.emergencyStop, { backgroundColor: colors.error, bottom: 40 + tabClear }]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => { });
                        handleStopNavigation();
                    }}
                >
                    <MaterialCommunityIcons name="close" size={20} color={colors.textMain} />
                    <Text style={[styles.emergencyStopText, { color: colors.textMain }]}>Arrêter</Text>
                </TouchableOpacity>
            )}

            {selectedItineraire && !isNavigating && !isLoading && (
                <TouchableOpacity
                    style={[styles.startButton, { backgroundColor: colors.primary, bottom: 20 + tabClear }]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => { });
                        handleStartNavigation();
                    }}
                    activeOpacity={0.85} >
                    <MaterialCommunityIcons name="navigation" size={20} color="#fff" />
                    <Text style={styles.startButtonText}>Démarrer</Text>
                </TouchableOpacity>
            )}

            <BadgeUnlockedModal
                badge={unlockedBadges[0] ?? null}
                remaining={Math.max(0, unlockedBadges.length - 1)}
                onNext={() => setUnlockedBadges(prev => prev.slice(1))}
                colors={colors}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    absoluteSearch: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        paddingHorizontal: 15,
        zIndex: 10,
    },
    loaderContainer: {
        marginTop: 20,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 20,
        alignSelf: 'center',
    },
    startButton: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 10,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    emergencyStop: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 200,
    },
    emergencyStopText: {
        fontSize: 15,
        fontWeight: '700',
    },
});
