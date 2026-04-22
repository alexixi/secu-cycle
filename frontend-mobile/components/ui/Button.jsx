import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import * as Haptics from 'expo-haptics';

export function Button({ title, iconName, onPress, isLoading, disabled }) {
    const { colors, typography } = useTheme();

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: disabled ? colors.bgTertiary : colors.primary,
                    opacity: disabled ? 0.4 : 1,
                    borderColor: disabled ? colors.borderStrong : colors.primary,
                }
            ]}
            onPress={!disabled && !isLoading && handlePress}
            disabled={disabled || isLoading}
        >
            {isLoading ? (
                <ActivityIndicator size="small" color={colors.textMain} />
            ) : (
                <>
                    {iconName && <Ionicons name={iconName} size={24} color={colors.textMain} />}
                    {title && <Text style={[typography.button, { color: colors.textMain }]}>{title}</Text>}
                </>
            )}
        </TouchableOpacity>
    );
}

export function DangerButton({ title, iconName, onPress, isLoading, disabled }) {
    const { colors, typography } = useTheme();

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: disabled ? colors.bgTertiary : colors.errorBg,
                    opacity: disabled ? 0.4 : 1,
                    borderColor: disabled ? colors.borderStrong : colors.error,
                }
            ]}
            onPress={!disabled && !isLoading && handlePress}
            disabled={disabled || isLoading}
        >
            {isLoading ? (
                <ActivityIndicator size="small" color={colors.error} />
            ) : (
                <>
                    {iconName && <Ionicons name={iconName} size={24} color={colors.error} />}
                    {title && <Text style={[typography.button, { color: colors.error }]}>{title}</Text>}
                </>
            )}
        </TouchableOpacity>
    );
}

export function OutlineButton({ title, iconName, onPress, isLoading, disabled }) {
    const { colors, typography } = useTheme();

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                styles.outlineButton,
                {
                    borderColor: disabled ? colors.borderStrong : colors.primary,
                    opacity: disabled ? 0.6 : 1,
                }
            ]}
            onPress={!disabled && !isLoading && handlePress}
            disabled={disabled || isLoading}
        >
            {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
            ) : (
                <>
                    {iconName && <Ionicons name={iconName} size={24} color={colors.primary} />}
                    {title && <Text style={[typography.button, { color: colors.primary }]}>{title}</Text>}
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 'bold',
        borderWidth: 1,
        gap: 15,
    },
    outlineButton: {
        borderWidth: 2,
        backgroundColor: 'transparent',
    },
});
