import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { useSwipeToClose } from '../hooks/useSwipeToClose';
import { useTheme } from '../hooks/useTheme';

export function SwipeBackScreen({ children, background }) {
    const { colors } = useTheme();
    const { gesture, contentStyle, close } = useSwipeToClose({ enabled: true });

    return (
        <View style={{ flex: 1 }}>
            <GestureDetector gesture={gesture}>
                <Animated.View
                    style={[
                        { flex: 1, backgroundColor: background ?? colors.bgMain },
                        contentStyle,
                    ]}
                >
                    {typeof children === 'function' ? children(close) : children}
                </Animated.View>
            </GestureDetector>
        </View>
    );
}
