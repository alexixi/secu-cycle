import { StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import StepFooter from "./StepFooter";
import { useTheme } from "../../hooks/useTheme";

export default function StepName({ firstName, setFirstName, lastName, setLastName, onNext, onSkip, isLoading }) {
    const { colors, typography } = useTheme();
    const { t } = useTranslation();

    return (
        <View style={styles.formContainer}>
            <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>{t('auth.onboarding.nom.h2')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t('auth.onboarding.nom.intro')}
            </Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.champs.prenom')}</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.bgSurface, color: colors.textMain, borderColor: colors.borderStrong }]}
                    value={firstName}
                    onChangeText={setFirstName}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.champs.nom')}</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.bgSurface, color: colors.textMain, borderColor: colors.borderStrong }]}
                    value={lastName}
                    onChangeText={setLastName}
                />
            </View>

            <StepFooter onNext={onNext} onSkip={onSkip} isLoading={isLoading} />
        </View>
    );
}

const styles = StyleSheet.create({
    formContainer: { width: "100%" },
    title: { textAlign: "center", fontSize: 24, lineHeight: 29, fontWeight: "bold", marginBottom: 8 },
    subtitle: { textAlign: "center", fontSize: 15, marginBottom: 30 },
    inputGroup: { width: "100%", marginBottom: 20 },
    label: { fontSize: 14, fontWeight: "bold", marginBottom: 8, marginLeft: 4 },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
});
