import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatDistance(meters) {
    if (meters === null || meters === undefined) return '';
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
}

export default function GuidancePanel({ guidanceState, onStop }) {
    const insets = useSafeAreaInsets();

    if (!guidanceState) return null;

    const { currentInstruction, distanceToNext, distanceToDestination, hasArrived, progress } = guidanceState;

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

    return (
        <View style={[styles.container, { top: insets.top + 12 }]}>
            {/* Bloc instruction principale */}
            <View style={styles.instructionRow}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                        name={currentInstruction.icon}
                        size={36}
                        color="#fff"
                    />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.distanceToNext}>
                        {formatDistance(distanceToNext)}
                    </Text>
                    <Text style={styles.instructionText} numberOfLines={2}>
                        {currentInstruction.text}
                    </Text>
                </View>
                <TouchableOpacity onPress={onStop} style={styles.closeButton}>
                    <MaterialCommunityIcons name="close" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Barre de progression + distance restante */}
            <View style={styles.footer}>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
                </View>
                <Text style={styles.distanceTotal}>
                    {formatDistance(distanceToDestination)} restants
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        backgroundColor: '#3d46f6',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        zIndex: 100,
    },
    instructionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
    },
    distanceToNext: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 2,
    },
    instructionText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    closeButton: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    footer: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    progressBarBg: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
    },
    distanceTotal: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontWeight: '500',
    },
    arrivedContainer: {
        position: 'absolute',
        left: 16,
        right: 16,
        backgroundColor: '#22c55e',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        zIndex: 100,
    },
    arrivedText: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '700',
    },
    stopButton: {
        marginTop: 8,
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 10,
    },
    stopButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});