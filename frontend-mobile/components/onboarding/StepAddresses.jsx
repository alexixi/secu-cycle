import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import StepFooter from "./StepFooter";
import AdressInput from "../ui/AdressInput";
import { useTheme } from "../../hooks/useTheme";

export default function StepAddresses({ home, setHome, work, setWork, onNext, onSkip, isLoading }) {
    const { colors, typography } = useTheme();
    const { t } = useTranslation();

    return (
        <View style={styles.formContainer}>
            <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>{t('auth.onboarding.adresses.h2')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t('auth.onboarding.adresses.intro')}
            </Text>

            <View style={[styles.inputGroup, { zIndex: 2000 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.adresses.domicile')}</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong }]}>
                    <AdressInput
                        placeholder={t('auth.onboarding.adresses.rechercherDomicile')}
                        defaultValue={home}
                        onSelect={(address) => setHome(address ? address.name : "")}
                        icon={<Ionicons name="home" size={20} color={colors.textSecondary} />}
                    />
                </View>
            </View>

            <View style={[styles.inputGroup, { zIndex: 1000 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.adresses.travail')}</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong }]}>
                    <AdressInput
                        placeholder={t('auth.onboarding.adresses.rechercherTravail')}
                        defaultValue={work}
                        onSelect={(address) => setWork(address ? address.name : "")}
                        icon={<FontAwesome name="suitcase" size={20} color={colors.textSecondary} />}
                    />
                </View>
            </View>

            <StepFooter onNext={onNext} onSkip={onSkip} isLoading={isLoading} nextDisabled={!home && !work} />
        </View>
    );
}

const styles = StyleSheet.create({
    formContainer: { width: "100%" },
    title: { textAlign: "center", fontSize: 24, lineHeight: 29, fontWeight: "bold", marginBottom: 8 },
    subtitle: { textAlign: "center", fontSize: 15, marginBottom: 30 },
    inputGroup: { width: "100%", marginBottom: 20 },
    label: { fontSize: 14, fontWeight: "bold", marginBottom: 8, marginLeft: 4 },
    inputWrapper: {
        borderWidth: 1,
        borderRadius: 12,
        overflow: "visible",
    },
});
