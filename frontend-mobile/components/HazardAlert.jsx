import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

// Icônes seules : les libellés partagent les identifiants de carte.signalement.*
const REPORT_ICONS = {
    accident: '🚨',
    travaux: '🚧',
    danger: '⚠️',
    obstacle: '🪨',
};

export default function HazardAlert({ report, distance, canVote, onVote, onDismiss, bottomOffset = 0 }) {
    const [busy, setBusy] = useState(false);
    const [voted, setVoted] = useState(false);
    const [counts, setCounts] = useState({
        confirmations: report.confirmations_count ?? 0,
        denials: report.denials_count ?? 0,
    });

    const { t } = useTranslation();
    const type = REPORT_ICONS[report.report_type] ? report.report_type : 'danger';
    // i18n-suffixes: accident travaux danger obstacle
    const meta = { icon: REPORT_ICONS[type], label: t(`carte.signalement.${type}`) };

    const { width } = useWindowDimensions();
    const translateX = useSharedValue(0);

    const swipe = Gesture.Pan()
        .activeOffsetX([-20, 20])
        .failOffsetY([-15, 15])
        .onUpdate((e) => {
            translateX.value = e.translationX;
        })
        .onEnd((e) => {
            const threshold = Math.min(120, width * 0.3);
            if (Math.abs(e.translationX) > threshold || Math.abs(e.velocityX) > 800) {
                const target = e.translationX > 0 ? width : -width;
                translateX.value = withTiming(target, { duration: 180 }, (finished) => {
                    if (finished) runOnJS(onDismiss)();
                });
            } else {
                translateX.value = withSpring(0, { damping: 22, stiffness: 220 });
            }
        });

    const swipeStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
        opacity: 1 - Math.min(Math.abs(translateX.value) / width, 1),
    }));

    const handleVote = async (isPresent) => {
        if (busy || voted) return;
        setBusy(true);
        Haptics.impactAsync(
            isPresent ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
        ).catch(() => { });
        try {
            const res = await onVote(isPresent);
            if (res) {
                setCounts({ confirmations: res.confirmations_count, denials: res.denials_count });
            }
            setVoted(true);
            setTimeout(onDismiss, 900);
        } finally {
            setBusy(false);
        }
    };

    return (
        <GestureDetector gesture={swipe}>
        <Animated.View style={[styles.container, { bottom: 80 + bottomOffset }, swipeStyle]}>
            <View style={styles.row}>
                <Text style={styles.icon}>{meta.icon}</Text>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{t('signalement.alerte.aDistance', { danger: meta.label, distance })}</Text>
                    <Text style={styles.counts}>{t('signalement.alerte.votes', counts)}</Text>
                </View>
                <TouchableOpacity onPress={onDismiss} style={styles.close}>
                    <MaterialCommunityIcons name="close" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {voted ? (
                <Text style={styles.thanks}>{t('signalement.alerte.merci')}</Text>
            ) : canVote ? (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.btn, styles.confirm]}
                        onPress={() => handleVote(true)}
                        disabled={busy}
                    >
                        {busy ? <ActivityIndicator size="small" color="#fff" /> : (
                            <Text style={styles.confirmText}>{t('carte.ui.signalement.confirmer')}</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btn, styles.deny]}
                        onPress={() => handleVote(false)}
                        disabled={busy}
                    >
                        <Text style={styles.denyText}>{t('carte.ui.signalement.pasLa')}</Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 100,
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        borderLeftWidth: 5,
        borderLeftColor: '#f59f00',
        padding: 14,
        zIndex: 150,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    icon: {
        fontSize: 30,
    },
    title: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    counts: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 14,
        marginTop: 2,
    },
    close: {
        padding: 6,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    btn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirm: {
        backgroundColor: '#2f9e44',
    },
    confirmText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    deny: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#e03131',
    },
    denyText: {
        color: '#ff6b6b',
        fontWeight: '700',
        fontSize: 15,
    },
    thanks: {
        color: '#69db7c',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 10,
        textAlign: 'center',
    },
});
