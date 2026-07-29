import { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import StepFooter from "./StepFooter";
import { useTheme } from "../../hooks/useTheme";

const MIN_AGE = 15;

const computeAge = (date) => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        age -= 1;
    }
    return age;
};

export default function StepBirthDate({ birthDate, setBirthDate, hasValue, setHasValue, onNext, onSkip, isLoading }) {
    const { colors, typography } = useTheme();
    const [showPicker, setShowPicker] = useState(false);

    const tooYoung = hasValue && computeAge(birthDate) < MIN_AGE;

    const onChange = (event, selectedDate) => {
        if (Platform.OS === "android") {
            setShowPicker(false);
        }
        if (event.type === "dismissed") {
            return;
        }
        if (selectedDate) {
            setBirthDate(selectedDate);
            setHasValue(true);
        }
    };

    return (
        <View style={styles.formContainer}>
            <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>Votre date de naissance</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Cette information est facultative.
            </Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Date de naissance</Text>
                <TouchableOpacity
                    style={[styles.input, { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong, justifyContent: "center" }]}
                    onPress={() => setShowPicker(true)}
                >
                    <Text style={{ color: hasValue ? colors.textMain : colors.textSecondary, fontSize: 16 }}>
                        {hasValue ? birthDate.toLocaleDateString("fr-FR") : "Sélectionner une date"}
                    </Text>
                </TouchableOpacity>

                {showPicker && (
                    <DateTimePicker
                        value={birthDate}
                        mode="date"
                        display="spinner"
                        maximumDate={new Date()}
                        onChange={onChange}
                    />
                )}

                {tooYoung && (
                    <Text style={[styles.errorText, { color: colors.error }]}>
                        Vous devez avoir au moins {MIN_AGE} ans pour utiliser l&apos;application.
                    </Text>
                )}
            </View>

            <StepFooter onNext={onNext} onSkip={onSkip} isLoading={isLoading} nextDisabled={!hasValue || tooYoung} />
        </View>
    );
}

const styles = StyleSheet.create({
    formContainer: { width: "100%" },
    title: { textAlign: "center", fontSize: 24, lineHeight: 29, fontWeight: "bold", marginBottom: 8 },
    subtitle: { textAlign: "center", fontSize: 15, marginBottom: 30 },
    inputGroup: { width: "100%", marginBottom: 20 },
    label: { fontSize: 14, fontWeight: "bold", marginBottom: 8, marginLeft: 4 },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, minHeight: 50 },
    errorText: { fontSize: 12, marginTop: 8, marginLeft: 4 },
});
