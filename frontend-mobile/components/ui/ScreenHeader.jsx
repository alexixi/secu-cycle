import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../hooks/useTheme';

export function ScreenHeader({ title, onBack }) {
    const { colors } = useTheme();
    const { t } = useTranslation();

    return (
        <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <TouchableOpacity
                onPress={onBack}
                style={styles.side}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel={t('a11y.retour')}
            >
                <Ionicons name="chevron-back" size={28} color={colors.textMain} />
            </TouchableOpacity>

            <Text style={[styles.title, { color: colors.textMain }]} numberOfLines={1}>
                {title}
            </Text>

            <View style={styles.side} />
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
        paddingBottom: 16,
        marginBottom: 32,
        borderBottomWidth: 1,
    },
    side: {
        width: 40,
        justifyContent: 'center',
    },
    title: {
        flex: 1,
        textAlign: 'center',
        fontSize: 22,
        fontWeight: 'bold',
    },
});
