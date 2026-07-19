import { View, StyleSheet } from 'react-native';

import { useTheme } from '../../hooks/useTheme';

export function GrabHandle() {
    const { colors } = useTheme();

    return (
        <View style={styles.wrap}>
            <View style={[styles.bar, { backgroundColor: colors.borderStrong }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        paddingBottom: 12,
    },
    bar: {
        width: 44,
        height: 5,
        borderRadius: 3,
    },
});
