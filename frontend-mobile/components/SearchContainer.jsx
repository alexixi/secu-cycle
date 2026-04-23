import React, { useState } from 'react';
import { StyleSheet, View, Platform, TouchableOpacity, Text, ScrollView } from 'react-native';
import AdressInput from './ui/AdressInput';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import * as Haptics from 'expo-haptics';
import { searchAddressAutocomplete } from '../services/geocodingService';

export default function SearchContainer({
  onStartSelect, onEndSelect, start, end, onCalculate,
  currentPosition, homeAddress, workAddress
}) {
  const { colors, typography } = useTheme();
  const [focusedField, setFocusedField] = useState(null); // 'start' | 'end' | null

  const swapLocations = () => {
    if (!start || !end) return;
    onStartSelect({ ...end });
    onEndSelect({ ...start });
  };

  const isReady = start?.lat && end?.lat;

  const quickSuggestions = [
    currentPosition && {
      id: 'current',
      icon: '📍',
      label: 'Ma position',
      point: {
        lat: currentPosition.lat,
        lon: currentPosition.lon,
        name: 'Ma position actuelle',
      }
    },
    homeAddress && {
      id: 'home',
      icon: '🏠',
      label: 'Domicile',
      address: homeAddress,
    },
    workAddress && {
      id: 'work',
      icon: '💼',
      label: 'Travail',
      address: workAddress,
    },
  ].filter(Boolean)
    .filter(suggestion => {
      const suggestionName = suggestion.point?.name || suggestion.address;
      const isStartMatch = (start?._sourceId === suggestion.id) || (start?.name && start.name === suggestionName);
      const isEndMatch = (end?._sourceId === suggestion.id) || (end?.name && end.name === suggestionName);
      return !isStartMatch && !isEndMatch;
    });

  const handleQuickSuggestion = async (suggestion, field) => {
    Haptics.selectionAsync().catch(() => { });
    const select = field === 'start' ? onStartSelect : onEndSelect;

    if (suggestion.id === 'current') {
      select({ ...suggestion.point, _sourceId: 'current' });
      setFocusedField(null);
      return;
    }

    try {
      const results = await searchAddressAutocomplete(suggestion.address);
      if (results.length > 0) {
        select({ ...results[0], _sourceId: suggestion.id });
      }
    } catch (e) {
      console.error('Erreur géocodage suggestion rapide:', e);
    }
    setFocusedField(null);
  };

  const showSuggestions = focusedField && quickSuggestions.length > 0;

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
              onFocusChange={(focused) => focused && setFocusedField('start')}
            />
          </View>
          <View style={styles.separatorContainer}>
            <View style={[styles.line, { backgroundColor: colors.borderStrong }]} />
          </View>
          <View style={{ zIndex: 1, position: 'relative' }}>
            <AdressInput
              placeholder="Destination"
              defaultValue={end?.name}
              onSelect={(val) => {
                Haptics.selectionAsync().catch(() => { });
                onEndSelect(val);
              }}
              icon={<Ionicons name="location" size={20} color={colors.error} />}
              onFocusChange={(focused) => focused && setFocusedField('end')}
            />
          </View>

          {/* Chips de suggestions rapides */}
          {showSuggestions && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsRow}
              keyboardShouldPersistTaps="always"
            >
              {quickSuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={[styles.chip, { backgroundColor: colors.bgSurface, borderColor: colors.borderLight }]}
                  onPress={() => handleQuickSuggestion(suggestion, focusedField)}
                >
                  <Text style={styles.chipIcon}>{suggestion.icon}</Text>
                  <Text style={[styles.chipLabel, { color: colors.textMain }]}>
                    {suggestion.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {isReady && <View style={{ height: 40 }} />}
        </View>

        <TouchableOpacity
          style={styles.swapButton}
          onPress={() => {
            Haptics.selectionAsync().catch(() => { });
            swapLocations();
          }}
        >
          <MaterialCommunityIcons name="swap-vertical" size={24} color={colors.textMain} />
        </TouchableOpacity>

        {isReady && (
          <TouchableOpacity
            style={[styles.calcButtonAbsolute, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => { });
              onCalculate();
            }}
          >
            <MaterialCommunityIcons name="directions" size={18} color="white" style={{ marginRight: 6 }} />
            <Text style={styles.calcButtonText}>Calculer</Text>
          </TouchableOpacity>
        )}
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
      android: { elevation: 8 },
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
  },
  chipsRow: {
    marginTop: 8,
    marginLeft: 35,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
});
