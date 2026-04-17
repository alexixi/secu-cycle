import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity, Keyboard } from 'react-native';
import { searchAddressAutocomplete } from '../../services/geocodingService';
import { useTheme } from '../../hooks/useTheme';

export default function AdressInput({ placeholder, onSelect, icon, defaultValue }) {
  const [query, setQuery] = useState(defaultValue || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showList, setShowList] = useState(false);
  const isTyping = React.useRef(false);

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
          setSuggestions(results.slice(0, 3));
          setShowList(true);
        } catch (error) {
          console.error("Erreur géocodage:", error);
        }
      } else if (query.length < 3) {
        setSuggestions([]);
        setShowList(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (item) => {
    isTyping.current = false;
    setQuery(item.name);
    setSuggestions([]);
    setShowList(false);
    Keyboard.dismiss();
    onSelect(item);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputRow, { backgroundColor: colors.bgMain }]}>
        <View style={styles.iconContainer}>{icon}</View>
        <TextInput
          style={[styles.input, { backgroundColor: colors.bgMain, color: colors.textMain }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={(text) => {
            isTyping.current = true;
            setQuery(text);
            if (text.trim() === "") {
              setSuggestions([]);
              setShowList(false);
              onSelect(null);
            }
          }}
          onFocus={() => {
            if (query.length >= 3) {
              isTyping.current = true;
              setShowList(true);
            }
          }}
        />
      </View>

      {showList && suggestions.length > 0 && (
        <View style={[styles.suggestionList, { backgroundColor: colors.bgMain, borderColor: colors.borderStrong }]}>
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={item.id || index}
              style={[styles.suggestionItem, { backgroundColor: colors.bgMain, borderBottomColor: colors.borderStrong }]}
              onPress={() => handleSelect(item)}
            >
              <Text style={[styles.suggestionText, { color: colors.textMain }]} numberOfLines={1}>{item.name}</Text>
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 45,
  },
  iconContainer: {
    width: 30,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  suggestionList: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 1000,
    elevation: 5,
    overflow: 'visible',
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionSubText: {
    fontSize: 12,
    marginTop: 2,
  },
});
