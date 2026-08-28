import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Button, OutlineButton } from "../components/ui/Button";
import EmailInput from "../components/ui/EmailInput";
import PasswordInput from "../components/ui/PasswordInput";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { login as apiLogin, getUserProfile, getUserBikes, getUserHistoric } from "../services/apiBack";
import { trackEvent } from "../services/analytics";
import * as Haptics from 'expo-haptics';

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const { loginAuth, updateUser, updateBikes, updateHistoric } = useAuth();
    const { colors, typography } = useTheme();
    const { t } = useTranslation();

    const handleSubmit = async () => {
        if (!email || !password || emailError) return;

        setIsLoading(true);
        try {
            const response_login = await apiLogin(email, password);
            await loginAuth(response_login.access_token, response_login.refresh_token);
            trackEvent('logged_in');

            const response_user = await getUserProfile(response_login.access_token);
            await updateUser(response_user);

            const response_bikes = await getUserBikes(response_login.access_token);
            await updateBikes(response_bikes);

            const response_historic = await getUserHistoric(response_login.access_token);
            await updateHistoric(response_historic);

            router.replace("/(tabs)/profile");
        } catch (error) {
            if (error?.status === 403) {
                router.replace({ pathname: "/signin", params: { email, password, verify: "1" } });
                return;
            }
            console.error("Login error:", error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAwareScrollView
            style={[styles.container, { backgroundColor: colors.bgMain }]}
            contentContainerStyle={styles.scrollContainer}
            enableOnAndroid={true}
            extraScrollHeight={20}
            keyboardShouldPersistTaps="handled"
        >

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={28} color={colors.textMain} />
            </TouchableOpacity>

            <View style={styles.formContainer}>
                <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>{t('auth.connexion.h2')}</Text>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.champs.email')}</Text>
                    <EmailInput email={email} setEmail={setEmail} emailError={emailError} setEmailError={setEmailError} hasError={hasError} setHasError={setHasError} />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.champs.motDePasse')}</Text>
                    <PasswordInput password={password} setPassword={setPassword} hasError={hasError} setHasError={setHasError} />
                </View>

                <TouchableOpacity
                    style={styles.forgotLink}
                    onPress={() => router.push({ pathname: "/forgotpassword", params: { email } })}
                >
                    <Text style={[typography.link, { color: colors.primary }]}>{t('auth.connexion.motDePasseOublie')}</Text>
                </TouchableOpacity>

                {hasError && (
                    <Text style={[styles.errorText, { color: colors.error, textAlign: 'center', marginBottom: 15 }]}>
                        {t('auth.connexion.identifiantsIncorrects')}{"\n"}{t('auth.connexion.reessayer')}
                    </Text>
                )}

                <Button
                    onPress={handleSubmit}
                    isLoading={isLoading}
                    disabled={!email || emailError || !password || hasError}
                    title={t('auth.connexion.seConnecter')}
                    iconName={"log-in-outline"}
                />

                <View style={styles.separatorContainer}>
                    <View style={[styles.separatorLine, { backgroundColor: colors.borderLight }]} />
                    <Text style={[styles.separatorText, { color: colors.textSecondary }]}>{t('auth.connexion.ou')}</Text>
                    <View style={[styles.separatorLine, { backgroundColor: colors.borderLight }]} />
                </View>

                <OutlineButton
                    onPress={() => router.push("/signin")}
                    title={t('auth.connexion.creerCompte')}
                    iconName="person-add-outline"
                />
            </View>
        </KeyboardAwareScrollView>
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
        marginBottom: 40,
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
    errorText: {
        fontSize: 12,
        marginTop: 5,
        marginLeft: 4,
    },
    forgotLink: {
        alignSelf: 'center',
        marginTop: -8,
        marginBottom: 15,
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 12,
        marginTop: 10,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    separatorLine: {
        flex: 1,
        height: 1,
    },
    separatorText: {
        marginHorizontal: 10,
        fontSize: 14,
    },
    outlineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 12,
        borderWidth: 2,
    },
    outlineButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    }
});
