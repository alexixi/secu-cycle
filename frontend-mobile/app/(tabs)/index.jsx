import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';

export default function MaPage() {
  const { colors, typography } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bgMain }]}>

      <Text style={[typography.h1, { color: colors.textMain }]}>
        Carte
      </Text>

      <Text style={[typography.body, { color: colors.textSecondary }]}>
        Un petit sous-titre bien stylé.
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
