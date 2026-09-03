import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../hooks/useTheme';

/**
 * Sélecteur segmenté à N positions, une seule active.
 *
 * Extrait de l'écran des paramètres, où il servait au thème, pour être partagé
 * avec le choix de la langue. Ce n'est pas la duplication du JSX qui a motivé
 * l'extraction mais celle des sémantiques d'accessibilité — rôles radio,
 * état sélectionné, retour haptique — que deux copies finissent toujours par
 * laisser diverger.
 *
 * @param {Array<{ value: string, label: string, icon?: string }>} options
 * @param {(value: string) => void} onChange  ignoré si la valeur est déjà active
 * @param {(option) => string} [accessibilityLabelFor]  libellé lu par le lecteur
 *        d'écran ; à défaut, le label visible suffit.
 */
export function SegmentedSelector({ value, options, onChange, accessibilityLabelFor, style }) {
    const { colors } = useTheme();

    const handlePress = (option) => {
        if (option.value === value) return;
        Haptics.selectionAsync().catch(() => { });
        onChange(option.value);
    };

    return (
        <View
            style={[styles.selector, { backgroundColor: colors.bgMain }, style]}
            accessibilityRole="radiogroup"
        >
            {options.map((option) => {
                const isActive = option.value === value;

                return (
                    <TouchableOpacity
                        key={option.value}
                        style={[
                            styles.btn,
                            isActive && [styles.btnActive, { backgroundColor: colors.bgSurface }],
                        ]}
                        onPress={() => handlePress(option)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isActive }}
                        accessibilityLabel={accessibilityLabelFor?.(option) ?? option.label}
                    >
                        {option.icon && (
                            <Ionicons
                                name={option.icon}
                                size={20}
                                color={isActive ? colors.primary : colors.textSecondary}
                            />
                        )}
                        <Text
                            style={[
                                styles.btnText,
                                { color: isActive ? colors.primary : colors.textSecondary },
                            ]}
                        >
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    selector: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginTop: 15,
        width: '100%',
    },
    btn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    btnActive: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    btnText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
