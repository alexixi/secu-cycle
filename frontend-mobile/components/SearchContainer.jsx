import React, { useState } from 'react';
import { StyleSheet, View, Platform, TouchableOpacity, Text } from 'react-native';
import AdressInput from './ui/AdressInput';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export default function SearchContainer({ onStartSelect, onEndSelect, start, end, onCalculate }) {

  const { colors, typography } = useTheme();

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
      <View style={[styles.card, { backgroundColor: colors.bgMain }]}>
        <View style={styles.inputsColumn}>

          <View style={{ zIndex: 2, position: 'relative' }}>
            <AdressInput
              placeholder="Départ"
              defaultValue={start?.name}
              onSelect={onStartSelect}
              icon={<MaterialCommunityIcons name="bike" size={20} color={colors.primary} />}
            />
          </View>

          <View style={styles.separatorContainer}>
            <View style={[styles.line, { backgroundColor: colors.borderStrong }]} />
          </View>

          <View style={{ zIndex: 1, position: 'relative' }}>
            <AdressInput
              placeholder="Destination"
              defaultValue={end?.name}
              onSelect={onEndSelect}
              icon={<Ionicons name="location" size={20} color={colors.error} />}
            />
          </View>

          {isReady && <View style={{ height: 40 }} />}

        </View>

        <TouchableOpacity style={styles.swapButton} onPress={swapLocations}>
          <MaterialCommunityIcons name="swap-vertical" size={24} color={colors.textMain} />
        </TouchableOpacity>

        {isReady ? (
          <TouchableOpacity
            style={[styles.calcButtonAbsolute, { backgroundColor: colors.primary }]}
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
