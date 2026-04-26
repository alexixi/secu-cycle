import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform, TouchableOpacity, Text, ScrollView, TextInput, LayoutAnimation, UIManager, Keyboard } from 'react-native';
import AdressInput from './ui/AdressInput';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import * as Haptics from 'expo-haptics';
import { searchAddressAutocomplete } from '../services/geocodingService';

export default function SearchContainer({
  onStartSelect, onEndSelect, start, end, onCalculate,
  currentPosition, homeAddress, workAddress,
  bikes = [], selectedBike, setSelectedBike,
  maxDuration, setMaxDuration
}) {
  const { colors, typography } = useTheme();
  const [focusedField, setFocusedField] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

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

  const defaultBikes = [
    { id: "default-ville", type: "ville", is_electric: false, name: "Ville", icon: "bicycle" },
    { id: "default-ville-electric", type: "ville", is_electric: true, name: "Ville", icon: "bicycle-electric" },
    { id: "default-vtt", type: "vtt", is_electric: false, name: "VTT", icon: "bike" },
    { id: "default-vtt-electric", type: "vtt", is_electric: true, name: "VTT", icon: "bicycle-electric" },
    { id: "default-route", type: "route", is_electric: false, name: "Route", icon: "bike-fast" },
  ];

  let displayedBikes = defaultBikes;
  if (bikes && bikes.length > 0) {
    displayedBikes = bikes.map(bike => {
      let iconName = 'bicycle';
      const bikeType = bike.type?.toLowerCase();

      if (bikeType === "ville") {
        iconName = bike.is_electric ? "bicycle-electric" : "bicycle";
      } else if (bikeType === "vtt") {
        iconName = bike.is_electric ? "bicycle-electric" : "bike";
      } else if (bikeType === "route") {
        iconName = "bike-fast";
      }

      return {
        id: bike.id,
        type: bike.type,
        is_electric: bike.is_electric,
        name: bike.name,
        icon: iconName
      };
    });
  }

  useEffect(() => {
    if (displayedBikes.length === 1 && selectedBike !== displayedBikes[0].id) {
      setSelectedBike(displayedBikes[0].id);
    } else if (displayedBikes.length > 1 && !displayedBikes.find(b => b.id === selectedBike)) {
      setSelectedBike(displayedBikes[0].id);
    }
  }, [displayedBikes.length, selectedBike, setSelectedBike]);

  const handleQuickSuggestion = async (suggestion, field) => {
    Haptics.selectionAsync().catch(() => { });
    Keyboard.dismiss();

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
      {(isExpanded || focusedField) && (
        <TouchableOpacity
          style={styles.clickOutsideOverlay}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            setFocusedField(null);
            if (isExpanded) toggleExpand();
          }}
        />
      )}

      <View style={[styles.card, { backgroundColor: colors.bgMain }]}>
        <View style={styles.topSection}>
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

            {showSuggestions && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsRow}
                keyboardShouldPersistTaps="handled"
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
            {(isReady || isExpanded) && <View style={{ height: 40 }} />}
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
        </View>

        {isExpanded && (
          <View style={styles.expandedSection}>
            <View style={[styles.expandedDivider, { backgroundColor: colors.borderLight }]} />

            {displayedBikes.length > 1 && <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>Choix du vélo</Text>}

            {displayedBikes.length === 1 ? (
              <View style={styles.singleBikeInfo}>
                <MaterialCommunityIcons name={displayedBikes[0].icon} size={22} color={colors.textMain} />
                <Text style={[typography.body, { color: colors.textMain, marginLeft: 8 }]}>
                  <Text style={{ fontWeight: 'bold' }}>{displayedBikes[0].name}</Text> sélectionné
                </Text>
                {displayedBikes[0].is_electric && <MaterialCommunityIcons name="lightning-bolt" size={16} color={colors.primary} style={{ marginLeft: 4 }} />}
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bikeOptionsRow}>
                {displayedBikes.map((bike) => {
                  const isSelected = selectedBike === bike.id;
                  return (
                    <TouchableOpacity
                      key={bike.id}
                      style={[
                        styles.bikeOption,
                        { borderColor: colors.borderStrong, backgroundColor: colors.bgSurface },
                        isSelected && { borderColor: colors.primary, backgroundColor: colors.primaryLight }
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => { });
                        setSelectedBike(bike.id);
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name={bike.icon} size={20} color={isSelected ? colors.primary : colors.textMain} />
                        {bike.is_electric && (
                          <MaterialCommunityIcons name="lightning-bolt" size={14} color={isSelected ? colors.primary : colors.textMain} style={{ marginLeft: -4, marginTop: -8 }} />
                        )}
                      </View>
                      <Text style={[styles.bikeOptionText, { color: isSelected ? colors.primary : colors.textMain }]}>{bike.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <Text style={[styles.settingLabel, { color: colors.textSecondary, marginTop: 15 }]}>Heure d'arrivée max. (Optionnel)</Text>
            <TextInput
              style={[styles.timeInput, { borderColor: colors.borderStrong, color: colors.textMain, backgroundColor: colors.bgSurface }]}
              placeholder="ex: 18:30"
              placeholderTextColor={colors.textSecondary}
              value={maxDuration}
              onChangeText={setMaxDuration}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.expandButtonAbsolute}
          onPress={toggleExpand}
        >
          <MaterialCommunityIcons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {isReady && (
          <TouchableOpacity
            style={[styles.calcButtonAbsolute, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => { });
              Keyboard.dismiss();
              if (isExpanded) toggleExpand();
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
  clickOutsideOverlay: {
    position: 'absolute',
    top: -1000,
    bottom: -1000,
    left: -1000,
    right: -1000,
    zIndex: -1,
  },
  card: {
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
  topSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inputsColumn: {
    flex: 1,
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
  swapButton: {
    padding: 10,
    alignSelf: 'center',
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

  expandedSection: {
    paddingHorizontal: 10,
    paddingBottom: 35,
  },
  expandedDivider: {
    height: 1,
    width: '100%',
    marginBottom: 10,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  singleBikeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  bikeOptionsRow: {
    flexDirection: 'row',
  },
  bikeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    marginRight: 10,
  },
  bikeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    width: '50%',
  },
  expandButtonAbsolute: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    padding: 8,
    zIndex: 10,
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
    zIndex: 10,
  },
  calcButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
