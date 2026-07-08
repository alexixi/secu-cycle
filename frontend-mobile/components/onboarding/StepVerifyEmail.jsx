import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Button } from "../ui/Button";
import { useTheme } from "../../hooks/useTheme";

const CODE_LENGTH = 6;

export default function StepVerifyEmail({
    email,
    code,
    setCode,
    onSubmit,
    onResend,
    onEditEmail,
    error,
    isLoading,
    isResending,
    resendMessage,
    cooldown = 0,
}) {
    const { colors, typography } = useTheme();

    const resendDisabled = isResending || cooldown > 0;
    const resendLabel = isResending
        ? "Envoi..."
        : cooldown > 0
            ? `Renvoyer le code (${cooldown}s)`
            : "Renvoyer le code";

    const handleChange = (text) => {
        const digitsOnly = text.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH);
        setCode(digitsOnly);
    };

    return (
        <View style={styles.formContainer}>
            <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>Vérifiez votre e-mail</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Nous avons envoyé un code à {CODE_LENGTH} chiffres à{"\n"}
                <Text style={{ fontWeight: "bold", color: colors.textMain }}>{email}</Text>.
            </Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Code de vérification</Text>
                <TextInput
                    style={[
                        styles.codeInput,
                        {
                            backgroundColor: colors.bgSurface,
                            color: colors.textMain,
                            borderColor: error ? colors.error : colors.borderStrong,
                        },
                    ]}
                    value={code}
                    onChangeText={handleChange}
                    keyboardType="number-pad"
                    maxLength={CODE_LENGTH}
                    placeholder="––––––"
                    placeholderTextColor={colors.textSecondary}
                    autoFocus
                    textAlign="center"
                />
                {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
            </View>

            <Button
                onPress={onSubmit}
                isLoading={isLoading}
                disabled={code.length < CODE_LENGTH}
                title="Vérifier"
                iconName="checkmark-circle-outline"
            />

            <View style={styles.linksRow}>
                <TouchableOpacity onPress={onResend} disabled={resendDisabled}>
                    <Text style={[typography.link, { color: resendDisabled ? colors.textSecondary : colors.primary }]}>
                        {resendLabel}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onEditEmail}>
                    <Text style={[typography.link, { color: colors.textSecondary }]}>Modifier l&apos;e-mail</Text>
                </TouchableOpacity>
            </View>

            {resendMessage && (
                <Text style={[styles.resendMessage, { color: colors.textSecondary }]}>{resendMessage}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    formContainer: { width: "100%" },
    title: { textAlign: "center", fontSize: 24, fontWeight: "bold", marginBottom: 8 },
    subtitle: { textAlign: "center", fontSize: 15, marginBottom: 30, lineHeight: 22 },
    inputGroup: { width: "100%", marginBottom: 20 },
    label: { fontSize: 14, fontWeight: "bold", marginBottom: 8, marginLeft: 4 },
    codeInput: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 16,
        fontSize: 28,
        letterSpacing: 12,
        fontWeight: "bold",
    },
    errorText: { fontSize: 12, marginTop: 8, marginLeft: 4 },
    linksRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 24,
        paddingHorizontal: 4,
    },
    resendMessage: { fontSize: 13, textAlign: "center", marginTop: 16 },
});
