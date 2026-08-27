import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { SwipeBackScreen } from '../components/SwipeBackScreen';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { useAuth } from '../context/AuthContext';
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

const THEME_OPTIONS = [
    { mode: 'light', label: 'Clair', icon: 'sunny' },
    { mode: 'auto', label: 'Auto', icon: 'settings-outline' },
    { mode: 'dark', label: 'Sombre', icon: 'moon' },
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

    const handleThemeChange = (mode) => {
        if (mode === themeMode) return;
        Haptics.selectionAsync().catch(() => { });
        setThemeMode(mode);
    };

    const handleNotifToggle = async (value) => {
        Haptics.selectionAsync().catch(() => { });

        if (value) {
            const status = await requestNotificationPermission();
            setPermission(status);

            if (status !== 'granted') {
                Alert.alert(
                    'Notifications bloquées',
                    "Autorisez les notifications pour Sécu'Cycle dans les réglages de votre téléphone.",
                    [
                        { text: 'Annuler', style: 'cancel' },
                        { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
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
                    'Notifications bloquées',
                    "Autorisez les notifications pour Sécu'Cycle dans les réglages de votre téléphone.",
                    [
                        { text: 'Annuler', style: 'cancel' },
                        { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
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
                'Réglage non enregistré',
                "Nous n'avons pas pu joindre le serveur. Réessayez dans un instant.",
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
                    <ScreenHeader title="Paramètres" onBack={close} />

                    {user && (
                        <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                            <View style={styles.sectionTitleRow}>
                                <Ionicons name="person-outline" size={24} color={colors.textMain} />
                                <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Compte</Text>
                            </View>

                            <LinkRow
                                icon="create-outline"
                                label="Modifier mes informations"
                                onPress={() => router.push('/editprofil')}
                                colors={colors}
                            />
                            <LinkRow
                                icon="mail-outline"
                                label="Modifier mon adresse mail"
                                onPress={() => router.push('/editemail')}
                                colors={colors}
                            />
                            <LinkRow
                                icon="lock-closed-outline"
                                label="Changer le mot de passe"
                                onPress={() => router.push('/editpassword')}
                                colors={colors}
                            />
                            <LinkRow
                                icon="person-remove-outline"
                                label="Auteurs bloqués"
                                onPress={() => router.push('/blockedauthors')}
                                colors={colors}
                                isLast
                            />
                        </View>
                    )}

                    <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="color-palette-outline" size={24} color={colors.textMain} />
                            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Apparence</Text>
                        </View>

                        <Text style={[styles.hint, { color: colors.textSecondary }]}>
                            « Auto » suit le thème de votre téléphone.
                        </Text>

                        <View style={[styles.themeSelector, { backgroundColor: colors.bgMain }]}>
                            {THEME_OPTIONS.map(({ mode, label, icon }) => {
                                const isActive = themeMode === mode;
                                return (
                                    <TouchableOpacity
                                        key={mode}
                                        style={[
                                            styles.themeBtn,
                                            isActive && [styles.themeBtnActive, { backgroundColor: colors.bgSurface }],
                                        ]}
                                        onPress={() => handleThemeChange(mode)}
                                        accessibilityRole="radio"
                                        accessibilityState={{ selected: isActive }}
                                        accessibilityLabel={`Thème ${label}`}
                                    >
                                        <Ionicons
                                            name={icon}
                                            size={20}
                                            color={isActive ? colors.primary : colors.textSecondary}
                                        />
                                        <Text
                                            style={[
                                                styles.themeBtnText,
                                                { color: isActive ? colors.primary : colors.textSecondary },
                                            ]}
                                        >
                                            {label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="notifications-outline" size={24} color={colors.textMain} />
                            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Notifications</Text>
                        </View>

                        <View style={styles.switchRow}>
                            <View style={styles.switchLabel}>
                                <Text style={[styles.rowTitle, { color: colors.textMain }]}>
                                    Notifications de guidage
                                </Text>
                                <Text style={[styles.hint, { color: colors.textSecondary }]}>
                                    Affiche la prochaine instruction dans la barre de notifications
                                    pendant un trajet.
                                </Text>
                            </View>

                            <Switch
                                value={notifEnabled}
                                onValueChange={handleNotifToggle}
                                trackColor={{ false: colors.borderStrong, true: colors.primary }}
                                thumbColor={colors.bgMain}
                                accessibilityLabel="Activer les notifications"
                            />
                        </View>

                        <View style={styles.switchRow}>
                            <View style={styles.switchLabel}>
                                <Text style={[styles.rowTitle, { color: colors.textMain }]}>
                                    Alertes météo
                                </Text>
                                <Text style={[styles.hint, { color: colors.textSecondary }]}>
                                    Prévient d'une averse, d'un orage, de la grêle ou du verglas
                                    pendant un trajet.
                                </Text>
                            </View>

                            <Switch
                                value={weatherAlertsEnabled}
                                onValueChange={handleWeatherAlertsToggle}
                                trackColor={{ false: colors.borderStrong, true: colors.primary }}
                                thumbColor={colors.bgMain}
                                accessibilityLabel="Activer les alertes météo"
                            />
                        </View>

                        {user && (
                            <View style={styles.switchRow}>
                                <View style={styles.switchLabel}>
                                    <Text style={[styles.rowTitle, { color: colors.textMain }]}>
                                        Récapitulatif par e-mail
                                    </Text>
                                    <Text style={[styles.hint, { color: colors.textSecondary }]}>
                                        Un bilan de vos trajets, kilomètres et badges au début de
                                        chaque mois, et en début d&apos;année.
                                    </Text>
                                </View>

                                <Switch
                                    value={recapEmails}
                                    onValueChange={handleRecapEmailsToggle}
                                    disabled={recapPending}
                                    trackColor={{ false: colors.borderStrong, true: colors.primary }}
                                    thumbColor={colors.bgMain}
                                    accessibilityLabel="Recevoir le récapitulatif par e-mail"
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
                                    Les notifications sont bloquées par votre téléphone. Appuyez pour
                                    ouvrir les réglages.
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="location-outline" size={24} color={colors.textMain} />
                            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Localisation</Text>
                        </View>

                        <View style={styles.switchRow}>
                            <View style={styles.switchLabel}>
                                <Text style={[styles.rowTitle, { color: colors.textMain }]}>
                                    Guidage en arrière-plan
                                </Text>
                                <Text style={[styles.hint, { color: colors.textSecondary }]}>
                                    Poursuit le guidage quand l&apos;écran est éteint ou que
                                    l&apos;application n&apos;est plus au premier plan. Votre position
                                    n&apos;est relevée que pendant un trajet, uniquement pour vous guider,
                                    et n&apos;est pas conservée.
                                </Text>
                            </View>

                            <Switch
                                value={backgroundLocation}
                                onValueChange={handleBackgroundLocationToggle}
                                trackColor={{ false: colors.borderStrong, true: colors.primary }}
                                thumbColor={colors.bgMain}
                                accessibilityLabel="Activer le guidage en arrière-plan"
                            />
                        </View>
                    </View>

                    <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="document-text-outline" size={24} color={colors.textMain} />
                            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Informations légales</Text>
                        </View>

                        <LinkRow
                            icon="shield-checkmark-outline"
                            label="Politique de confidentialité"
                            onPress={() => openLegalPage(LEGAL_LINKS.privacy)}
                            colors={colors}
                        />
                        <LinkRow
                            icon="reader-outline"
                            label="Conditions d'utilisation"
                            onPress={() => openLegalPage(LEGAL_LINKS.terms)}
                            colors={colors}
                        />
                        <LinkRow
                            icon="business-outline"
                            label="Mentions légales"
                            onPress={() => openLegalPage(LEGAL_LINKS.legalNotice)}
                            colors={colors}
                            isLast
                        />
                    </View>

                    {user && (
                        <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                            <View style={styles.sectionTitleRow}>
                                <Ionicons name="alert-circle-outline" size={24} color={colors.error} />
                                <Text style={[styles.sectionTitle, { color: colors.error }]}>Zone de danger</Text>
                            </View>

                            <Text style={[styles.hint, { color: colors.textSecondary }]}>
                                La suppression efface définitivement votre compte et les données
                                qui y sont rattachées.
                            </Text>

                            <LinkRow
                                icon="trash-outline"
                                label="Supprimer mon compte"
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
    themeSelector: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginTop: 15,
        width: '100%',
    },
    themeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    themeBtnActive: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    themeBtnText: {
        fontSize: 14,
        fontWeight: '600',
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
