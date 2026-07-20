import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { DeviceEventEmitter, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Haptics from "expo-haptics";

import { Button, OutlineButton } from "../components/ui/Button";
import CodeInput, { CODE_LENGTH } from "../components/ui/CodeInput";
import EmailInput from "../components/ui/EmailInput";
import PasswordInput from "../components/ui/PasswordInput";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { SwipeBackScreen } from "../components/SwipeBackScreen";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { confirmEmailChange, requestEmailChange } from "../services/apiBack";
import { saveAccessToken, saveRefreshToken } from "../services/tokenStorage";

const RESEND_COOLDOWN_SECONDS = 60;

function mapRequestError(error) {
    if (error?.status === 401) return "Mot de passe incorrect.";
    if (error?.status === 409) return "Cette adresse mail est déjà utilisée par un autre compte.";
    if (error?.status === 429) return "Trop de demandes de changement. Réessayez plus tard.";
    if (error?.status === 422) return "Adresse mail invalide.";
    if (!error?.status) return "Connexion impossible. Vérifiez votre connexion internet.";
    return "Une erreur est survenue lors de l'envoi du code.";
}

function mapConfirmError(error) {
    if (error?.status === 400) return "Code invalide ou expiré.";
    if (error?.status === 409) return "Cette adresse vient d'être utilisée par un autre compte. Essayez-en une autre.";
    if (error?.status === 429) return "Trop de tentatives. Veuillez réessayer plus tard.";
    if (!error?.status) return "Connexion impossible. Vérifiez votre connexion internet.";
    return "Une erreur est survenue lors de la confirmation.";
}

export default function EditEmailPage() {
    const router = useRouter();
    const { colors, typography } = useTheme();
    const { user, token, updateUser } = useAuth();

    const currentEmail = user?.email || "";

    const [step, setStep] = useState(0);

    const [newEmail, setNewEmail] = useState("");
    const [emailError, setEmailError] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [password, setPassword] = useState("");

    const [code, setCode] = useState("");
    const [error, setError] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState(null);
    const [resendCooldown, setResendCooldown] = useState(0);

    const errorHaptic = () =>
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });

    const startResendCooldown = () => setResendCooldown(RESEND_COOLDOWN_SECONDS);

    const isCoolingDown = resendCooldown > 0;
    useEffect(() => {
        if (!isCoolingDown) return undefined;
        const id = setInterval(() => {
            setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
        }, 1000);
        return () => clearInterval(id);
    }, [isCoolingDown]);

    const isSameAsCurrent =
        newEmail.trim().toLowerCase() === currentEmail.trim().toLowerCase();

    const handleRequest = async () => {
        if (!newEmail || emailError || !password) {
            errorHaptic();
            return;
        }

        setError(null);
        setResendMessage(null);
        setIsLoading(true);
        try {
            await requestEmailChange(token, newEmail.trim(), password);
            setCode("");
            startResendCooldown();
            setStep(1);
        } catch (err) {
            errorHaptic();
            setHasError(true);
            setError(mapRequestError(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || isResending) return;
        setResendMessage(null);
        setError(null);
        setIsResending(true);
        try {
            await requestEmailChange(token, newEmail.trim(), password);
            setResendMessage("Un nouveau code a été envoyé.");
            startResendCooldown();
        } catch (err) {
            if (err?.status === 429) {
                setResendMessage("Trop de demandes. Veuillez réessayer plus tard.");
                startResendCooldown();
            } else {
                setResendMessage("Impossible d'envoyer le code pour le moment.");
            }
        } finally {
            setIsResending(false);
        }
    };

    const handleConfirm = async () => {
        setError(null);
        setResendMessage(null);
        setIsLoading(true);
        try {
            const result = await confirmEmailChange(token, code);

            if (result?.access_token) {
                await saveAccessToken(result.access_token);
                DeviceEventEmitter.emit("token-refreshed", result.access_token);
            }
            if (result?.refresh_token) {
                await saveRefreshToken(result.refresh_token);
            }
            if (result?.user) {
                await updateUser({ ...user, ...result.user });
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
            router.back();
        } catch (err) {
            errorHaptic();
            setError(mapConfirmError(err));
        } finally {
            setIsLoading(false);
        }
    };

    const backToEmailStep = () => {
        setStep(0);
        setCode("");
        setError(null);
        setResendMessage(null);
    };

    const handleBack = (close) => {
        if (step === 1) {
            backToEmailStep();
            return;
        }
        close();
    };

    const resendDisabled = isResending || resendCooldown > 0;
    const resendLabel = isResending
        ? "Envoi..."
        : resendCooldown > 0
            ? `Renvoyer le code (${resendCooldown}s)`
            : "Renvoyer le code";

    return (
        <SwipeBackScreen background={colors.bgMain}>
            {(close) => (
                <KeyboardAwareScrollView
                    style={[styles.container, { backgroundColor: colors.bgMain }]}
                    contentContainerStyle={styles.scrollContainer}
                    enableOnAndroid={true}
                    extraScrollHeight={20}
                    keyboardShouldPersistTaps="handled"
                >
                    <ScreenHeader
                        title="Modifier mon adresse mail"
                        onBack={() => handleBack(close)}
                    />

                    <View style={styles.formContainer}>
                        {step === 0 ? (
                            <>
                                <View style={[styles.currentCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderLight }]}>
                                    <Text style={[styles.currentLabel, { color: colors.textSecondary }]}>
                                        Adresse actuelle
                                    </Text>
                                    <Text style={[styles.currentValue, { color: colors.textMain }]} numberOfLines={1}>
                                        {currentEmail || "Non renseignée"}
                                    </Text>
                                </View>

                                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                    Nous enverrons un code à {CODE_LENGTH} chiffres à votre nouvelle
                                    adresse pour vérifier qu&apos;elle vous appartient.
                                </Text>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                                        Nouvelle adresse mail
                                    </Text>
                                    <EmailInput
                                        email={newEmail}
                                        setEmail={(v) => { setNewEmail(v); setError(null); }}
                                        emailError={emailError}
                                        setEmailError={setEmailError}
                                        hasError={hasError}
                                        setHasError={setHasError}
                                        textContentType="emailAddress"
                                    />
                                    {isSameAsCurrent && newEmail.length > 0 && (
                                        <Text style={[styles.hint, { color: colors.textSecondary }]}>
                                            C&apos;est déjà votre adresse actuelle.
                                        </Text>
                                    )}
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                                        Votre mot de passe
                                    </Text>
                                    <PasswordInput
                                        password={password}
                                        setPassword={(v) => { setPassword(v); setError(null); }}
                                        hasError={hasError}
                                        setHasError={setHasError}
                                        autoComplete="current-password"
                                    />
                                    <Text style={[styles.hint, { color: colors.textSecondary }]}>
                                        Demandé pour confirmer que c&apos;est bien vous.
                                    </Text>
                                </View>

                                {error && (
                                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                                )}

                                <Button
                                    title="Envoyer le code"
                                    iconName="mail-outline"
                                    onPress={handleRequest}
                                    isLoading={isLoading}
                                    disabled={!newEmail || emailError || isSameAsCurrent || !password}
                                />

                                <View style={{ marginTop: 15 }}>
                                    <OutlineButton title="Annuler" onPress={close} />
                                </View>
                            </>
                        ) : (
                            <>
                                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                    Nous avons envoyé un code à {CODE_LENGTH} chiffres à{"\n"}
                                    <Text style={{ fontWeight: "bold", color: colors.textMain }}>
                                        {newEmail.trim()}
                                    </Text>.
                                </Text>

                                <Text style={[styles.notice, { color: colors.textSecondary }]}>
                                    Une alerte a également été envoyée à votre adresse actuelle. Le
                                    changement ne prendra effet qu&apos;après validation du code.
                                </Text>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                                        Code de confirmation
                                    </Text>
                                    <CodeInput
                                        value={code}
                                        onChange={(v) => { setCode(v); setError(null); }}
                                        hasError={!!error}
                                    />
                                </View>

                                {error && (
                                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                                )}

                                <Button
                                    title="Confirmer le changement"
                                    iconName="checkmark-circle-outline"
                                    onPress={handleConfirm}
                                    isLoading={isLoading}
                                    disabled={code.length < CODE_LENGTH}
                                />

                                <TouchableOpacity
                                    style={styles.resendLink}
                                    onPress={handleResend}
                                    disabled={resendDisabled}
                                >
                                    <Text style={[typography.link, { color: resendDisabled ? colors.textSecondary : colors.primary }]}>
                                        {resendLabel}
                                    </Text>
                                </TouchableOpacity>

                                {resendMessage && (
                                    <Text style={[styles.resendMessage, { color: colors.textSecondary }]}>
                                        {resendMessage}
                                    </Text>
                                )}

                                <TouchableOpacity style={styles.changeAddressLink} onPress={backToEmailStep}>
                                    <Text style={[typography.link, { color: colors.textSecondary }]}>
                                        Utiliser une autre adresse
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </KeyboardAwareScrollView>
            )}
        </SwipeBackScreen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContainer: { flexGrow: 1, padding: 20, paddingBottom: 50 },
    formContainer: { width: '100%' },
    currentCard: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 24,
    },
    currentLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
    currentValue: { fontSize: 16 },
    subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
    notice: { fontSize: 13, lineHeight: 19, marginBottom: 24 },
    inputGroup: { width: '100%', marginBottom: 20 },
    label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
    hint: { fontSize: 12, marginTop: 6, marginLeft: 4 },
    errorText: { fontSize: 12, marginBottom: 15, marginLeft: 4, textAlign: 'center' },
    resendLink: { alignSelf: 'center', marginTop: 24, paddingVertical: 4 },
    resendMessage: { fontSize: 13, textAlign: 'center', marginTop: 16 },
    changeAddressLink: { alignSelf: 'center', marginTop: 16, paddingVertical: 4 },
});
