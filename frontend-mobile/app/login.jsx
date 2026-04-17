import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Button, OutlineButton } from "../components/ui/Button";
import EmailInput from "../components/ui/EmailInput";
import PasswordInput from "../components/ui/PasswordInput";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { login as apiLogin, getUserProfile } from "../services/apiBack";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const { loginAuth, updateUser } = useAuth();
    const { colors, typography } = useTheme();

    const handleSubmit = async () => {
        if (!email || !password || emailError) return;

        setIsLoading(true);
        try {
            const response_login = await apiLogin(email, password);
            await loginAuth(response_login.access_token);

            const response_user = await getUserProfile(response_login.access_token);
            await updateUser(response_user);

            router.replace("/(tabs)/profile");
        } catch (error) {
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAwareScrollView
            style={[styles.container, { backgroundColor: colors.bgMain }]}
            contentContainerStyle={styles.scrollContainer}
            enableOnAndroid={true}
            extraScrollHeight={20}
            keyboardShouldPersistTaps="handled"
        >

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={28} color={colors.textMain} />
            </TouchableOpacity>

            <View style={styles.formContainer}>
                <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>Connexion</Text>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Adresse mail</Text>
                    <EmailInput email={email} setEmail={setEmail} emailError={emailError} setEmailError={setEmailError} hasError={hasError} setHasError={setHasError} />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Mot de passe</Text>
                    <PasswordInput password={password} setPassword={setPassword} hasError={hasError} setHasError={setHasError} />
                </View>

                {hasError && (
                    <Text style={[styles.errorText, { color: colors.error, textAlign: 'center', marginBottom: 15 }]}>
                        Adresse mail ou mot de passe incorrect.{"\n"}Veuillez réessayer.
                    </Text>
                )}

                <Button
                    onPress={handleSubmit}
                    isLoading={isLoading}
                    disabled={!email || emailError || !password || hasError}
                    title="Se connecter"
                    iconName={"log-in-outline"}
                />

                <View style={styles.separatorContainer}>
                    <View style={[styles.separatorLine, { backgroundColor: colors.borderLight }]} />
                    <Text style={[styles.separatorText, { color: colors.textSecondary }]}>ou</Text>
                    <View style={[styles.separatorLine, { backgroundColor: colors.borderLight }]} />
                </View>

                <OutlineButton
                    onPress={() => router.push("/signin")}
                    title="Créer un compte"
                    iconName="person-add-outline"
                />
            </View>
        </KeyboardAwareScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    },
    formContainer: {
        marginTop: 40,
        width: '100%',
    },
    title: {
        textAlign: 'center',
        marginBottom: 40,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        marginLeft: 4,
    },
    errorText: {
        fontSize: 12,
        marginTop: 5,
        marginLeft: 4,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 12,
        marginTop: 10,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
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
    outlineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 12,
        borderWidth: 2,
    },
    outlineButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    }
});
