import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { Button, OutlineButton } from "../components/ui/Button";
import PasswordInput from "../components/ui/PasswordInput";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { changeProfileInfo } from "../services/apiBack";

import * as Haptics from 'expo-haptics';

const MIN_PASSWORD_LENGTH = 10;

export default function ChangePasswordPage() {
    const router = useRouter();
    const { colors, typography } = useTheme();
    const { token } = useAuth();

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState(false);

    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { })
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Les nouveaux mots de passe ne correspondent pas.");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { })
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await changeProfileInfo(token, null, null, null, null, newPassword, null);
            router.back();
        } catch (err) {
            setError("Une erreur est survenue lors de la modification.");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { })
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAwareScrollView
            style={[styles.container, { backgroundColor: colors.bgMain }]}
            contentContainerStyle={styles.scrollContainer}
        >
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={28} color={colors.textMain} />
            </TouchableOpacity>

            <View style={styles.formContainer}>
                <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>
                    Modifier le mot de passe
                </Text>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Ancien mot de passe</Text>
                    <PasswordInput
                        password={oldPassword}
                        setPassword={setOldPassword}
                        setHasError={setPasswordError}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Nouveau mot de passe</Text>
                    <PasswordInput
                        password={newPassword}
                        setPassword={setNewPassword}
                        hasError={newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH}
                        setHasError={setPasswordError}
                    />
                    <Text style={[styles.helpText, { color: colors.textSecondary }]}>Au moins {MIN_PASSWORD_LENGTH} caractères.</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Confirmation</Text>
                    <PasswordInput
                        password={confirmPassword}
                        setPassword={setConfirmPassword}
                        hasError={newPassword !== confirmPassword && confirmPassword.length > 0}
                        setHasError={setPasswordError}
                    />
                </View>

                {error && (
                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                )}

                <View style={styles.buttonWrapper}>
                    <Button
                        title="Confirmer le changement"
                        onPress={handleConfirm}
                        isLoading={isLoading}
                        disabled={!oldPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < MIN_PASSWORD_LENGTH}
                    />
                </View>
            </View>
        </KeyboardAwareScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContainer: { padding: 20, flexGrow: 1 },
    backButton: { marginTop: 40, marginBottom: 10 },
    title: { textAlign: 'center', marginBottom: 30 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
    helpText: { fontSize: 12, marginTop: 5, marginLeft: 4 },
    errorText: { textAlign: 'center', marginVertical: 10, fontSize: 14 },
    buttonWrapper: { marginTop: 20 }
});
