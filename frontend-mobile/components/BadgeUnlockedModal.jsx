import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

/**
 * Annonce un badge fraîchement débloqué. Plusieurs badges peuvent être gagnés d'un coup :
 * l'appelant gère une file et ne passe que le badge de tête, `onNext` la dépilant.
 */
export default function BadgeUnlockedModal({ badge, remaining = 0, onNext, colors }) {
    const screenHeight = Dimensions.get('window').height;
    const slideAnim = useRef(new Animated.Value(screenHeight)).current;
    const scaleAnim = useRef(new Animated.Value(0.6)).current;

    useEffect(() => {
        if (!badge) return;
        // Rejoue l'animation à chaque badge de la file, pas seulement au premier.
        slideAnim.setValue(screenHeight);
        scaleAnim.setValue(0.6);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
        Animated.parallel([
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 7 }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 6 }),
        ]).start();
    }, [badge]);

    const handleNext = () => {
        Animated.timing(slideAnim, {
            toValue: screenHeight,
            duration: 250,
            useNativeDriver: true,
        }).start(() => onNext());
    };

    if (!badge) return null;

    return (
        <Modal visible={true} animationType="fade" transparent={true} onRequestClose={handleNext}>
            <View style={styles.overlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleNext} />

                <Animated.View style={[
                    styles.modalContainer,
                    {
                        backgroundColor: colors.bgSurface,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}>
                    <Animated.View style={[
                        styles.iconCircle,
                        {
                            backgroundColor: colors.primaryLight,
                            borderColor: colors.primary,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}>
                        <Ionicons name={badge.icon || 'trophy'} size={64} color={colors.primary} />
                    </Animated.View>

                    <Text style={[styles.congrats, { color: colors.primary }]}>Badge débloqué !</Text>
                    <Text style={[styles.name, { color: colors.textMain }]}>{badge.name}</Text>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>{badge.description}</Text>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary }]}
                        onPress={() => {
                            Haptics.selectionAsync().catch(() => { });
                            handleNext();
                        }}
                    >
                        <Text style={styles.buttonText}>
                            {remaining > 0 ? `Suivant (${remaining})` : 'Super !'}
                        </Text>
                        <Ionicons name={remaining > 0 ? 'arrow-forward' : 'checkmark'} size={20} color="#fff" />
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 30 },
    modalContainer: { width: '100%', borderRadius: 25, padding: 28, alignItems: 'center' },
    iconCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    congrats: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    name: { fontSize: 24, fontWeight: 'bold', marginTop: 8, textAlign: 'center' },
    description: { fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 20 },
    button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 30, marginTop: 24 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
