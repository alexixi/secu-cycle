import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { Button, OutlineButton } from '../components/ui/Button';
import { changeAddress } from '../services/apiBack';
import AdressInput from '../components/ui/AdressInput';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SwipeBackScreen } from '../components/SwipeBackScreen';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

export default function EditAddressPage() {
    const router = useRouter();
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { user, updateUser, token } = useAuth();

    const [home, setHome] = useState(user?.home_address || "");
    const [work, setWork] = useState(user?.work_address || "");
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await changeAddress(token, home, work);
            updateUser({ ...user, home_address: home, work_address: work });
            router.back();
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { })
            console.error("Erreur sauvegarde adresses :", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SwipeBackScreen background={colors.bgMain}>
        {(close) => (
        <KeyboardAwareScrollView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.bgMain }]}
            contentContainerStyle={styles.scrollContainer}
        >
            <ScreenHeader title={t('compte.adresses.titreEcran')} onBack={close} />

            <View style={styles.formContainer}>

                <View style={[styles.inputGroup, { zIndex: 2000 }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.adresses.domicile')}</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong }]}>
                        <AdressInput
                            placeholder={t('auth.onboarding.adresses.rechercherDomicile')}
                            defaultValue={home}
                            onSelect={(address) => setHome(address ? address.name : "")}
                            icon={<Ionicons name="home" size={20} color={colors.textSecondary} />}
                        />
                    </View>
                </View>

                <View style={[styles.inputGroup, { zIndex: 1000 }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.adresses.travail')}</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong }]}>
                        <AdressInput
                            placeholder={t('auth.onboarding.adresses.rechercherTravail')}
                            defaultValue={work}
                            onSelect={(address) => setWork(address ? address.name : "")}
                            icon={<FontAwesome name="suitcase" size={20} color={colors.textSecondary} />}
                        />
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
    container: {
        flex: 1
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 50
    },
    formContainer: {
        width: '100%'
    },
    inputGroup: {
        width: '100%',
        marginBottom: 20
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        marginLeft: 4
    },
    inputWrapper: {
        borderWidth: 1,
        borderRadius: 12,
        overflow: 'visible', // Important pour que la liste déroulante d'autocomplétion sorte du cadre
    },
    buttonWrapper: {
        marginTop: 30
    },
});
