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
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { SwipeBackScreen } from "../components/SwipeBackScreen";
import { useTranslation } from 'react-i18next';

export default function EditBikePage() {
    const router = useRouter();
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { token, bikes, updateBikes } = useAuth();

    const { bikeId, bikeName, bikeType, bikeElectric } = useLocalSearchParams();
    const isEditing = !!bikeId;

    const [name, setName] = useState(bikeName || "");
    const [nameError, setNameError] = useState(false);
    const [selectedType, setSelectedType] = useState(bikeType || "ville");
    const [isElectric, setIsElectric] = useState(bikeElectric === 'true');
    const [isLoading, setIsLoading] = useState(false);

    // Valeur et icône seulement : les mots viennent du catalogue au rendu.
    const BIKE_TYPES = [
        { value: "ville", icon: "bicycle" },
        { value: "vtt", icon: "bike" },
        { value: "route", icon: "bike-fast" },
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
            Alert.alert(t('auth.velo.nomRequisTitre'), t('auth.velo.nomRequisTexte'));
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
            Alert.alert(t('commun.erreur'), t('compte.velos.erreurSauvegarde'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            t('compte.velos.supprimerTitre'),
            t('compte.velos.supprimerTexte', { nom: name }),
            [
                { text: t('commun.annuler'), style: "cancel" },
                {
                    text: t('commun.supprimer'),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await suppressBike(token, { id: bikeId });
                            await updateBikes(bikes.filter(b => b.id != bikeId));
                            router.back();
                        } catch (error) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { })
                            Alert.alert(t('commun.erreur'), t('compte.velos.erreurSuppression'));
                        }
                    }
                }
            ]
        );
    };

    return (
        <SwipeBackScreen background={colors.bgMain}>
        {(close) => (
        <KeyboardAwareScrollView
            style={[styles.container, { backgroundColor: colors.bgMain }]}
            contentContainerStyle={styles.scrollContainer}
        >
            <ScreenHeader
                title={isEditing ? t('compte.velos.titreModifier') : t('compte.velos.titreAjouter')}
                onBack={close}
            />

            <View style={styles.formContainer}>

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
                        {name.trim() || t('compte.velos.monVelo')}
                    </Text>
                    <Text style={[styles.previewType, { color: colors.textSecondary }]}>
                        {t(`auth.velo.${selectedType}`)}
                        {isElectric ? t('auth.velo.suffixeElectrique') : ""}
                    </Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.velo.nom')}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.bgSurface, color: colors.textMain, borderColor: colors.borderStrong }]}
                        value={name}
                        onChangeText={setName}
                        placeholder={t('auth.velo.nomPlaceholder')}
                        placeholderTextColor={colors.textSecondary}
                        maxLength={30}
                    />
                    {nameError && (
                        <Text style={{ color: colors.error, marginTop: 4 }}>
                            {t('compte.velos.nomObligatoire')}
                        </Text>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.velo.typeVelo')}</Text>
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
                                        {t(`auth.velo.${type.value}`)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.velo.assistance')}</Text>
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
                            {isElectric ? t('auth.velo.veloElectrique') : t('auth.velo.sansAssistance')}
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
                        title={isEditing ? t('compte.velos.modifier') : t('compte.velos.ajouter')}
                        iconName="checkmark-circle-outline"
                        onPress={handleSave}
                        isLoading={isLoading}
                    />
                    <OutlineButton
                        title={t('commun.annuler')}
                        onPress={close}
                    />
                    {isEditing && (
                        <DangerButton
                            title={t('compte.velos.supprimerTitre')}
                            iconName="trash-outline"
                            onPress={handleDelete}
                            style={{ marginTop: 15 }}
                        />
                    )}
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
