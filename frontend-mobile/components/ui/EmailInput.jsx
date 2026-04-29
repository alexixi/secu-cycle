import { StyleSheet, Text, TextInput } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useState } from "react";
import * as Haptics from 'expo-haptics';

export default function EmailInput({ email, setEmail, emailError, setEmailError, hasError, setHasError }) {
    const { colors } = useTheme();
    const [showEmailError, setShowEmailError] = useState(false);

    const mailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

     const validateEmail = (text) => {
        if (!text) {
            setEmailError(false);
        } else if (!mailRegex.test(text)) {
            setEmailError(true);
        } else {
            setEmailError(false);
        }
    };

    const handleChangeEmail = (text) => {
        setShowEmailError(false);
        setEmail(text);
        setHasError(false);
        validateEmail(text);
    };

    const handleBlur = () => {
        validateEmail(email);
        setShowEmailError(true);
        if (emailError) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
        }
    };

    return (
        <>
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.bgSurface,
                        color: colors.textMain,
                        borderColor: (hasError || (emailError && showEmailError)) ? colors.error : colors.borderStrong
                    }
                ]}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={handleChangeEmail}
                onBlur={handleBlur}
            />
            {
                emailError && showEmailError && (
                    <Text style={[styles.errorText, { color: colors.error }]}>
                        Adresse mail invalide.
                    </Text>
                )
            }
        </>
    );
}

const styles = StyleSheet.create({
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
    },
    errorText: {
        fontSize: 12,
        marginTop: 5,
        marginLeft: 4,
    }
});
