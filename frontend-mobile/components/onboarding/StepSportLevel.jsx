import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";

import StepFooter from "./StepFooter";
import { useTheme } from "../../hooks/useTheme";

// Valeurs seules : une table de libellés au niveau module serait figée à la
// langue du chargement du bundle. Les mots sont résolus au rendu, et les
// identifiants sont ceux du catalogue (auth.niveau.*), partagés avec le web.
const LEVELS = ["debutant", "intermediaire", "experimente"];

export default function StepSportLevel({ level, setLevel, onNext, onSkip, isLoading }) {
    const { colors, typography } = useTheme();
    const { t } = useTranslation();

    return (
        <View style={styles.formContainer}>
            <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>{t('auth.onboarding.niveau.h2')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t('auth.onboarding.niveau.intro')}
            </Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.onboarding.niveau.label')}</Text>
                <View style={styles.levelContainer}>
                    {LEVELS.map((valeur) => {
                        const isSelected = level === valeur;
                        return (
                            <TouchableOpacity
                                key={valeur}
                                style={[
                                    styles.levelButton,
                                    { borderColor: colors.borderStrong, backgroundColor: colors.bgSurface },
                                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                                ]}
                                onPress={() => setLevel(valeur)}
                            >
                                <Text style={[
                                    styles.levelButtonText,
                                    { color: colors.textMain },
                                    isSelected && { color: "#FFF", fontWeight: "bold" },
                                ]}>
                                    {/* i18n-suffixes: debutant intermediaire experimente */}
                                    {t(`auth.niveau.${valeur}`)}
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
    title: { textAlign: "center", fontSize: 24, lineHeight: 29, fontWeight: "bold", marginBottom: 8 },
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
