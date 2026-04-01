import React, { useState } from 'react';
import { StyleSheet, View, Platform, TouchableOpacity, Text } from 'react-native';
import AdressInput from './ui/AdressInput';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function SearchContainer({ onStartSelect, onEndSelect, start, end, onCalculate }) {

  const swapLocations = () => {
    if (!start || !end) return;
    const newStart = { ...end };
    const newEnd = { ...start };
    onStartSelect(newStart);
    onEndSelect(newEnd);
  };

  const isReady = start?.lat && end?.lat;

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.inputsColumn}>

          <View style={{ zIndex: 2, position: 'relative' }}>
            <AdressInput
              placeholder="Départ"
              defaultValue={start?.name}
              onSelect={onStartSelect}
              icon={<MaterialCommunityIcons name="bike" size={20} color="#3d46f6" />}
            />
          </View>

          <View style={styles.separatorContainer}>
            <View style={styles.line} />
          </View>

          <View style={{ zIndex: 1, position: 'relative' }}>
            <AdressInput
              placeholder="Destination"
              defaultValue={end?.name}
              onSelect={onEndSelect}
              icon={<Ionicons name="location" size={20} color="#EF4444" />}
            />
          </View>

          {isReady && <View style={{ height: 40 }} />}

        </View>

        <TouchableOpacity style={styles.swapButton} onPress={swapLocations}>
          <MaterialCommunityIcons name="swap-vertical" size={24} color="#000000" />
        </TouchableOpacity>

        {isReady ? (
          <TouchableOpacity
            style={styles.calcButtonAbsolute}
            onPress={onCalculate}
          >
            <MaterialCommunityIcons name="directions" size={18} color="white" style={{ marginRight: 6 }} />
            <Text style={styles.calcButtonText}>Calculer</Text>
          </TouchableOpacity>
        ) : null}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingHorizontal: 15,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 12,
    paddingBottom: 15,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 35,
  },
  inputsColumn: {
    flex: 1,
  },
  swapButton: {
    padding: 10,
    alignSelf: 'flex-start',
    marginTop: 25,
  },
  buttonRightContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
    width: '100%',
  },
  calcButtonAbsolute: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#3d46f6',
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  calcButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  }
});