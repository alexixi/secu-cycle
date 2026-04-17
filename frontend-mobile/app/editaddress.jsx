import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { changeAddress } from '../services/apiBack.mock';
import AdressInput from '../components/ui/AdressInput';

export default function EditAddressPage() {
    const router = useRouter();
    const { colors, typography } = useTheme();
    const { user, updateUser, token } = useAuth();

    const [home, setHome] = useState(user?.home_address || "");
    const [work, setWork] = useState(user?.work_address || "");

    const handleSave = async () => {
        try {
            await changeAddress(token, home, work);
            updateUser({ ...user, home_address: home, work_address: work });
            router.back();
        } catch (error) {
            console.error("Erreur sauvegarde adresses :", error);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: colors.bgMain }}
        >
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.textMain} />
                    </TouchableOpacity>
                    <Text style={[typography.h2, { color: colors.textMain }]}>Mes adresses</Text>
                </View>

                <View style={[styles.card, { backgroundColor: colors.bgMain }]}>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Domicile</Text>
                    <View style={[styles.inputWrapper, { borderColor: colors.borderLight, zIndex: 2000 }]}>
                        <AdressInput
                            placeholder="Rechercher votre domicile..."
                            defaultValue={home}
                            onSelect={(address) => setHome(address ? address.name : "")}
                            icon={<Ionicons name="home" size={20} color={colors.bgSecondary} />}
                        />
                    </View>

                    <Text style={[styles.label, { color: colors.textSecondary, marginTop: 25 }]}>Travail</Text>
                    <View style={[styles.inputWrapper, { borderColor: colors.borderLight, zIndex: 1000 }]}>
                        <AdressInput
                            placeholder="Rechercher votre lieu de travail..."
                            defaultValue={work}
                            onSelect={(address) => setWork(address ? address.name : "")}
                            icon={<FontAwesome name="suitcase" size={20} color={colors.bgSecondary} />}
                        />
                    </View>

                </View>

                <Button
                    title="Enregistrer les modifications"
                    onPress={handleSave}
                    style={{ marginTop: 10 }}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingTop: 60
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        gap: 15
    },
    backButton: {
        padding: 5
    },
    card: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 25,
    },
    label: {
        fontSize: 12,
        marginBottom: 10,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    inputWrapper: {
        borderWidth: 1,
        borderRadius: 12,
        backgroundColor: '#fdfdfd',
        overflow: 'visible',
    }
});