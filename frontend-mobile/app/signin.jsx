import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useState } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, OutlineButton } from "../components/ui/Button";
import EmailInput from "../components/ui/EmailInput";
import PasswordInput from "../components/ui/PasswordInput";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { login as apiLogin, getUserProfile, register } from "../services/apiBack";
import * as Haptics from 'expo-haptics';

export default function RegisterScreen() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [birthDate, setBirthDate] = useState(new Date());
    const [birthDateText, setBirthDateText] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false); const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");

    const [hasPasswordError, setHasPasswordError] = useState(false);
    const [emailSyntaxError, setEmailSyntaxError] = useState(false);
    const [generalError, setGeneralError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const { loginAuth, updateUser } = useAuth();
    const { colors, typography } = useTheme();

    const isValidated = email && password && password2 && !hasPasswordError && !emailSyntaxError;

    const handleSubmit = async () => {
        if (password !== password2) {
            setHasPasswordError(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
            return;
        }

        setIsLoading(true);
        setGeneralError(false);

        try {
            await register(firstName, lastName, birthDate.toISOString().split('T')[0], email, password);

            try {
                const response_login = await apiLogin(email, password);
                await loginAuth(response_login.access_token);

                const response_user = await getUserProfile(response_login.access_token);
                await updateUser(response_user);

                router.replace("/(tabs)/profile");
            } catch (error) {
                router.replace("/login");
            }
        } catch (error) {
            setGeneralError(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordBlur = () => {
        setGeneralError(false);
        if (password && password2) {
            setHasPasswordError(password !== password2);
            if (password !== password2) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
            }
        }
    };

    const onChangeDate = (event, selectedDate) => {
        if (event.type === "dismissed") {
            setShowDatePicker(false);
            return;
        }

        const currentDate = selectedDate || birthDate;

        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        setBirthDate(currentDate);
        setGeneralError(false);

        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const year = currentDate.getFullYear();
        setBirthDateText(`${day}/${month}/${year}`);
    };

    return (
        <KeyboardAwareScrollView
            style={[styles.container, { backgroundColor: colors.bgMain }]}
            contentContainerStyle={styles.scrollContainer}
            enableOnAndroid={true}
            extraScrollHeight={80}
            extraHeight={200}
            keyboardShouldPersistTaps="handled"
        >
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={28} color={colors.textMain} />
            </TouchableOpacity>

            <View style={styles.formContainer}>
                <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>Créer un compte</Text>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Prénom</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.bgSurface, color: colors.textMain, borderColor: colors.borderStrong }]}
                        value={firstName}
                        onChangeText={setFirstName}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Nom</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.bgSurface, color: colors.textMain, borderColor: colors.borderStrong }]}
                        value={lastName}
                        onChangeText={(text) => { setLastName(text); setGeneralError(false); }}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Date de naissance</Text>

                    <TouchableOpacity
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.bgSurface,
                                borderColor: colors.borderStrong,
                                justifyContent: 'center'
                            }
                        ]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={{ color: birthDateText ? colors.textMain : colors.textSecondary, fontSize: 16 }}>
                            {birthDateText || " "}
                        </Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={birthDate}
                            mode="date"
                            display="spinner"
                            maximumDate={new Date()}
                            onChange={onChangeDate}
                        />
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Adresse mail *</Text>
                    <EmailInput
                        email={email}
                        setEmail={setEmail}
                        emailError={emailSyntaxError}
                        setEmailError={setEmailSyntaxError}
                        hasError={generalError}
                        setHasError={setGeneralError}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Mot de passe *</Text>
                    <PasswordInput
                        password={password}
                        setPassword={setPassword}
                        hasError={hasPasswordError || generalError}
                        setHasError={(error) => { setHasPasswordError(error); setGeneralError(error); }}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Confirmation du mot de passe *</Text>
                    <PasswordInput
                        password={password2}
                        setPassword={setPassword2}
                        hasError={hasPasswordError || generalError}
                        setHasError={(error) => { setHasPasswordError(error); setGeneralError(error); }}
                    />
                    {hasPasswordError && <Text style={[styles.errorText, { color: colors.error, marginTop: 5 }]}>Les mots de passe ne correspondent pas.</Text>}
                </View>

                {generalError && (
                    <View style={styles.generalErrorBox}>
                        <Ionicons name="sad-outline" size={20} color={colors.error} />
                        <Text style={[styles.errorText, { color: colors.error, marginLeft: 10, flex: 1 }]}>
                            Une erreur est survenue lors de la création du compte. Veuillez réessayer.
                        </Text>
                    </View>
                )}

                <Button
                    onPress={handleSubmit}
                    isLoading={isLoading}
                    disabled={!isValidated}
                    title="Créer mon compte"
                    iconName={"person-add-outline"}
                />

                <View style={styles.separatorContainer}>
                    <View style={[styles.separatorLine, { backgroundColor: colors.borderLight }]} />
                    <Text style={[styles.separatorText, { color: colors.textSecondary }]}>ou</Text>
                    <View style={[styles.separatorLine, { backgroundColor: colors.borderLight }]} />
                </View>


                <OutlineButton
                    onPress={() => router.push("/login")}
                    title="J'ai déjà un compte"
                    iconName="log-in-outline"
                    isLoading={false}
                    disabled={false}
                />

                <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
                    * Les champs marqués d'une étoile sont obligatoires.
                </Text>

            </View>
        </KeyboardAwareScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 50
    },
    backButton: {
        marginTop: 40,
        marginBottom: 10
    },
    formContainer: {
        width: '100%'
    },
    title: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30
    },
    inputGroup: {
        width: '100%',
        marginBottom: 15,
        flexDirection: 'column',
        alignItems: 'left'
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        marginLeft: 4
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16
    },
    errorText: {
        fontSize: 12,
        marginTop: 5,
        marginLeft: 4
    },
    generalErrorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 15,
        padding: 10,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 0, 0, 0.1)'
    },
    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    separatorLine: {
        flex: 1,
        height: 1,
    },
    separatorText: {
        marginHorizontal: 10,
        fontSize: 14,
    },
    ruleText: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 30,
        fontStyle: 'italic'
    },
});
