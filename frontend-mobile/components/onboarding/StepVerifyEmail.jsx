import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation();

    const resendDisabled = isResending || cooldown > 0;
    const resendLabel = isResending
        ? t('auth.onboarding.verifEmail.envoi')
        : cooldown > 0
            ? t('auth.onboarding.verifEmail.renvoyerCodeDelai', { secondes: cooldown })
            : t('auth.onboarding.verifEmail.renvoyerCode');

    return (
        <View style={styles.formContainer}>
            <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>{t('auth.onboarding.verifEmail.h2')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t('auth.onboarding.verifEmail.codeEnvoye', { longueur: CODE_LENGTH })}{"\n"}
                <Text style={{ fontWeight: "bold", color: colors.textMain }}>{email}</Text>.
            </Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.onboarding.verifEmail.labelCode')}</Text>
                <CodeInput value={code} onChange={setCode} hasError={!!error} />
                {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
            </View>

            <Button
                onPress={onSubmit}
                isLoading={isLoading}
                disabled={code.length < CODE_LENGTH}
                title={t('auth.onboarding.verifEmail.verifier')}
                iconName="checkmark-circle-outline"
            />

            <View style={styles.linksRow}>
                <TouchableOpacity onPress={onResend} disabled={resendDisabled}>
                    <Text style={[typography.link, { color: resendDisabled ? colors.textSecondary : colors.primary }]}>
                        {resendLabel}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onEditEmail}>
                    <Text style={[typography.link, { color: colors.textSecondary }]}>{t('auth.onboarding.verifEmail.modifierEmail')}</Text>
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
    title: { textAlign: "center", fontSize: 24, lineHeight: 29, fontWeight: "bold", marginBottom: 8 },
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
