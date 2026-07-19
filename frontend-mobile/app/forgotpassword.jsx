import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Haptics from "expo-haptics";

import { Button } from "../components/ui/Button";
import EmailInput from "../components/ui/EmailInput";
import PasswordInput from "../components/ui/PasswordInput";
import { useTheme } from "../hooks/useTheme";
import { forgotPassword, resetPassword } from "../services/apiBack";
import { SwipeBackScreen } from "../components/SwipeBackScreen";

const CODE_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 10;
const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPassword() {
    const router = useRouter();
    const { colors, typography } = useTheme();

    const params = useLocalSearchParams();
    const initialEmail = typeof params?.email === "string" ? params.email : "";

    const [step, setStep] = useState(0);

    const [email, setEmail] = useState(initialEmail);
    const [emailError, setEmailError] = useState(false);
    const [hasError, setHasError] = useState(false);

    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [resetError, setResetError] = useState(null);

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

    const handleBack = () => {
        if (step === 1) {
            setStep(0);
            return;
        }
        router.back();
    };

    const handleRequest = async () => {
        if (!email || emailError) {
            errorHaptic();
            return;
        }
        setIsLoading(true);
        try {
            await forgotPassword(email);
        } catch (_error) {
        } finally {
            setIsLoading(false);
        }
        startResendCooldown();
        setStep(1);
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || isResending) return;
        setResendMessage(null);
        setResetError(null);
        setIsResending(true);
        try {
            await forgotPassword(email);
            setResendMessage("Si un compte existe, un nouveau code a été envoyé.");
            startResendCooldown();
        } catch (error) {
            if (error?.status === 429) {
                setResendMessage("Trop de tentatives. Veuillez réessayer plus tard.");
                startResendCooldown();
            } else {
                setResendMessage("Impossible d'envoyer le code pour le moment.");
            }
        } finally {
            setIsResending(false);
        }
    };

    const handleCodeChange = (text) => {
        setCode(text.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH));
        setResetError(null);
    };

    const handleReset = async () => {
        setResetError(null);
        setResendMessage(null);
        if (password !== password2) {
            errorHaptic();
            setResetError("Les mots de passe ne correspondent pas.");
            return;
        }
        setIsLoading(true);
        try {
            await resetPassword(email, code, password);
            router.replace("/login");
        } catch (error) {
            errorHaptic();
            if (error?.status === 429) {
                setResetError("Trop de tentatives. Veuillez réessayer plus tard.");
            } else {
                setResetError("Code invalide ou expiré.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const resendDisabled = isResending || resendCooldown > 0;
    const resendLabel = isResending
        ? "Envoi..."
        : resendCooldown > 0
            ? `Renvoyer le code (${resendCooldown}s)`
            : "Renvoyer le code";

    return (
        <SwipeBackScreen background={colors.bgMain}>
        <KeyboardAwareScrollView
            style={[styles.container, { backgroundColor: colors.bgMain }]}
            contentContainerStyle={styles.scrollContainer}
            enableOnAndroid={true}
            extraScrollHeight={20}
            keyboardShouldPersistTaps="handled"
        >
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={28} color={colors.textMain} />
            </TouchableOpacity>

            <View style={styles.formContainer}>
                <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>
                    Mot de passe oublié
                </Text>

                {step === 0 ? (
                    <>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Saisissez votre adresse mail : nous vous enverrons un code
                            pour réinitialiser votre mot de passe.
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Adresse mail</Text>
                            <EmailInput
                                email={email}
                                setEmail={setEmail}
                                emailError={emailError}
                                setEmailError={setEmailError}
                                hasError={hasError}
                                setHasError={setHasError}
                            />
                        </View>

                        <Button
                            onPress={handleRequest}
                            isLoading={isLoading}
                            disabled={!email || emailError}
                            title="Envoyer le code"
                            iconName="mail-outline"
                        />
                    </>
                ) : (
                    <>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Nous avons envoyé un code à {CODE_LENGTH} chiffres à{"\n"}
                            <Text style={{ fontWeight: "bold", color: colors.textMain }}>{email}</Text>.
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Code de réinitialisation</Text>
                            <TextInput
                                style={[
                                    styles.codeInput,
                                    {
                                        backgroundColor: colors.bgSurface,
                                        color: colors.textMain,
                                        borderColor: resetError ? colors.error : colors.borderStrong,
                                    },
                                ]}
                                value={code}
                                onChangeText={handleCodeChange}
                                keyboardType="number-pad"
                                maxLength={CODE_LENGTH}
                                placeholder="––––––"
                                placeholderTextColor={colors.textSecondary}
                                autoFocus
                                textAlign="center"
                                autoComplete="sms-otp"
                                textContentType="oneTimeCode"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Nouveau mot de passe</Text>
                            <PasswordInput
                                password={password}
                                setPassword={setPassword}
                                hasError={!!resetError}
                                setHasError={() => setResetError(null)}
                            />
                            <Text style={[styles.hint, { color: colors.textSecondary }]}>
                                Au moins {MIN_PASSWORD_LENGTH} caractères.
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Confirmer le mot de passe</Text>
                            <PasswordInput
                                password={password2}
                                setPassword={setPassword2}
                                hasError={!!resetError || (password2.length > 0 && password2 !== password)}
                                setHasError={() => setResetError(null)}
                            />
                        </View>

                        {resetError && (
                            <Text style={[styles.errorText, { color: colors.error }]}>{resetError}</Text>
                        )}

                        <Button
                            onPress={handleReset}
                            isLoading={isLoading}
                            disabled={code.length < CODE_LENGTH || password.length < MIN_PASSWORD_LENGTH || password !== password2}
                            title="Réinitialiser"
                            iconName="checkmark-circle-outline"
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
                            <Text style={[styles.resendMessage, { color: colors.textSecondary }]}>{resendMessage}</Text>
                        )}
                    </>
                )}
            </View>
        </KeyboardAwareScrollView>
        </SwipeBackScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    },
    formContainer: {
        marginTop: 40,
        width: '100%',
    },
    title: {
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 30,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        marginLeft: 4,
    },
    hint: {
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
    },
    codeInput: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 16,
        fontSize: 28,
        letterSpacing: 12,
        fontWeight: 'bold',
    },
    errorText: {
        fontSize: 12,
        marginBottom: 15,
        marginLeft: 4,
        textAlign: 'center',
    },
    resendLink: {
        alignSelf: 'center',
        marginTop: 24,
        paddingVertical: 4,
    },
    resendMessage: {
        fontSize: 13,
        textAlign: 'center',
        marginTop: 16,
    },
});
