import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Text} from 'react-native';
import MapComponent from '../../components/MapComponent';
import SearchContainer from '../../components/SearchContainer';
import { calculateItineraries } from "../../services/apiBack.mock";
import { useAuth } from "../../context/AuthContext";
import useGuidance from '../../hooks/useGuidance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GuidancePanel from '../../components/GuidancePanel';

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

  const { token } = useAuth();

  const { currentPosition, guidanceState } = useGuidance(
        routePaths,
        selectedItineraire,
        isNavigating
    );

  useEffect(() => {
    if (!startPoint || !endPoint) {
      setRoutePaths(null);
      setSelectedItineraire(null);
      setErrorPath(false);
      setIsNavigating(false);
    }
  }, [startPoint, endPoint]);

  useEffect(() => {
        if (guidanceState?.hasArrived) {
            // On laisse GuidancePanel afficher "Arrivé" quelques secondes
            // puis on stoppe — le bouton Terminer dans GuidancePanel appelle handleStopNavigation
        }
    }, [guidanceState?.hasArrived]);

  const handleCalculate = async () => {
    if (!startPoint?.lat || !startPoint?.lon || !endPoint?.lat || !endPoint?.lon) {
      console.log("Coordonnées manquantes pour le calcul");
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
      }
    } catch (error) {
      console.error("Erreur calcul itinéraire:", error);
      setErrorPath(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNavigation = () => {
        if (!selectedItineraire) return;
        setIsNavigating(true);
    };

    const handleStopNavigation = () => {
        setIsNavigating(false);
    };

  return (
    <View style={styles.container}>
      <MapComponent
        start={startPoint}
        end={endPoint}
        itineraires={routePaths}
        selectedItineraire={selectedItineraire}
        setSelectedItineraire={setSelectedItineraire}
        currentPosition={currentPosition}
        isNavigating={isNavigating}
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
          />

          {isLoading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#3d46f6" />
            </View>
          )}
        </View>
      )}

      {selectedItineraire && !isNavigating && !isLoading && (
        <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartNavigation}
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
        bottom: 40,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#3d46f6',
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
});