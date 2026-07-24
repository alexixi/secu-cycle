import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Button } from "../ui/Button";
import CodeInput, { CODE_LENGTH } from "../ui/CodeInput";
import { useTheme } from "../../hooks/useTheme";

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

    return (
        <View style={styles.formContainer}>
            <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>Vérifiez votre e-mail</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Nous avons envoyé un code à {CODE_LENGTH} chiffres à{"\n"}
                <Text style={{ fontWeight: "bold", color: colors.textMain }}>{email}</Text>.
            </Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Code de vérification</Text>
                <CodeInput value={code} onChange={setCode} hasError={!!error} />
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
    errorText: { fontSize: 12, marginTop: 8, marginLeft: 4 },
    linksRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 24,
        paddingHorizontal: 4,
    },
    resendMessage: { fontSize: 13, textAlign: "center", marginTop: 16 },
});
