import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import MapComponent from '../../components/MapComponent';
import SearchContainer from '../../components/SearchContainer';
import { calculateItineraries } from "../../services/apiBack.mock";
import { useAuth } from "../../context/AuthContext";

export default function Index() {
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [routePaths, setRoutePaths] = useState(null);
  const [selectedItineraire, setSelectedItineraire] = useState(null);
  const [selectedBike, setSelectedBike] = useState('classic');
  const [maxDuration, setMaxDuration] = useState(null);
  const [errorPath, setErrorPath] = useState(false);

  const { token } = useAuth();

  const handleCalculate = async () => {
    if (!startPoint?.lat || !startPoint?.lon || !endPoint?.lat || !endPoint?.lon) {
      console.log("Coordonnées manquantes pour le calcul");
      return;
    }

    setIsLoading(true);
    setRoutePaths(null);
    setSelectedItineraire(null);
    setErrorPath(false);

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

  return (
    <View style={styles.container}>
      <MapComponent
        start={startPoint}
        end={endPoint}
        itineraires={routePaths}
        selectedItineraire={selectedItineraire}
        setSelectedItineraire={setSelectedItineraire}
      />

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
  }
});