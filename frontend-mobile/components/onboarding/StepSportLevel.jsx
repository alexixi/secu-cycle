import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import StepFooter from "./StepFooter";
import { useTheme } from "../../hooks/useTheme";

const LEVELS = [
    { label: "Débutant", value: "debutant" },
    { label: "Intermédiaire", value: "intermediaire" },
    { label: "Expérimenté", value: "experimente" },
];

export default function StepSportLevel({ level, setLevel, onNext, onSkip, isLoading }) {
    const { colors, typography } = useTheme();

    return (
        <View style={styles.formContainer}>
            <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>Votre niveau sportif</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Pour adapter les itinéraires proposés et l'estimation des temps de trajet. Facultatif.
            </Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Niveau</Text>
                <View style={styles.levelContainer}>
                    {LEVELS.map((item) => {
                        const isSelected = level === item.value;
                        return (
                            <TouchableOpacity
                                key={item.value}
                                style={[
                                    styles.levelButton,
                                    { borderColor: colors.borderStrong, backgroundColor: colors.bgSurface },
                                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                                ]}
                                onPress={() => setLevel(item.value)}
                            >
                                <Text style={[
                                    styles.levelButtonText,
                                    { color: colors.textMain },
                                    isSelected && { color: "#FFF", fontWeight: "bold" },
                                ]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <StepFooter onNext={onNext} onSkip={onSkip} isLoading={isLoading} nextDisabled={!level} />
        </View>
    );
}

const styles = StyleSheet.create({
    formContainer: { width: "100%" },
    title: { textAlign: "center", fontSize: 24, fontWeight: "bold", marginBottom: 8 },
    subtitle: { textAlign: "center", fontSize: 15, marginBottom: 30 },
    inputGroup: { width: "100%", marginBottom: 20 },
    label: { fontSize: 14, fontWeight: "bold", marginBottom: 8, marginLeft: 4 },
    levelContainer: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 5 },
    levelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    levelButtonText: { fontSize: 13 },
});
