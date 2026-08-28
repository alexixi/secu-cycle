import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Text, Alert, BackHandler } from 'react-native';
import MapComponent from '../../components/MapComponent';
import SearchContainer from '../../components/SearchContainer';
import { calculateItineraries, completeRoute } from "../../services/apiBack";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from '../../hooks/useTheme';
import useGuidance from '../../hooks/useGuidance';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from 'expo-router';
import { withAlpha } from '../../constants/theme';
import GuidancePanel from '../../components/GuidancePanel';
import ItineraryPanel from '../../components/ItineraryPanel';
import BadgeUnlockedModal from '../../components/BadgeUnlockedModal';
import * as Haptics from 'expo-haptics';
import { trackEvent } from '../../services/analytics';
import BackgroundLocationDisclosure from '../../components/BackgroundLocationDisclosure';
import { useTranslation } from 'react-i18next';
import {
    ACCEPTED,
    DECLINED,
    getBackgroundLocationChoice,
    setBackgroundLocationChoice,
} from '../../services/locationDisclosure';

export default function Index() {
    const { t } = useTranslation();
    const [startPoint, setStartPoint] = useState(null);
    const [endPoint, setEndPoint] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [routePaths, setRoutePaths] = useState(null);
    const [routeWeather, setRouteWeather] = useState(null);
    const [selectedItineraire, setSelectedItineraire] = useState(null);
    const [selectedBike, setSelectedBike] = useState('classic');
    const [maxDuration, setMaxDuration] = useState(null);
    const [errorPath, setErrorPath] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [pendingPoiRoute, setPendingPoiRoute] = useState(false);
    // Détail de l'itinéraire ouvert : remonté ici pour être ouvrable depuis le bouton « i ».
    const [detailItineraire, setDetailItineraire] = useState(null);
    // File des badges gagnés à l'arrivée : le modal affiche la tête, onNext dépile.
    const [unlockedBadges, setUnlockedBadges] = useState([]);
    // Garde anti-double-appel : un trajet n'est complété qu'une fois par calcul.
    const completedRouteRef = useRef(null);
    // Divulgation Play : affichée avant la toute première demande de localisation.
    const [showLocationDisclosure, setShowLocationDisclosure] = useState(false);

    const { token, user, bikes } = useAuth();
    const { colors, typography } = useTheme();

    const _beginNavigation = () => {
        trackEvent('navigation_started', { bike: selectedBike });
        setIsNavigating(true);
    };

    const handleStartNavigation = async () => {
        if (!selectedItineraire) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        // La divulgation doit précéder la demande système : tant qu'aucun choix
        // n'est enregistré, le guidage attend la réponse.
        if ((await getBackgroundLocationChoice()) === null) {
            setShowLocationDisclosure(true);
            return;
        }
        _beginNavigation();
    };

    const handleAcceptLocation = async () => {
        await setBackgroundLocationChoice(ACCEPTED);
        setShowLocationDisclosure(false);
        _beginNavigation();
    };

    // Refus : le guidage démarre quand même, mais s'arrêtera à l'extinction de
    // l'écran, faute de relevé en arrière-plan.
    const handleDeclineLocation = async () => {
        await setBackgroundLocationChoice(DECLINED);
        setShowLocationDisclosure(false);
        _beginNavigation();
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
        setRouteWeather(null);
        setSelectedItineraire(null);
        setErrorPath(false);
        setIsNavigating(false);
        completedRouteRef.current = null;

        try {
            const { routes: itineraries, weather } = await calculateItineraries(token, startPoint, endPoint, selectedBike, maxDuration, startPoint?.name, endPoint?.name);

            if (itineraries && itineraries.length > 0) {
                setErrorPath(false);
                setRoutePaths(itineraries);
                setRouteWeather(weather);
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
                    t('itineraire.recherche.horsZoneTitre'),
                    // Le message de l'API prime : il est déjà traduit et plus précis
                    // que notre repli, qui sert face à un backend antérieur.
                    error.detailMessage || t('itineraire.recherche.horsZoneTexte'),
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
                t('carte.ui.position.introuvable'),
                t('carte.ui.position.patienter'),
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
    const navigation = useNavigation();

    const hasResults = !!routePaths?.length && !isNavigating;

    // Mode immersif : résultats affichés ou navigation en cours. On masque la
    // navbar et les boutons de carte, et on abaisse les panneaux du bas.
    const immersive = hasResults || isNavigating;

    useEffect(() => {
        navigation.setOptions({ tabBarStyle: immersive ? { display: 'none' } : undefined });
    }, [immersive, navigation]);

    // Sans navbar, les panneaux et les boutons du bas peuvent descendre.
    const tabClear = insets.bottom + (immersive ? 12 : 74);

    const cameraPadding = React.useMemo(() => ({
        top: insets.top + 220,
        bottom: tabClear + (hasResults ? 250 : 60),
        left: 60,
        right: 60,
    }), [insets.top, tabClear, hasResults]);

    const handleCloseResults = () => {
        Haptics.selectionAsync().catch(() => { });
        setRoutePaths(null);
        setSelectedItineraire(null);
        setDetailItineraire(null);
        setErrorPath(false);
    };

    const backActionRef = useRef(null);
    backActionRef.current = () => {
        if (isNavigating) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => { });
            handleStopNavigation();
            return true;
        }
        if (hasResults) {
            handleCloseResults();
            return true;
        }
        if (endPoint) {
            Haptics.selectionAsync().catch(() => { });
            setEndPoint(null);
            return true;
        }
        if (startPoint) {
            Haptics.selectionAsync().catch(() => { });
            setStartPoint(null);
            return true;
        }
        return false;
    };

    useFocusEffect(
        React.useCallback(() => {
            const sub = BackHandler.addEventListener(
                'hardwareBackPress',
                () => backActionRef.current?.() ?? false,
            );
            return () => sub.remove();
        }, []),
    );

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
                hideControls={immersive}
                cameraPadding={cameraPadding}
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
                    weather={routeWeather}
                    selectedItineraire={selectedItineraire}
                    setSelectedItineraire={handleSelectItineraire}
                    bottomOffset={tabClear}
                    detailItineraire={detailItineraire}
                    setDetailItineraire={setDetailItineraire}
                />
            )}

            {isNavigating && (
                <TouchableOpacity
                    style={[styles.emergencyStop, { backgroundColor: colors.error, bottom: 20 + tabClear }]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => { });
                        handleStopNavigation();
                    }}
                >
                    <MaterialCommunityIcons name="close" size={20} color={colors.textMain} />
                    <Text style={[styles.emergencyStopText, { color: colors.textMain }]}>{t('itineraire.recherche.arreter')}</Text>
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
                    <Text style={styles.startButtonText}>{t('itineraire.recherche.demarrer')}</Text>
                </TouchableOpacity>
            )}

            {hasResults && (
                <>
                    <TouchableOpacity
                        style={[
                            styles.resultAction,
                            { left: 30, bottom: 20 + tabClear, backgroundColor: withAlpha(colors.bgSurface, 0.9) },
                        ]}
                        onPress={() => {
                            Haptics.selectionAsync().catch(() => { });
                            setDetailItineraire(routePaths.find(it => it.id === selectedItineraire) ?? null);
                        }}
                        disabled={!selectedItineraire}
                        accessibilityRole="button"
                        accessibilityLabel={t('itineraire.recherche.details')}
                    >
                        <MaterialCommunityIcons name="information-variant" size={24} color={colors.textMain} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.resultAction,
                            { right: 30, bottom: 20 + tabClear, backgroundColor: withAlpha(colors.bgSurface, 0.9) },
                        ]}
                        onPress={handleCloseResults}
                        accessibilityRole="button"
                        accessibilityLabel={t('itineraire.recherche.fermerItineraires')}
                    >
                        <Ionicons name="close" size={24} color={colors.textMain} />
                    </TouchableOpacity>
                </>
            )}

            <BadgeUnlockedModal
                badge={unlockedBadges[0] ?? null}
                remaining={Math.max(0, unlockedBadges.length - 1)}
                onNext={() => setUnlockedBadges(prev => prev.slice(1))}
                colors={colors}
            />

            <BackgroundLocationDisclosure
                visible={showLocationDisclosure}
                onAccept={handleAcceptLocation}
                onDecline={handleDeclineLocation}
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
    // Partagé par les boutons « i » et « X » ; le left/right est passé en ligne.
    resultAction: {
        position: 'absolute',
        height: 50,
        width: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
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
