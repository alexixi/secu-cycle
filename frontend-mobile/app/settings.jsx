import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { SwipeBackScreen } from '../components/SwipeBackScreen';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SegmentedSelector } from '../components/ui/SegmentedSelector';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../hooks/useLocale';
import { useTheme } from '../hooks/useTheme';
import { LEGAL_LINKS, openLegalPage } from '../constants/legal';
import { setRecapEmails } from '../services/apiBack';
import {
    ACCEPTED,
    DECLINED,
    getBackgroundLocationChoice,
    setBackgroundLocationChoice,
} from '../services/locationDisclosure';
import {
    areNotificationsEnabled,
    areWeatherAlertsEnabled,
    setWeatherAlertsEnabled,
    getNotificationPermission,
    requestNotificationPermission,
    setNotificationsEnabled,
} from '../services/notificationPreference';

const LANGUAGE_OPTIONS = [
    { value: 'auto', icon: 'phone-portrait-outline' },
    // i18n-exempt-start: endonymes — un sélecteur de langue s'affiche toujours
    // dans la langue qu'il propose. « Français » reste « Français » sur une
    // interface anglaise, sans quoi un anglophone égaré ne reconnaît pas
    // l'option qu'il cherche. C'est la seule position de l'application où ne pas
    // traduire est le comportement correct.
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
    // i18n-exempt-end
];

const THEME_OPTIONS = [
    { value: 'light', icon: 'sunny' },
    { value: 'auto', icon: 'settings-outline' },
    { value: 'dark', icon: 'moon' },
];

