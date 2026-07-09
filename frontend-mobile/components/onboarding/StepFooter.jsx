import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Button } from "../ui/Button";
import { useTheme } from "../../hooks/useTheme";

export default function StepFooter({
    onNext,
    onSkip,
    isLoading,
    nextTitle = "Continuer",
    nextIcon = "arrow-forward-outline",
    nextDisabled = false,
    skipTitle = "Passer cette étape",
}) {
    const { colors, typography } = useTheme();

    return (
        <View style={styles.footer}>
            <Button
                onPress={onNext}
                isLoading={isLoading}
                disabled={nextDisabled}
                title={nextTitle}
                iconName={nextIcon}
            />
            {onSkip && (
                <TouchableOpacity style={styles.skipButton} onPress={onSkip} disabled={isLoading}>
                    <Text style={[typography.link, styles.skipText, { color: colors.textSecondary }]}>{skipTitle}</Text>
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
