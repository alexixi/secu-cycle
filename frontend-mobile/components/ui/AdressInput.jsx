import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity, Keyboard } from 'react-native';
import { searchAddressAutocomplete } from '../../services/geocodingService';

export default function AdressInput({ placeholder, onSelect, icon, defaultValue }) {
  const [query, setQuery] = useState(defaultValue || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showList, setShowList] = useState(false);
  const isTyping = React.useRef(false);

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
      <View style={styles.inputRow}>
        <View style={styles.iconContainer}>{icon}</View>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
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
        <View style={styles.suggestionList}>
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={item.id || index}
              style={styles.suggestionItem}
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.suggestionText} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.suggestionSubText} numberOfLines={1}>
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
    backgroundColor: 'white',
  },
  iconContainer: {
    width: 30,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 8,
  },
  suggestionList: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    zIndex: 1000,
    elevation: 5,
    overflow: 'visible',
  },
  suggestionItem: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  suggestionSubText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});