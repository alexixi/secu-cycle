import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Mapping turn_type → nom d'icône MaterialCommunityIcons
const TURN_ICONS = {
    depart:       'navigation',
    continue:     'arrow-up',
    slight_right: 'arrow-top-right',
    turn_right:   'arrow-right',
    sharp_right:  'arrow-right',
    u_turn:       'u-turn-right',
    sharp_left:   'arrow-left',
    turn_left:    'arrow-left',
    slight_left:  'arrow-top-left',
    roundabout:   'rotate-right',
    arrive:       'flag-checkered',
};

function formatDistance(meters) {
    if (meters === null || meters === undefined) return '';
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
}

export default function GuidancePanel({ guidanceState, onStop }) {
    const insets = useSafeAreaInsets();

    if (!guidanceState) return null;

    const {
        instruction,
        nextInstruction,
        distanceToNext,
        hasArrived,
        progress,
        status,
    } = guidanceState;

    if (hasArrived) {
        return (
            <View style={[styles.arrivedContainer, { top: insets.top + 12 }]}>
                <MaterialCommunityIcons name="flag-checkered" size={32} color="#fff" />
                <Text style={styles.arrivedText}>Vous êtes arrivé !</Text>
                <TouchableOpacity onPress={onStop} style={styles.stopButton}>
                    <Text style={styles.stopButtonText}>Terminer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!instruction) return null;

    const iconName = TURN_ICONS[instruction.turn_type] ?? 'arrow-up';
    const nextIconName = nextInstruction
        ? (TURN_ICONS[nextInstruction.turn_type] ?? 'arrow-up')
        : null;

    return (
        <View style={[styles.container, { top: insets.top + 12 }]}>

            {/* Instruction principale */}
            <View style={styles.instructionRow}>
                <View style={[
                    styles.iconContainer,
                    status === 'off_route' && styles.iconContainerOffRoute
                ]}>
                    <MaterialCommunityIcons
                        name={status === 'off_route' ? 'map-marker-off' : iconName}
                        size={36}
                        color="#fff"
                    />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.distanceToNext}>
                        {status === 'off_route'
                            ? 'Recalcul...'
                            : formatDistance(distanceToNext)
                        }
                    </Text>
                    <Text style={styles.instructionText} numberOfLines={2}>
                        {instruction.text}
                    </Text>
                </View>

                <TouchableOpacity onPress={onStop} style={styles.closeButton}>
                    <MaterialCommunityIcons name="close" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Prochaine instruction */}
            {nextInstruction && nextIconName && (
                <View style={styles.nextRow}>
                    <MaterialCommunityIcons name={nextIconName} size={16} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.nextText} numberOfLines={1}>
                        Ensuite : {nextInstruction.text}
                    </Text>
                </View>
            )}

            {/* Barre de progression */}
            <View style={styles.footer}>
                <View style={styles.progressBarBg}>
                    <View style={[
                        styles.progressBarFill,
                        { width: `${Math.round((progress ?? 0) * 100)}%` }
                    ]} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 12,
        right: 12,
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 12,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    instructionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#3b5bdb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainerOffRoute: {
        backgroundColor: '#e03131',
    },
    textContainer: {
        flex: 1,
    },
    distanceToNext: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '700',
    },
    instructionText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14,
        marginTop: 2,
    },
    closeButton: {
        padding: 8,
    },
    nextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    nextText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        flex: 1,
    },
    footer: {
        marginTop: 10,
    },
    progressBarBg: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#3b5bdb',
        borderRadius: 2,
    },
    arrivedContainer: {
        position: 'absolute',
        left: 12,
        right: 12,
        backgroundColor: '#2f9e44',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        gap: 12,
        zIndex: 100,
    },
    arrivedText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    stopButton: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
    },
    stopButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
});