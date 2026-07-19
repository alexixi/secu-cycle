import { useCallback, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const CLOSE_MS = 250;
const OPEN_SPRING = { dampingRatio: 0.7, duration: 700 };
const SNAP_SPRING = { damping: 26, stiffness: 220 };


export function useDragToDismiss({ visible, onClose, threshold = 120 }) {
    const { height } = useWindowDimensions();
    const translateY = useSharedValue(height);

    useEffect(() => {
        if (visible) translateY.value = withSpring(0, OPEN_SPRING);
        else translateY.value = height;
    }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

    const dismiss = useCallback(
        (cb) => {
            translateY.value = withTiming(height, { duration: CLOSE_MS }, (finished) => {
                if (finished && cb) runOnJS(cb)();
            });
        },
        [height, translateY]
    );

    const close = useCallback(() => dismiss(onClose), [dismiss, onClose]);

    const gesture = Gesture.Pan()
        .activeOffsetY(10)
        .failOffsetY(-10)
        .onUpdate((e) => {
            translateY.value = Math.max(0, e.translationY);
        })
        .onEnd((e) => {
            if (e.translationY > threshold || e.velocityY > 800) {
                translateY.value = withTiming(height, { duration: CLOSE_MS }, (finished) => {
                    if (finished) runOnJS(onClose)();
                });
            } else {
                translateY.value = withSpring(0, SNAP_SPRING);
            }
        });

    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return { gesture, sheetStyle, close, dismiss };
}
