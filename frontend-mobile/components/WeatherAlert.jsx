import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const LEVEL_COLORS = {
    watch: '#facc15',
    warning: '#fb923c',
    severe: '#ef4444',
};

export default function WeatherAlert({ alert, onDismiss, bottomOffset = 0 }) {
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

    return (
        <GestureDetector gesture={swipe}>
            <Animated.View
                style={[
                    styles.container,
                    { bottom: 80 + bottomOffset, borderLeftColor: LEVEL_COLORS[alert.level] || '#facc15' },
                    swipeStyle,
                ]}
            >
                <View style={styles.row}>
                    <Text style={styles.icon}>{alert.icon}</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>{alert.title}</Text>
                        <Text style={styles.body}>{alert.body}</Text>
                    </View>
                    <TouchableOpacity onPress={onDismiss} style={styles.close}>
                        <MaterialCommunityIcons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 12,
        right: 12,
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        borderLeftWidth: 5,
        padding: 14,
        zIndex: 149,
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
    body: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 14,
        marginTop: 2,
    },
    close: {
        padding: 6,
    },
});
