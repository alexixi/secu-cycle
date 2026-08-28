import { StyleSheet, TextInput } from "react-native";

import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from 'react-i18next';

export const CODE_LENGTH = 6;

export default function CodeInput({
    value,
    onChange,
    length = CODE_LENGTH,
    hasError = false,
    autoFocus = true,
}) {
    const { t } = useTranslation();
    const { colors } = useTheme();

    const handleChange = (text) => {
        onChange(text.replace(/[^0-9]/g, "").slice(0, length));
    };

    return (
        <TextInput
            style={[
                styles.codeInput,
                {
                    backgroundColor: colors.bgSurface,
                    color: colors.textMain,
                    borderColor: hasError ? colors.error : colors.borderStrong,
                },
            ]}
            value={value}
            onChangeText={handleChange}
            keyboardType="number-pad"
            maxLength={length}
            placeholder={"–".repeat(length)}
            placeholderTextColor={colors.textSecondary}
            autoFocus={autoFocus}
            textAlign="center"
            autoComplete="sms-otp"
            textContentType="oneTimeCode"
            accessibilityLabel={t('a11y.codeChiffres', { n: length })}
        />
    );
}

const styles = StyleSheet.create({
    codeInput: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 16,
        fontSize: 28,
        letterSpacing: 12,
        fontWeight: 'bold',
    },
});
