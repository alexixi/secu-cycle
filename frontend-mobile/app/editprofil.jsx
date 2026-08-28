import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import DateTimePicker from "@react-native-community/datetimepicker";

import { Button, OutlineButton } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useFormat } from "../hooks/useFormat";
import { bcp47 } from "../utils/datetime";
import { useTheme } from "../hooks/useTheme";
import { changeProfileInfo } from "../services/apiBack";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { SwipeBackScreen } from "../components/SwipeBackScreen";

import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

export default function EditProfilePage() {
    const router = useRouter();
    const { colors } = useTheme();
    const { t, i18n } = useTranslation();
    const f = useFormat();
    const { user, token, updateUser } = useAuth();

    const [firstName, setFirstName] = useState(user?.first_name || "");
    const [lastName, setLastName] = useState(user?.last_name || "");
    const [birthDate, setBirthDate] = useState(user?.birth_date ? new Date(user.birth_date) : new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [level, setLevel] = useState(user?.sport_level || "intermediaire");

    const levels = ['debutant', 'intermediaire', 'experimente'];

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const updated = await changeProfileInfo(
                token,
                firstName,
                lastName,
                null,
                birthDate.toISOString().split('T')[0],
                level
            );

            await updateUser({ ...user, ...updated });

            router.back();
        } catch (error) {
            console.error("Erreur modification:", error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
        } finally {
            setIsLoading(false);
        }
    };

    const onChangeDate = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) setBirthDate(selectedDate);
    };

    return (
        <SwipeBackScreen background={colors.bgMain}>
        {(close) => (
        <KeyboardAwareScrollView
            style={[styles.container, { backgroundColor: colors.bgMain }]}
            contentContainerStyle={styles.scrollContainer}
        >
            <ScreenHeader title={t('compte.modales.profil.titre')} onBack={close} />

            <View style={styles.formContainer}>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.champs.prenom')}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.bgSurface, color: colors.textMain, borderColor: colors.borderStrong }]}
                        value={firstName}
                        onChangeText={setFirstName}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.champs.nom')}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.bgSurface, color: colors.textMain, borderColor: colors.borderStrong }]}
                        value={lastName}
                        onChangeText={setLastName}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.champs.email')}</Text>
                    <TouchableOpacity
                        style={[styles.input, styles.readOnlyRow, { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong }]}
                        onPress={() => router.push("/editemail")}
                        accessibilityRole="button"
                        accessibilityLabel={t('compte.email.titre')}
                    >
                        <Text style={{ color: colors.textMain, fontSize: 16, flex: 1 }} numberOfLines={1}>
                            {user?.email || t('compte.modales.profil.emailNonRenseigne')}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                        {t('compte.modales.profil.verificationCode')}
                    </Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('compte.modales.profil.naissance')}</Text>
                    <TouchableOpacity
                        style={[styles.input, { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong, justifyContent: 'center' }]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={{ color: colors.textMain, fontSize: 16 }}>
                            {f.dateSeule(birthDate)}
                        </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={birthDate}
                            mode="date"
                            display="spinner"
                            locale={bcp47(i18n.language)}
                            onChange={onChangeDate}
                        />
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('compte.modales.profil.niveauSportif')}</Text>
                    <View style={styles.levelContainer}>
                        {levels.map((valeur) => (
                            <TouchableOpacity
                                key={valeur}
                                style={[
                                    styles.levelButton,
                                    { borderColor: colors.borderStrong, backgroundColor: colors.bgSurface },
                                    level === valeur && { backgroundColor: colors.primary, borderColor: colors.primary }
                                ]}
                                onPress={() => setLevel(valeur)}
                            >
                                <Text style={[
                                    styles.levelButtonText,
                                    { color: colors.textMain },
                                    level === valeur && { color: '#FFF', fontWeight: 'bold' }
                                ]}>
                                    {/* i18n-suffixes: debutant intermediaire experimente */}
                                    {t(`auth.niveau.${valeur}`)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.buttonWrapper}>
                    <Button
                        title={t('compte.adresses.enregistrer')}
                        iconName="checkmark-circle-outline"
                        onPress={handleSave}
                        isLoading={isLoading}
                    />

                    <View style={{ marginTop: 15 }}>
                        <OutlineButton
                            title={t('commun.annuler')}
                            onPress={close}
                        />
                    </View>
                </View>
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
    inputGroup: { width: '100%', marginBottom: 20 },
    label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
    readOnlyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    helpText: { fontSize: 12, marginTop: 6, marginLeft: 4 },
    buttonWrapper: { marginTop: 30 },
    levelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 5,
    },
    levelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelButtonText: {
        fontSize: 13,
    },
});
