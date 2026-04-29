import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import MapComponent from '../../components/MapComponent';
import SearchContainer from '../../components/SearchContainer';
import { calculateItineraries } from "../../services/apiBack";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from '../../hooks/useTheme';
import useGuidance from '../../hooks/useGuidance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GuidancePanel from '../../components/GuidancePanel';
import ItineraryPanel from '../../components/ItineraryPanel';
import * as Haptics from 'expo-haptics';

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

    const { token, user, bikes } = useAuth();
    const { colors, typography } = useTheme();

    const handleStartNavigation = () => {
        if (!selectedItineraire) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        setIsNavigating(true);
    };

    const handleStopNavigation = () => {
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
        }
    }, [startPoint, endPoint]);

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

        try {
            const itineraries = await calculateItineraries(token, startPoint, endPoint, selectedBike, maxDuration);

            if (itineraries && itineraries.length > 0) {
                setErrorPath(false);
                setRoutePaths(itineraries);
                setSelectedItineraire(itineraries[0].id);
            } else {
                setErrorPath(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        } catch (error) {
            console.error("Erreur calcul itinéraire:", error);
            setErrorPath(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsLoading(false);
        }
    }, [startPoint, endPoint, selectedBike, maxDuration, token]);

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
                miniMap={false}
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
                />
            )}

            {isNavigating && (
                <TouchableOpacity
                    style={[styles.emergencyStop, { backgroundColor: colors.error }]}
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
                    style={[styles.startButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => { });
                        handleStartNavigation();
                    }}
                    activeOpacity={0.85} >
                    <MaterialCommunityIcons name="navigation" size={20} color="#fff" />
                    <Text style={styles.startButtonText}>Démarrer</Text>
                </TouchableOpacity>
            )}

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
