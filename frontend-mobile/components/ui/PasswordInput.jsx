import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export default function PasswordInput({ password, setPassword, hasError, setHasError }) {
    const [showPassword, setShowPassword] = useState(false);

    const { colors } = useTheme();

    return (
        <View style={[
            styles.passwordContainer,
            {
                backgroundColor: colors.bgSurface,
                borderColor: hasError ? colors.error : colors.borderStrong
            }
        ]}>
            <TextInput
                style={[styles.passwordInput, { color: colors.textMain }]}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                    setPassword(text);
                    setHasError(false);
                }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showPassword}>
                <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color={colors.textSecondary}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
    },
    showPassword: {
        padding: 10,
    }
});
