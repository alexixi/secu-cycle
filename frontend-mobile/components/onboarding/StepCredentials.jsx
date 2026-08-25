import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Button, OutlineButton } from "../ui/Button";
import EmailInput from "../ui/EmailInput";
import PasswordInput from "../ui/PasswordInput";
import { useTheme } from "../../hooks/useTheme";
import { LEGAL_LINKS, openLegalPage } from "../../constants/legal";

export const MIN_PASSWORD_LENGTH = 10;

export default function StepCredentials({
    email,
    setEmail,
    password,
    setPassword,
    password2,
    setPassword2,
    emailSyntaxError,
    setEmailSyntaxError,
    passwordMismatch,
    setPasswordMismatch,
    generalError,
    onSubmit,
    onGoLogin,
    isLoading,
}) {
    const { colors, typography } = useTheme();

    const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
    const isValidated =
        email &&
        password &&
        password2 &&
        !emailSyntaxError &&
        password.length >= MIN_PASSWORD_LENGTH;

    return (
        <View style={styles.formContainer}>
            <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>Créer un compte</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Commençons par vos identifiants de connexion.
            </Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Adresse mail *</Text>
                <EmailInput
                    email={email}
                    setEmail={setEmail}
                    emailError={emailSyntaxError}
                    setEmailError={setEmailSyntaxError}
                    hasError={generalError}
                    setHasError={() => { }}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Mot de passe *</Text>
                <PasswordInput
                    password={password}
                    setPassword={setPassword}
                    hasError={passwordMismatch || passwordTooShort}
                    setHasError={() => setPasswordMismatch(false)}
                    autoComplete="new-password"
                />
                <Text style={[styles.hintText, { color: colors.textSecondary }]}>Au moins {MIN_PASSWORD_LENGTH} caractères.</Text>
                {passwordTooShort && (
                    <Text style={[styles.errorText, { color: colors.error }]}>
                        Le mot de passe doit contenir au moins {MIN_PASSWORD_LENGTH} caractères.
                    </Text>
                )}
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Confirmation du mot de passe *</Text>
                <PasswordInput
                    password={password2}
                    setPassword={setPassword2}
                    hasError={passwordMismatch}
                    setHasError={() => setPasswordMismatch(false)}
                    autoComplete="new-password"
                />
                {passwordMismatch && (
                    <Text style={[styles.errorText, { color: colors.error, marginTop: 5 }]}>
                        Les mots de passe ne correspondent pas.
                    </Text>
                )}
            </View>

            {generalError && (
                <View style={[styles.generalErrorBox, { backgroundColor: colors.errorBg }]}>
                    <Ionicons name="sad-outline" size={20} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error, marginLeft: 10, flex: 1 }]}>
                        {generalError}
                    </Text>
                </View>
            )}

            <View style={styles.footer}>
                <Button
                    onPress={onSubmit}
                    isLoading={isLoading}
                    disabled={!isValidated}
                    title="Continuer"
                    iconName="arrow-forward-outline"
                />

                <Text style={[styles.consentText, { color: colors.textSecondary }]}>
                    En créant un compte, vous acceptez nos{" "}
                    <Text
                        style={[styles.consentLink, { color: colors.primary }]}
                        onPress={() => openLegalPage(LEGAL_LINKS.terms)}
                    >
                        conditions d&apos;utilisation
                    </Text>
                    {" "}et notre{" "}
                    <Text
                        style={[styles.consentLink, { color: colors.primary }]}
                        onPress={() => openLegalPage(LEGAL_LINKS.privacy)}
                    >
                        politique de confidentialité
                    </Text>
                    .
                </Text>

                <View style={styles.separatorContainer}>
                    <View style={[styles.separatorLine, { backgroundColor: colors.borderLight }]} />
                    <Text style={[styles.separatorText, { color: colors.textSecondary }]}>ou</Text>
                    <View style={[styles.separatorLine, { backgroundColor: colors.borderLight }]} />
                </View>

                <OutlineButton
                    onPress={onGoLogin}
                    title="J'ai déjà un compte"
                    iconName="log-in-outline"
                />
            </View>

            <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
                * Les champs marqués d&apos;une étoile sont obligatoires.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    formContainer: { width: "100%" },
    title: { textAlign: "center", fontSize: 24, lineHeight: 29, fontWeight: "bold", marginBottom: 8 },
    subtitle: { textAlign: "center", fontSize: 15, marginBottom: 30 },
    inputGroup: { width: "100%", marginBottom: 15 },
    label: { fontSize: 14, fontWeight: "bold", marginBottom: 8, marginLeft: 4 },
    hintText: { fontSize: 12, marginTop: 5, marginLeft: 4 },
    errorText: { fontSize: 12, marginTop: 5, marginLeft: 4 },
    generalErrorBox: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 15,
        padding: 10,
        borderRadius: 8,
    },
    footer: { marginTop: 15 },
    consentText: { fontSize: 12, lineHeight: 17, textAlign: "center", marginTop: 14 },
    consentLink: { textDecorationLine: "underline" },
    separatorContainer: { flexDirection: "row", alignItems: "center", marginVertical: 24 },
    separatorLine: { flex: 1, height: 1 },
    separatorText: { marginHorizontal: 10, fontSize: 14 },
    ruleText: { fontSize: 12, textAlign: "center", marginTop: 24, fontStyle: "italic" },
});
