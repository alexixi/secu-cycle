import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";

import { DangerButton } from "../components/ui/Button";
import PasswordInput from "../components/ui/PasswordInput";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { deleteAccount } from "../services/apiBack";
import { trackEvent } from "../services/analytics";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { SwipeBackScreen } from "../components/SwipeBackScreen";

import * as Haptics from 'expo-haptics';

const SUPPRIME = [
    "Votre compte et votre adresse e-mail",
    "Votre nom, votre date de naissance et votre niveau sportif",
    "Vos adresses de domicile et de travail",
    "Vos vélos",
    "Vos itinéraires, leurs tracés et votre historique",
    "Vos badges et vos sessions de connexion",
];

export default function DeleteAccountPage() {
    const router = useRouter();
    const { colors } = useTheme();
    const { token, logoutAuth } = useAuth();

    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState(false);

    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const supprimer = async () => {
        setIsLoading(true);
        setError(null);

        try {
            await deleteAccount(token, password);
            trackEvent('account_deleted');
            await logoutAuth();
            router.replace('/login');
        } catch (err) {
            setError(err?.status === 401
                ? "Mot de passe incorrect."
                : "Une erreur est survenue lors de la suppression.");
            setPasswordError(err?.status === 401);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
            setIsLoading(false);
        }
    };

    const handleConfirm = () => {
        Alert.alert(
            "Supprimer définitivement ?",
            "Votre compte et les données qui y sont rattachées seront effacés. Cette action est irréversible.",
            [
                { text: "Annuler", style: "cancel" },
                { text: "Supprimer", style: "destructive", onPress: supprimer },
            ],
        );
    };

    return (
        <SwipeBackScreen background={colors.bgMain}>
            {(close) => (
                <KeyboardAwareScrollView
                    style={[styles.container, { backgroundColor: colors.bgMain }]}
                    contentContainerStyle={styles.scrollContainer}
                    enableOnAndroid={true}
                    extraScrollHeight={160}
                    keyboardShouldPersistTaps="handled"
                >
                    <ScreenHeader title="Supprimer mon compte" onBack={close} />

                    <View style={styles.formContainer}>

                        <View style={[styles.warningBox, { backgroundColor: colors.errorBg, borderColor: colors.error }]}>
                            <Ionicons name="warning-outline" size={22} color={colors.error} />
                            <Text style={[styles.warningText, { color: colors.error }]}>
                                La suppression est immédiate et définitive : aucune restauration
                                ne sera possible.
                            </Text>
                        </View>

                        <View style={styles.block}>
                            <Text style={[styles.blockTitle, { color: colors.textMain }]}>
                                Ce qui est supprimé
                            </Text>
                            {SUPPRIME.map((ligne) => (
                                <View key={ligne} style={styles.bulletRow}>
                                    <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                                    <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{ligne}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.block}>
                            <Text style={[styles.blockTitle, { color: colors.textMain }]}>
                                Ce qui est conservé
                            </Text>
                            <View style={styles.bulletRow}>
                                <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
                                <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                                    Vos signalements de dangers restent visibles pour les autres
                                    cyclistes, mais ils ne sont plus reliés à votre compte.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>
                                Confirmez avec votre mot de passe
                            </Text>
                            <PasswordInput
                                password={password}
                                setPassword={setPassword}
                                hasError={passwordError}
                                setHasError={setPasswordError}
                                autoComplete="current-password"
                            />
                        </View>

                        {error && (
                            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                        )}

                        <View style={styles.buttonWrapper}>
                            <DangerButton
                                title="Supprimer mon compte"
                                iconName="trash-outline"
                                onPress={handleConfirm}
                                isLoading={isLoading}
                                disabled={!password}
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
    scrollContainer: { padding: 20, paddingBottom: 160, flexGrow: 1 },
    formContainer: { marginTop: 10 },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
    },
    warningText: { flex: 1, fontSize: 14, lineHeight: 20 },
    block: { marginBottom: 24 },
    blockTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
    bulletText: { flex: 1, fontSize: 14, lineHeight: 20 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
    errorText: { textAlign: 'center', marginVertical: 10, fontSize: 14 },
    buttonWrapper: { marginTop: 10 },
});
