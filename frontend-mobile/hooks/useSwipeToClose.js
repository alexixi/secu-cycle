import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';


const OPEN_MS = 180;

export function useSwipeToClose({ enabled }) {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const canGoBack = router.canGoBack();
    const active = enabled && Platform.OS === 'android' && canGoBack;
    const translateX = useSharedValue(active ? width : 0);
    const goBack = useCallback(() => {
        if (router.canGoBack()) router.back();
        else router.replace('/');
    }, [router]);

    useEffect(() => {
        if (active) translateX.value = withTiming(0, { duration: OPEN_MS });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const close = useCallback(() => {
        if (!active) {
            goBack();
            return;
        }
        translateX.value = withTiming(width, { duration: OPEN_MS }, (finished) => {
            if (finished) runOnJS(goBack)();
        });
    }, [active, width, goBack, translateX]);

    const gesture = Gesture.Pan()
        .enabled(active)
        .activeOffsetX(20)
        .failOffsetY([-15, 15])
        .onUpdate((e) => {
            translateX.value = Math.max(0, e.translationX);
        })
        .onEnd((e) => {
            const threshold = Math.min(80, width * 0.25);
            if (e.translationX >= threshold || e.velocityX > 800) {
                translateX.value = withTiming(width, { duration: OPEN_MS }, (finished) => {
                    if (finished) runOnJS(goBack)();
                });
            } else {
                translateX.value = withSpring(0, { damping: 22, stiffness: 220 });
            }
        });

    const contentStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return { gesture, contentStyle, close };
}
