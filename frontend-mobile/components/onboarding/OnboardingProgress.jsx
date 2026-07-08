import { StyleSheet, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export default function OnboardingProgress({ current, total }) {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            {Array.from({ length: total }).map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.segment,
                        { backgroundColor: index <= current ? colors.primary : colors.borderStrong },
                    ]}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        gap: 6,
        marginBottom: 24,
    },
    segment: {
        flex: 1,
        height: 5,
        borderRadius: 3,
    },
});
