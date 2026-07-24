import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { SwipeBackScreen } from '../components/SwipeBackScreen';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import {
    areNotificationsEnabled,
    getNotificationPermission,
    requestNotificationPermission,
    setNotificationsEnabled,
} from '../services/notificationPreference';

const THEME_OPTIONS = [
    { mode: 'light', label: 'Clair', icon: 'sunny' },
    { mode: 'auto', label: 'Auto', icon: 'settings-outline' },
    { mode: 'dark', label: 'Sombre', icon: 'moon' },
];

function LinkRow({ icon, label, onPress, colors, isLast }) {
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
            <Ionicons name={icon} size={20} color={colors.textMain} />
            <Text style={[styles.linkLabel, { color: colors.textMain }]}>{label}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );
}

export default function SettingsPage() {
    const router = useRouter();
    const { colors, themeMode, setThemeMode } = useTheme();
    const { user } = useAuth();

    const [notifEnabled, setNotifEnabled] = useState(true);
    const [permission, setPermission] = useState('granted');

    useEffect(() => {
        areNotificationsEnabled().then(setNotifEnabled);
    }, []);

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

    const isBlocked = notifEnabled && permission !== 'granted';

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
