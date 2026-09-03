import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";

import { Button, OutlineButton } from "../ui/Button";
import { useTheme } from "../../hooks/useTheme";

// Valeur et icône seulement : un libellé posé ici serait figé à la langue du
// chargement du bundle. Les identifiants sont ceux du catalogue (auth.velo.*),
// partagés avec le web.
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

export default function StepBikes({ addedBikes, onAddBike, onFinish, isFinishing }) {
    const { colors, typography } = useTheme();
    const { t } = useTranslation();

    const [name, setName] = useState("");
    const [selectedType, setSelectedType] = useState("ville");
    const [isElectric, setIsElectric] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        if (!name.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
            Alert.alert(t('auth.velo.nomRequisTitre'), t('auth.velo.nomRequisTexte'));
            return;
        }
        setIsAdding(true);
        try {
            await onAddBike({ name: name.trim(), type: selectedType, isElectric });
            setName("");
            setSelectedType("ville");
            setIsElectric(false);
        } catch (_error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
            Alert.alert(t('commun.erreur'), t('auth.onboarding.velos.erreurAjout'));
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <View style={styles.formContainer}>
            <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>{t('auth.onboarding.velos.h2')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t('auth.onboarding.velos.intro')}
            </Text>

            {addedBikes.length > 0 && (
                <View style={styles.bikeList}>
                    {addedBikes.map((bike) => (
                        <View
                            key={bike.id}
                            style={[styles.bikeCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderLight }]}
                        >
                            <MaterialCommunityIcons
                                name={getIcon(bike.type, bike.is_electric)}
                                size={28}
                                color={colors.primary}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.bikeName, { color: colors.textMain }]}>{bike.name}</Text>
                                <Text style={[styles.bikeType, { color: colors.textSecondary }]}>
                                    {/* i18n-suffixes: ville vtt route */}
                                    {t(`auth.velo.${bike.type}`)}
                                    {bike.is_electric ? t('auth.velo.electriqueSuffixePuce') : ""}
                                </Text>
                            </View>
                            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                        </View>
                    ))}
                </View>
            )}

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
                                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                                ]}
                                onPress={() => setSelectedType(type.value)}
                            >
                                <MaterialCommunityIcons
                                    name={type.icon}
                                    size={24}
                                    color={isSelected ? "#FFF" : colors.textMain}
                                />
                                <Text style={[
                                    styles.typeButtonText,
                                    { color: isSelected ? "#FFF" : colors.textMain },
                                    isSelected && { fontWeight: "bold" },
                                ]}>
                                    {/* i18n-suffixes: ville vtt route */}
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
                        isElectric && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
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
                        isElectric && { fontWeight: "bold" },
                    ]}>
                        {isElectric ? t('auth.velo.veloElectrique') : t('auth.velo.sansAssistance')}
                    </Text>
                    <Ionicons
                        name={isElectric ? "checkmark-circle" : "ellipse-outline"}
                        size={22}
                        color={isElectric ? colors.primary : colors.borderStrong}
                        style={{ marginLeft: "auto" }}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <OutlineButton
                    title={t('auth.velo.ajouterCeVelo')}
                    iconName="add-circle-outline"
                    onPress={handleAdd}
                    isLoading={isAdding}
                    disabled={!name.trim()}
                />
                <View style={{ marginTop: 15 }}>
                    <Button
                        title={t('commun.terminer')}
                        iconName="checkmark-circle-outline"
                        onPress={onFinish}
                        isLoading={isFinishing}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    formContainer: { width: "100%" },
    title: { textAlign: "center", fontSize: 24, lineHeight: 29, fontWeight: "bold", marginBottom: 8 },
    subtitle: { textAlign: "center", fontSize: 15, marginBottom: 30 },
    bikeList: { width: "100%", marginBottom: 20, gap: 10 },
    bikeCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    bikeName: { fontSize: 15, fontWeight: "bold" },
    bikeType: { fontSize: 13, marginTop: 2 },
    inputGroup: { width: "100%", marginBottom: 20 },
    label: { fontSize: 14, fontWeight: "bold", marginBottom: 8, marginLeft: 4 },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
    typeContainer: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
    typeButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    typeButtonText: { fontSize: 13 },
    electricToggle: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    electricToggleText: { fontSize: 15 },
    footer: { marginTop: 10 },
});
