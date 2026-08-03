import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { WEATHER_ALERT_COLORS, weatherIcon } from '../services/weather';

const SEVERITY = { severe: 3, warning: 2, watch: 1, none: 0 };

/**
 * Météo ambiante : pastille compacte, et bulle à sa gauche sur événement.
 *
 * Le format vient d'un constat d'encombrement : sur mobile le panneau de
 * recherche occupe déjà tout le haut, et y empiler un bandeau pleine largeur
 * faisait deux cartes superposées. La pastille tient dans le coin, et ne
 * s'étend que lorsqu'il y a quelque chose à dire.
 *
 * Rend `null` sans résumé : au premier lancement, hors ligne, ou API coupée.
 *
 * Le tap ouvre la modale d'information — c'est elle qui porte le vent, le détail
 * des alertes, et l'attribution Open-Meteo que la licence CC BY 4.0 impose.
 */
export default function WeatherPill({ zone, stale, rain, onPress, buttonStyle, frost }) {
    const { colors, typography } = useTheme();
    const { width } = useWindowDimensions();
    const summary = zone?.summary;
    if (!summary) return null;

    const wind = summary.wind;
    const alerts = summary.alerts || [];

    const worst = alerts.reduce(
        (best, a) => ((SEVERITY[a.level] || 0) > (SEVERITY[best?.level] || 0) ? a : best),
        null,
    );
    const event = worst
        ? { text: worst.label, level: worst.level }
        : (rain ? { text: rain.text, level: 'watch' } : null);

    const spokenWind = wind?.speed != null
        ? `, vent ${Math.round(wind.speed)} km/h${wind.cardinal ? ` de ${wind.cardinal}` : ''}`
        : '';
    const label = `Météo : ${summary.label}`
        + (summary.temperature != null ? `, ${Math.round(summary.temperature)} degrés` : '')
        + spokenWind
        + (event ? `. ${event.text}` : '');

    const surface = { backgroundColor: colors.bgSurface };

    return (
        <View style={styles.row} pointerEvents="box-none">
            {event && (
                <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={onPress}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={[styles.bubble, surface, stale && styles.stale, { maxWidth: Math.max(110, width - 170) }]}
                >
                    <Text
                        numberOfLines={1}
                        style={[typography.body, styles.bubbleText, { color: WEATHER_ALERT_COLORS[event.level] }]}
                    >
                        {event.text}
                    </Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity
                activeOpacity={0.75}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={label}
                style={[buttonStyle, stale && styles.stale]}
            >
                {frost}
                <MaterialCommunityIcons
                    name={weatherIcon(summary.condition, summary.is_day !== false)}
                    size={19}
                    color={event ? WEATHER_ALERT_COLORS[event.level] : colors.textMain}
                />
                {summary.temperature != null && (
                    <Text style={[typography.body, styles.temp, { color: colors.textMain }]}>
                        {`${Math.round(summary.temperature)}°`}
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    bubble: {
        paddingVertical: 6,
        paddingHorizontal: 11,
        borderRadius: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 4,
    },
    bubbleText: {
        fontSize: 12,
        fontWeight: '500',
    },
    temp: {
        fontSize: 12,
        lineHeight: 14,
        fontWeight: '600',
        marginTop: 1,
    },
    stale: {
        opacity: 0.6,
    },
});
