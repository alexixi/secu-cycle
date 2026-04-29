import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Haptics from 'expo-haptics';

import { Button, DangerButton, OutlineButton } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { addBike, editBike, suppressBike } from "../services/apiBack";

export default function EditBikePage() {
    const router = useRouter();
    const { colors, typography } = useTheme();
    const { token, bikes, updateBikes } = useAuth();

    const { bikeId, bikeName, bikeType, bikeElectric } = useLocalSearchParams();
    const isEditing = !!bikeId;

    const [name, setName] = useState(bikeName || "");
    const [nameError, setNameError] = useState(false);
    const [selectedType, setSelectedType] = useState(bikeType || "ville");
    const [isElectric, setIsElectric] = useState(bikeElectric === 'true');
    const [isLoading, setIsLoading] = useState(false);

    const BIKE_TYPES = [
        { value: "ville", label: "Ville", icon: "bicycle" },
        { value: "vtt", label: "VTT", icon: "bike" },
        { value: "route", label: "Route", icon: "bike-fast" },
    ];

    const getIcon = (type, electric) => {
        if (type === "route") return "bike-fast";
        if (electric) return "bicycle-electric";
        if (type === "vtt") return "bike";
        return "bicycle";
    };

    const handleSave = async () => {
        if (!name.trim()) {
            setNameError(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { })
            Alert.alert("Nom requis", "Veuillez donner un nom à votre vélo.");
            return;
        }
        setNameError(false);
        setIsLoading(true);
        try {
            if (isEditing) {
                const updated = await editBike(token, bikeId, name.trim(), selectedType, isElectric);
                await updateBikes(bikes.map(b => b.id == bikeId ? updated : b));
            } else {
                const newBike = await addBike(token, name.trim(), selectedType, isElectric);
                await updateBikes([...bikes, newBike]);
            }
            router.back();
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { })
            Alert.alert("Erreur", "Impossible de sauvegarder. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            "Supprimer le vélo",
            `Supprimer "${name}" ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await suppressBike(token, { id: bikeId });
                            await updateBikes(bikes.filter(b => b.id != bikeId));
                            router.back();
                        } catch (error) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { })
                            Alert.alert("Erreur", "Impossible de supprimer le vélo.");
                        }
                    }
                }
            ]
        );
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
                <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>
                    {isEditing ? "Modifier mon vélo" : "Ajouter un vélo"}
                </Text>

                <View style={[styles.preview, { backgroundColor: colors.bgSurface, borderColor: colors.borderLight }]}>
                    <MaterialCommunityIcons
                        name={getIcon(selectedType, isElectric)}
                        size={48}
                        color={colors.primary}
                    />
                    {isElectric && (
                        <MaterialCommunityIcons
                            name="lightning-bolt"
                            size={18}
                            color={colors.primary}
                            style={styles.previewBolt}
                        />
                    )}
                    <Text style={[styles.previewName, { color: colors.textMain }]}>
                        {name.trim() || "Mon vélo"}
                    </Text>
                    <Text style={[styles.previewType, { color: colors.textSecondary }]}>
                        {BIKE_TYPES.find(t => t.value === selectedType)?.label}
                        {isElectric ? " électrique" : ""}
                    </Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Nom du vélo</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.bgSurface, color: colors.textMain, borderColor: colors.borderStrong }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="ex: Vélo de ville rouge"
                        placeholderTextColor={colors.textSecondary}
                        maxLength={30}
                    />
                    {nameError && (
                        <Text style={{ color: colors.error, marginTop: 4 }}>
                            Le vélo doit avoir un nom.
                        </Text>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Type de vélo</Text>
                    <View style={styles.typeContainer}>
                        {BIKE_TYPES.map((type) => {
                            const isSelected = selectedType === type.value;
                            return (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        styles.typeButton,
                                        { borderColor: colors.borderStrong, backgroundColor: colors.bgSurface },
                                        isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                    onPress={() => setSelectedType(type.value)}
                                >
                                    <MaterialCommunityIcons
                                        name={type.icon}
                                        size={24}
                                        color={isSelected ? '#FFF' : colors.textMain}
                                    />
                                    <Text style={[
                                        styles.typeButtonText,
                                        { color: isSelected ? '#FFF' : colors.textMain },
                                        isSelected && { fontWeight: 'bold' }
                                    ]}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Assistance électrique</Text>
                    <TouchableOpacity
                        style={[
                            styles.electricToggle,
                            { borderColor: colors.borderStrong, backgroundColor: colors.bgSurface },
                            isElectric && { borderColor: colors.primary, backgroundColor: colors.primaryLight }
                        ]}
                        onPress={() => setIsElectric(!isElectric)}
                    >
                        <MaterialCommunityIcons
                            name="lightning-bolt"
                            size={22}
                            color={isElectric ? colors.primary : colors.textSecondary}
                        />
                        <Text style={[
                            styles.electricToggleText,
                            { color: isElectric ? colors.primary : colors.textMain },
                            isElectric && { fontWeight: 'bold' }
                        ]}>
                            {isElectric ? "Vélo électrique" : "Pas d'assistance électrique"}
                        </Text>
                        <Ionicons
                            name={isElectric ? "checkmark-circle" : "ellipse-outline"}
                            size={22}
                            color={isElectric ? colors.primary : colors.borderStrong}
                            style={{ marginLeft: 'auto' }}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.buttonWrapper}>
                    <Button
                        title={isEditing ? "Modifier le vélo" : "Ajouter le vélo"}
                        iconName="checkmark-circle-outline"
                        onPress={handleSave}
                        isLoading={isLoading}
                    />
                    <OutlineButton
                        title="Annuler"
                        onPress={() => router.back()}
                    />
                    {isEditing && (
                        <DangerButton
                            title="Supprimer le vélo"
                            iconName="trash-outline"
                            onPress={handleDelete}
                            style={{ marginTop: 15 }}
                        />
                    )}
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
    preview: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 30,
        position: 'relative',
    },
    previewBolt: {
        position: 'absolute',
        top: 24,
        right: '35%',
    },
    previewName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 12,
    },
    previewType: {
        fontSize: 13,
        marginTop: 4,
        textTransform: 'capitalize',
    },
    inputGroup: { width: '100%', marginBottom: 20 },
    label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
    typeContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    typeButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    typeButtonText: { fontSize: 13 },
    electricToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    electricToggleText: { fontSize: 15 },
    buttonWrapper: { marginTop: 30, gap: 15, marginBottom: 10 },
});