function LinkRow({ icon, label, onPress, colors, isLast, tint }) {
    return (
        <TouchableOpacity
            style={[
                styles.linkRow,
                !isLast && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
            ]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
        >
            <Ionicons name={icon} size={20} color={tint ?? colors.textMain} />
            <Text style={[styles.linkLabel, { color: tint ?? colors.textMain }]}>{label}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );
}

export default function SettingsPage() {
    const router = useRouter();
    const { colors, themeMode, setThemeMode } = useTheme();
    const { languageMode, setLanguageMode } = useLocale();
    const { t } = useTranslation();
    const { user, token, updateUser } = useAuth();

    const [notifEnabled, setNotifEnabled] = useState(true);
    const [weatherAlertsEnabled, setWeatherAlerts] = useState(true);
    const [permission, setPermission] = useState('granted');
    const [backgroundLocation, setBackgroundLocation] = useState(false);
    const [recapEmails, setRecapEmailsState] = useState(true);
    const [recapPending, setRecapPending] = useState(false);

    useEffect(() => {
        areNotificationsEnabled().then(setNotifEnabled);
        areWeatherAlertsEnabled().then(setWeatherAlerts);
        getBackgroundLocationChoice().then((choice) => setBackgroundLocation(choice === ACCEPTED));
    }, []);

    useEffect(() => {
        if (user) setRecapEmailsState(user.recap_emails !== false);
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            getNotificationPermission().then(setPermission);
        }, []),
    );

    const handleNotifToggle = async (value) => {
        Haptics.selectionAsync().catch(() => { });

        if (value) {
            const status = await requestNotificationPermission();
            setPermission(status);

            if (status !== 'granted') {
                Alert.alert(
                    t('parametres.notifications.bloqueesTitre'),
                    t('parametres.notifications.bloqueesTexte'),
                    [
                        { text: t('commun.annuler'), style: 'cancel' },
                        { text: t('parametres.notifications.ouvrirReglages'), onPress: () => Linking.openSettings() },
                    ],
                );
                return;
            }
        }

        setNotifEnabled(value);
        await setNotificationsEnabled(value);
    };

    const handleWeatherAlertsToggle = async (value) => {
        Haptics.selectionAsync().catch(() => { });

        if (value) {
            const status = await requestNotificationPermission();
            setPermission(status);
            if (status !== 'granted') {
                Alert.alert(
                    t('parametres.notifications.bloqueesTitre'),
                    t('parametres.notifications.bloqueesTexte'),
                    [
                        { text: t('commun.annuler'), style: 'cancel' },
                        { text: t('parametres.notifications.ouvrirReglages'), onPress: () => Linking.openSettings() },
                    ],
                );
                return;
            }
        }

        setWeatherAlerts(value);
        await setWeatherAlertsEnabled(value);
    };

    const handleRecapEmailsToggle = async (value) => {
        Haptics.selectionAsync().catch(() => { });

        const precedent = recapEmails;
        setRecapEmailsState(value);
        setRecapPending(true);
        try {
            const misAJour = await setRecapEmails(token, value);
            updateUser(misAJour);
        } catch {
            setRecapEmailsState(precedent);
            Alert.alert(
                t('parametres.notifications.reglageNonEnregistre'),
                t('parametres.notifications.reglageErreur'),
            );
        } finally {
            setRecapPending(false);
        }
    };

    const handleBackgroundLocationToggle = async (value) => {
        Haptics.selectionAsync().catch(() => { });
        setBackgroundLocation(value);
        await setBackgroundLocationChoice(value ? ACCEPTED : DECLINED);
    };

    const isBlocked = (notifEnabled || weatherAlertsEnabled) && permission !== 'granted';

    return (
        <SwipeBackScreen background={colors.bgMain}>
            {(close) => (
                <ScrollView
                    style={[styles.container, { backgroundColor: colors.bgMain }]}
                    contentContainerStyle={styles.scrollContainer}
                >
                    <ScreenHeader title={t('parametres.titre')} onBack={close} />

                    {user && (
                        <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                            <View style={styles.sectionTitleRow}>
                                <Ionicons name="person-outline" size={24} color={colors.textMain} />
                                <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{t('parametres.compte.titre')}</Text>
                            </View>

                            <LinkRow
                                icon="create-outline"
                                label={t('parametres.compte.modifierInfos')}
                                onPress={() => router.push('/editprofil')}
                                colors={colors}
                            />
                            <LinkRow
                                icon="mail-outline"
                                label={t('parametres.compte.modifierEmail')}
                                onPress={() => router.push('/editemail')}
                                colors={colors}
                            />
                            <LinkRow
                                icon="lock-closed-outline"
                                label={t('parametres.compte.changerMotDePasse')}
                                onPress={() => router.push('/editpassword')}
                                colors={colors}
                            />
                            <LinkRow
                                icon="person-remove-outline"
                                label={t('parametres.compte.auteursBloques')}
                                onPress={() => router.push('/blockedauthors')}
                                colors={colors}
                                isLast
                            />
                        </View>
                    )}

                    <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="color-palette-outline" size={24} color={colors.textMain} />
                            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{t('parametres.apparence.titre')}</Text>
                        </View>

                        <Text style={[styles.hint, { color: colors.textSecondary }]}>
                            {t('parametres.apparence.indice')}
                        </Text>

                        <SegmentedSelector
                            value={themeMode}
                            options={THEME_OPTIONS.map((option) => ({
                                ...option,
                                label: t(`parametres.apparence.${option.value}`),
                            }))}
                            onChange={setThemeMode}
                            accessibilityLabelFor={(option) =>
                                t('parametres.apparence.a11y', { theme: option.label })}
                        />
                    </View>

                    <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="language-outline" size={24} color={colors.textMain} />
                            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>
                                {t('parametres.langue.titre')}
                            </Text>
                        </View>

                        <Text style={[styles.hint, { color: colors.textSecondary }]}>
                            {t('parametres.langue.indice')}
                        </Text>

                        <SegmentedSelector
                            value={languageMode}
                            options={LANGUAGE_OPTIONS.map((option) => ({
                                ...option,
                                label: option.label ?? t('parametres.langue.auto'),
                            }))}
                            onChange={setLanguageMode}
                            accessibilityLabelFor={(option) =>
                                t('parametres.langue.a11y', { langue: option.label })}
                        />
                    </View>

                    <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="notifications-outline" size={24} color={colors.textMain} />
                            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{t('parametres.notifications.titre')}</Text>
                        </View>

                        <View style={styles.switchRow}>
                            <View style={styles.switchLabel}>
                                <Text style={[styles.rowTitle, { color: colors.textMain }]}>
                                    {t('parametres.notifications.guidage')}
                                </Text>
                                <Text style={[styles.hint, { color: colors.textSecondary }]}>
                                    {t('parametres.notifications.guidageAide')}
                                </Text>
                            </View>

                            <Switch
                                value={notifEnabled}
                                onValueChange={handleNotifToggle}
                                trackColor={{ false: colors.borderStrong, true: colors.primary }}
                                thumbColor={colors.bgMain}
                                accessibilityLabel={t('parametres.notifications.guidageA11y')}
                            />
                        </View>

                        <View style={styles.switchRow}>
                            <View style={styles.switchLabel}>
                                <Text style={[styles.rowTitle, { color: colors.textMain }]}>
                                    {t('parametres.notifications.meteo')}
                                </Text>
                                <Text style={[styles.hint, { color: colors.textSecondary }]}>
                                    {t('parametres.notifications.meteoAide')}
                                </Text>
                            </View>

                            <Switch
                                value={weatherAlertsEnabled}
                                onValueChange={handleWeatherAlertsToggle}
                                trackColor={{ false: colors.borderStrong, true: colors.primary }}
                                thumbColor={colors.bgMain}
                                accessibilityLabel={t('parametres.notifications.meteoA11y')}
                            />
                        </View>

                        {user && (
                            <View style={styles.switchRow}>
                                <View style={styles.switchLabel}>
                                    <Text style={[styles.rowTitle, { color: colors.textMain }]}>
                                        {t('parametres.notifications.recap')}
                                    </Text>
                                    <Text style={[styles.hint, { color: colors.textSecondary }]}>
                                        {t('parametres.notifications.recapAide')}
                                    </Text>
                                </View>

                                <Switch
                                    value={recapEmails}
                                    onValueChange={handleRecapEmailsToggle}
                                    disabled={recapPending}
                                    trackColor={{ false: colors.borderStrong, true: colors.primary }}
                                    thumbColor={colors.bgMain}
                                    accessibilityLabel={t('parametres.notifications.recapA11y')}
                                />
                            </View>
                        )}

                        {isBlocked && (
                            <TouchableOpacity
                                style={[styles.warningRow, { backgroundColor: colors.warningBg }]}
                                onPress={() => Linking.openSettings()}
                            >
                                <Ionicons name="warning-outline" size={20} color={colors.warning} />
                                <Text style={[styles.warningText, { color: colors.warning }]}>
                                    {t('parametres.notifications.bloqueesBandeau')}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="location-outline" size={24} color={colors.textMain} />
                            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{t('parametres.localisation.titre')}</Text>
                        </View>

                        <View style={styles.switchRow}>
                            <View style={styles.switchLabel}>
                                <Text style={[styles.rowTitle, { color: colors.textMain }]}>
                                    {t('parametres.localisation.arrierePlan')}
                                </Text>
                                <Text style={[styles.hint, { color: colors.textSecondary }]}>
                                    {t('parametres.localisation.arrierePlanAide')}
                                </Text>
                            </View>

                            <Switch
                                value={backgroundLocation}
                                onValueChange={handleBackgroundLocationToggle}
                                trackColor={{ false: colors.borderStrong, true: colors.primary }}
                                thumbColor={colors.bgMain}
                                accessibilityLabel={t('parametres.localisation.arrierePlanA11y')}
                            />
                        </View>
                    </View>

                    <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="document-text-outline" size={24} color={colors.textMain} />
                            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{t('parametres.legal.titre')}</Text>
                        </View>

                        <LinkRow
                            icon="shield-checkmark-outline"
                            label={t('parametres.legal.confidentialite')}
                            onPress={() => openLegalPage(LEGAL_LINKS.privacy)}
                            colors={colors}
                        />
                        <LinkRow
                            icon="reader-outline"
                            label={t('parametres.legal.conditions')}
                            onPress={() => openLegalPage(LEGAL_LINKS.terms)}
                            colors={colors}
                        />
                        <LinkRow
                            icon="business-outline"
                            label={t('parametres.legal.mentions')}
                            onPress={() => openLegalPage(LEGAL_LINKS.legalNotice)}
                            colors={colors}
                            isLast
                        />
                    </View>

                    {user && (
                        <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                            <View style={styles.sectionTitleRow}>
                                <Ionicons name="alert-circle-outline" size={24} color={colors.error} />
                                <Text style={[styles.sectionTitle, { color: colors.error }]}>{t('parametres.zoneDanger.titre')}</Text>
                            </View>

                            <Text style={[styles.hint, { color: colors.textSecondary }]}>
                                {t('parametres.zoneDanger.avertissement')}
                            </Text>

                            <LinkRow
                                icon="trash-outline"
                                label={t('parametres.zoneDanger.supprimerCompte')}
                                onPress={() => router.push('/deleteaccount')}
                                colors={colors}
                                tint={colors.error}
                                isLast
                            />
                        </View>
                    )}
                </ScrollView>
            )}
        </SwipeBackScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 50,
    },
    section: {
        width: '100%',
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: 'bold',
    },
    hint: {
        fontSize: 13,
        lineHeight: 18,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
    },
    linkLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginTop: 5,
    },
    switchLabel: {
        flex: 1,
        gap: 4,
    },
    rowTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    warningRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 10,
        marginTop: 15,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
});
