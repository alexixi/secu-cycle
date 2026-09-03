import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { Button, OutlineButton } from "../components/ui/Button";
import PasswordInput from "../components/ui/PasswordInput";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { changePassword } from "../services/apiBack";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { SwipeBackScreen } from "../components/SwipeBackScreen";

import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

const MIN_PASSWORD_LENGTH = 10;

export default function ChangePasswordPage() {
    const router = useRouter();
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { token } = useAuth();

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState(false);

    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            setError(t('compte.modales.motDePasse.tropCourt', { min: MIN_PASSWORD_LENGTH }));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { })
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t('compte.modales.motDePasse.discordants'));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { })
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await changePassword(token, oldPassword, newPassword);
            router.back();
        } catch (err) {
            setError(err?.status === 401
                ? t('compte.modales.motDePasse.actuelIncorrect')
                : t('compte.modales.motDePasse.erreurModification'));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { })
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SwipeBackScreen background={colors.bgMain}>
        {(close) => (
        <KeyboardAwareScrollView
            style={[styles.container, { backgroundColor: colors.bgMain }]}
            contentContainerStyle={styles.scrollContainer}
        >
            <ScreenHeader title={t('compte.modales.motDePasse.titre')} onBack={close} />

            <View style={styles.formContainer}>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('compte.modales.motDePasse.actuel')}</Text>
                    <PasswordInput
                        password={oldPassword}
                        setPassword={setOldPassword}
                        setHasError={setPasswordError}
                        autoComplete="current-password"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('compte.modales.motDePasse.nouveau')}</Text>
                    <PasswordInput
                        password={newPassword}
                        setPassword={setNewPassword}
                        hasError={newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH}
                        setHasError={setPasswordError}
                        autoComplete="new-password"
                    />
                    <Text style={[styles.helpText, { color: colors.textSecondary }]}>{t('compte.modales.motDePasse.regle', { min: MIN_PASSWORD_LENGTH })}</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('compte.modales.motDePasse.confirmation')}</Text>
                    <PasswordInput
                        password={confirmPassword}
                        setPassword={setConfirmPassword}
                        hasError={newPassword !== confirmPassword && confirmPassword.length > 0}
                        setHasError={setPasswordError}
                        autoComplete="new-password"
                    />
                </View>

                {error && (
                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                )}

                <View style={styles.buttonWrapper}>
                    <Button
                        title={t('compte.modales.motDePasse.confirmer')}
                        onPress={handleConfirm}
                        isLoading={isLoading}
                        disabled={!oldPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < MIN_PASSWORD_LENGTH}
                    />
                </View>
            </View>
        </KeyboardAwareScrollView>
        )}
        </SwipeBackScreen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContainer: { padding: 20, flexGrow: 1 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
    helpText: { fontSize: 12, marginTop: 5, marginLeft: 4 },
    errorText: { textAlign: 'center', marginVertical: 10, fontSize: 14 },
    buttonWrapper: { marginTop: 20 }
});
