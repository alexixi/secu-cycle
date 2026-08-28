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
import { useTranslation } from 'react-i18next';

const SUPPRIME = [
    "ligneCompte",
    "ligneIdentite",
    "ligneAdresses",
    "ligneVelos",
    "ligneTrajets",
    "ligneBadges",
];

export default function DeleteAccountPage() {
    const router = useRouter();
    const { colors } = useTheme();
    const { t } = useTranslation();
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
                ? t('compte.modales.suppressionCompte.motDePasseIncorrect')
                : t('compte.modales.suppressionCompte.erreurSuppression'));
            setPasswordError(err?.status === 401);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
            setIsLoading(false);
        }
    };

    const handleConfirm = () => {
        Alert.alert(
            t('compte.modales.suppressionCompte.confirmerTitre'),
            t('compte.modales.suppressionCompte.confirmerTexte'),
            [
                { text: t('commun.annuler'), style: "cancel" },
                { text: t('compte.modales.suppressionCompte.confirmerAction'), style: "destructive", onPress: supprimer },
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
                    <ScreenHeader title={t('compte.modales.suppressionCompte.titre')} onBack={close} />

                    <View style={styles.formContainer}>

                        <View style={[styles.warningBox, { backgroundColor: colors.errorBg, borderColor: colors.error }]}>
                            <Ionicons name="warning-outline" size={22} color={colors.error} />
                            <Text style={[styles.warningText, { color: colors.error }]}>
                                {t('compte.modales.suppressionCompte.chapeau')}
                            </Text>
                        </View>

                        <View style={styles.block}>
                            <Text style={[styles.blockTitle, { color: colors.textMain }]}>
                                {t('compte.modales.suppressionCompte.sectionTitre')}
                            </Text>
                            {SUPPRIME.map((ligne) => (
                                <View key={ligne} style={styles.bulletRow}>
                                    <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                                    <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                                        {/* i18n-suffixes: ligneCompte ligneIdentite
                                            ligneAdresses ligneVelos ligneTrajets ligneBadges */}
                                        {t(`compte.modales.suppressionCompte.${ligne}`)}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.block}>
                            <Text style={[styles.blockTitle, { color: colors.textMain }]}>
                                {t('compte.modales.suppressionCompte.sectionConserve')}
                            </Text>
                            <View style={styles.bulletRow}>
                                <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
                                <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                                    {t('compte.modales.suppressionCompte.conserve')}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>
                                {t('compte.modales.suppressionCompte.confirmezMotDePasse')}
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
                                title={t('compte.modales.suppressionCompte.titre')}
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
