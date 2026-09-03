import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import StepFooter from "./StepFooter";
import { useFormat } from "../../hooks/useFormat";
import { useTheme } from "../../hooks/useTheme";
import { bcp47 } from "../../utils/datetime";

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
    const { t, i18n } = useTranslation();
    const f = useFormat();
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
            <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>{t('auth.onboarding.naissance.h2')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t('auth.onboarding.facultatif')}
            </Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.onboarding.naissance.label')}</Text>
                <TouchableOpacity
                    style={[styles.input, { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong, justifyContent: "center" }]}
                    onPress={() => setShowPicker(true)}
                >
                    <Text style={{ color: hasValue ? colors.textMain : colors.textSecondary, fontSize: 16 }}>
                        {hasValue ? f.dateSeule(birthDate) : t('auth.onboarding.naissance.selectionnerDate')}
                    </Text>
                </TouchableOpacity>

                {showPicker && (
                    <DateTimePicker
                        value={birthDate}
                        mode="date"
                        display="spinner"
                        locale={bcp47(i18n.language)}
                        maximumDate={new Date()}
                        onChange={onChange}
                    />
                )}

                {tooYoung && (
                    <Text style={[styles.errorText, { color: colors.error }]}>
                        {t('auth.onboarding.naissance.ageMinimum', { min: MIN_AGE })}
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
