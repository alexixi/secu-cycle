import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity, Keyboard, Platform } from 'react-native';
import { searchAddressAutocomplete } from '../../services/geocodingService';
import { isCovered } from '../../services/apiBack';
import { trackEvent } from '../../services/analytics';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../constants/theme';
import { useTranslation } from 'react-i18next';

export default function AdressInput({ placeholder, onSelect, icon, defaultValue, variant = 'search', zIndex = 1000, onFocusChange, checkCoverage = false }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(defaultValue || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showList, setShowList] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [outOfZone, setOutOfZone] = useState(false);
  const isTyping = React.useRef(false);

  const isForm = variant === 'form';
  const { colors } = useTheme();

  useEffect(() => {
    if (defaultValue !== undefined && defaultValue !== query) {
      setQuery(defaultValue || "");
      isTyping.current = false;
    }
  }, [defaultValue]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 3 && isTyping.current) {
        try {
          const results = await searchAddressAutocomplete(query);
          setSuggestions(results);
          setNoResults(results.length === 0);
          setShowList(true);
        } catch (error) {
          console.error("Erreur géocodage:", error);
        }
      } else if (query.length < 3) {
        setSuggestions([]);
        setNoResults(false);
        setShowList(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const warnIfOutOfZone = async (item) => {
    if (!checkCoverage) return;
    const covered = await isCovered(item.lat, item.lon);
    setOutOfZone(!covered);
    if (!covered) {
      trackEvent("address_out_of_zone", { city: item.city || "inconnue", postcode: item.postcode || "" });
    }
  };

  const handleSelect = (item) => {
    isTyping.current = false;
    setQuery(item.name);
    setSuggestions([]);
    setNoResults(false);
    setShowList(false);
    setOutOfZone(false);
    Keyboard.dismiss();
    onSelect(item);
    warnIfOutOfZone(item);
  };

  return (
    <View style={[
      styles.container,
      { zIndex: zIndex },
      isForm && [styles.formContainer, {
        borderColor: colors.borderStrong,
        backgroundColor: withAlpha(colors.bgSurface, 0.92),
      }]
    ]}>
      <View style={styles.inputRow}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[
            styles.input,
            { color: colors.textMain }
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={(text) => {
            isTyping.current = true;
            setQuery(text);
            setOutOfZone(false);
            if (text.trim() === "") {
              setSuggestions([]);
              setNoResults(false);
              setShowList(false);
              onSelect(null);
            }
          }}
          onFocus={() => {
            onFocusChange?.(true);
            if (query.length >= 3) {
              isTyping.current = true;
              setShowList(true);
            }
          }}
          onBlur={() => onFocusChange?.(false)}
        />
      </View>

      {outOfZone && (
        <Text style={[styles.warningText, { color: colors.warning, backgroundColor: colors.warningBg }]}>
          {t('itineraire.recherche.horsZoneTexte')}
        </Text>
      )}

      {showList && noResults && suggestions.length === 0 && (
        <View style={[styles.suggestionList, {
          backgroundColor: withAlpha(colors.bgSurface, 0.92),
          borderColor: colors.borderStrong,
          shadowColor: colors.textMain
        }]}>
          <View style={[styles.suggestionItem, { borderBottomWidth: 0 }]}>
            <Text style={[styles.suggestionSubText, { color: colors.textSecondary }]}>
              {t('itineraire.recherche.aucunResultat')}
            </Text>
          </View>
        </View>
      )}

      {showList && suggestions.length > 0 && (
        <View style={[styles.suggestionList, {
          backgroundColor: withAlpha(colors.bgSurface, 0.92),
          borderColor: colors.borderStrong,
          shadowColor: colors.textMain
        }]}>
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={item.id || index}
              style={[
                styles.suggestionItem,
                { borderBottomColor: colors.borderLight },
                index === suggestions.length - 1 && { borderBottomWidth: 0 }
              ]}
              onPress={() => handleSelect(item)}
            >
              <Text style={[styles.suggestionText, { color: colors.textMain }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.suggestionSubText, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.postcode} {item.city}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  formContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'visible',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    paddingHorizontal: 15,
  },
  iconContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  suggestionList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 1000,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestionSubText: {
    fontSize: 13,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
    marginHorizontal: 15,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
});
