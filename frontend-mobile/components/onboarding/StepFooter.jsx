import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "../ui/Button";
import { useTheme } from "../../hooks/useTheme";

export default function StepFooter({
    onNext,
    onSkip,
    isLoading,
    nextTitle,
    nextIcon = "arrow-forward-outline",
    nextDisabled = false,
    skipTitle,
}) {
    const { colors, typography } = useTheme();
    const { t } = useTranslation();

    // Les libellés par défaut sont résolus au rendu et non dans la signature :
    // une valeur par défaut est évaluée à chaque appel, mais t() doit être lu
    // dans le corps du composant pour que le changement de langue le re-rende.
    const libelleSuivant = nextTitle ?? t('auth.onboarding.continuer');
    const libellePasser = skipTitle ?? t('auth.onboarding.passerEtape');

    return (
        <View style={styles.footer}>
            <Button
                onPress={onNext}
                isLoading={isLoading}
                disabled={nextDisabled}
                title={libelleSuivant}
                iconName={nextIcon}
            />
            {onSkip && (
                <TouchableOpacity style={styles.skipButton} onPress={onSkip} disabled={isLoading}>
                    <Text style={[typography.link, styles.skipText, { color: colors.textSecondary }]}>{libellePasser}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    footer: { marginTop: 30 },
    skipButton: { alignSelf: "center", paddingVertical: 16, paddingHorizontal: 20 },
    skipText: { fontSize: 15 },
});
