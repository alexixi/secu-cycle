import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import DateTimePicker from "@react-native-community/datetimepicker";

import { Button, OutlineButton } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { changeProfileInfo } from "../services/apiBack.mock";

export default function EditProfilePage() {
    const router = useRouter();
    const { colors, typography } = useTheme();
    const { user, token, updateUser } = useAuth();

    const [firstName, setFirstName] = useState(user?.first_name || "");
    const [lastName, setLastName] = useState(user?.last_name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [birthDate, setBirthDate] = useState(user?.birth_date ? new Date(user.birth_date) : new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [level, setLevel] = useState(user?.sport_level || "intermediaire");

    const levels = [
        { label: 'Débutant', value: 'debutant' },
        { label: 'Intermédiaire', value: 'intermediaire' },
        { label: 'Expérimenté', value: 'experimente' }
    ];

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await changeProfileInfo(
                token,
                firstName,
                lastName,
                email,
                birthDate.toISOString().split('T')[0],
                null,
                user?.sport_level
            );

            await updateUser({
                ...user,
                first_name: firstName,
                last_name: lastName,
                email: email,
                birth_date: birthDate.toISOString().split('T')[0],
                sport_level: level
            });

            router.back();
        } catch (error) {
            console.error("Erreur modification:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const onChangeDate = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) setBirthDate(selectedDate);
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
                <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>Modifier mon profil</Text>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Prénom</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.bgSurface, color: colors.textMain, borderColor: colors.borderStrong }]}
                        value={firstName}
                        onChangeText={setFirstName}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Nom</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.bgSurface, color: colors.textMain, borderColor: colors.borderStrong }]}
                        value={lastName}
                        onChangeText={setLastName}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Adresse mail</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.bgSurface, color: colors.textMain, borderColor: colors.borderStrong }]}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Date de naissance</Text>
                    <TouchableOpacity
                        style={[styles.input, { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong, justifyContent: 'center' }]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={{ color: colors.textMain, fontSize: 16 }}>
                            {birthDate.toLocaleDateString('fr-FR')}
                        </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={birthDate}
                            mode="date"
                            display="spinner"
                            onChange={onChangeDate}
                        />
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Niveau sportif</Text>
                    <View style={styles.levelContainer}>
                        {levels.map((item) => (
                            <TouchableOpacity
                                key={item.value}
                                style={[
                                    styles.levelButton,
                                    { borderColor: colors.borderStrong, backgroundColor: colors.bgSurface },
                                    level === item.value && { backgroundColor: colors.primary, borderColor: colors.primary }
                                ]}
                                onPress={() => setLevel(item.value)}
                            >
                                <Text style={[
                                    styles.levelButtonText,
                                    { color: colors.textMain },
                                    level === item.value && { color: '#FFF', fontWeight: 'bold' }
                                ]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={{ marginVertical: 20 }}>
                    <OutlineButton
                        title="Changer le mot de passe"
                        iconName="lock-closed-outline"
                        onPress={() => router.push("/editpassword")}
                    />
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
    container: { flex: 1 },
    scrollContainer: { flexGrow: 1, padding: 20, paddingBottom: 50 },
    backButton: { marginTop: 40, marginBottom: 10 },
    formContainer: { width: '100%' },
    title: { textAlign: 'center', fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
    inputGroup: { width: '100%', marginBottom: 20 },
    label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
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