import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { Button, OutlineButton } from '../components/ui/Button';
import { changeAddress } from '../services/apiBack';
import AdressInput from '../components/ui/AdressInput';
import * as Haptics from 'expo-haptics';

export default function EditAddressPage() {
    const router = useRouter();
    const { colors, typography } = useTheme();
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
        <KeyboardAwareScrollView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.bgMain }]}
            contentContainerStyle={styles.scrollContainer}
        >
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={28} color={colors.textMain} />
            </TouchableOpacity>

            <View style={styles.formContainer}>
                <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>Mes adresses</Text>

                <View style={[styles.inputGroup, { zIndex: 2000 }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Domicile</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong }]}>
                        <AdressInput
                            placeholder="Rechercher votre domicile..."
                            defaultValue={home}
                            onSelect={(address) => setHome(address ? address.name : "")}
                            icon={<Ionicons name="home" size={20} color={colors.textSecondary} />}
                        />
                    </View>
                </View>

                <View style={[styles.inputGroup, { zIndex: 1000 }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Travail</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong }]}>
                        <AdressInput
                            placeholder="Rechercher votre lieu de travail..."
                            defaultValue={work}
                            onSelect={(address) => setWork(address ? address.name : "")}
                            icon={<FontAwesome name="suitcase" size={20} color={colors.textSecondary} />}
                        />
                    </View>
                </View>

                <View style={styles.buttonWrapper}>
                    <Button
                        title="Enregistrer les modifications"
                        iconName="checkmark-circle-outline"
                        onPress={handleSave}
                        isLoading={isLoading}
                    />

                    <View style={{ marginTop: 15 }}>
                        <OutlineButton
                            title="Annuler"
                            onPress={() => router.back()}
                        />
                    </View>
                </View>
            </View>
        </KeyboardAwareScrollView>
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
    backButton: {
        marginTop: 40,
        marginBottom: 10
    },
    formContainer: {
        width: '100%'
    },
    title: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30
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
