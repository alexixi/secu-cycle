import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Haptics from "expo-haptics";

import OnboardingProgress from "../components/onboarding/OnboardingProgress";
import StepCredentials, { MIN_PASSWORD_LENGTH } from "../components/onboarding/StepCredentials";
import StepVerifyEmail from "../components/onboarding/StepVerifyEmail";
import StepName from "../components/onboarding/StepName";
import StepBirthDate from "../components/onboarding/StepBirthDate";
import StepSportLevel from "../components/onboarding/StepSportLevel";
import StepAddresses from "../components/onboarding/StepAddresses";
import StepBikes from "../components/onboarding/StepBikes";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { SwipeBackScreen } from "../components/SwipeBackScreen";
import {
    addBike,
    changeAddress,
    changeProfileInfo,
    getUserBikes,
    getUserHistoric,
    getUserProfile,
    login as apiLogin,
    register,
    resendVerification,
    verifyEmail,
} from "../services/apiBack";
import { trackEvent } from "../services/analytics";
import { useTranslation } from "react-i18next";

const TOTAL_STEPS = 7;

export default function OnboardingScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { loginAuth, updateUser, updateBikes, updateHistoric } = useAuth();

    const params = useLocalSearchParams();
    const startAtVerify = params?.verify === "1";
    const initialEmail = typeof params?.email === "string" ? params.email : "";
    const initialPassword = typeof params?.password === "string" ? params.password : "";

    const [step, setStep] = useState(startAtVerify ? 1 : 0);

    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState(initialPassword);
    const [password2, setPassword2] = useState(initialPassword);
    const [emailSyntaxError, setEmailSyntaxError] = useState(false);
    const [passwordMismatch, setPasswordMismatch] = useState(false);
    const [generalError, setGeneralError] = useState(null);
    const [registeredEmail, setRegisteredEmail] = useState(startAtVerify ? initialEmail : null);

    const [code, setCode] = useState("");
    const [verifyError, setVerifyError] = useState(null);
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState(null);
    const [resendCooldown, setResendCooldown] = useState(0);

    const [accessToken, setAccessToken] = useState(null);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [birthDate, setBirthDate] = useState(new Date(2000, 0, 1));
    const [birthDateHasValue, setBirthDateHasValue] = useState(false);
    const [level, setLevel] = useState("");
    const [home, setHome] = useState("");
    const [work, setWork] = useState("");
    const [addedBikes, setAddedBikes] = useState([]);

    const [isLoading, setIsLoading] = useState(false);

    const errorHaptic = () =>
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });

    const goNext = () => setStep((s) => s + 1);

    const handleBack = () => {
        if (step === 0) {
            router.back();
            return;
        }
        if (step === 1) {
            setStep(0);
            return;
        }
        setStep((s) => Math.max(2, s - 1));
    };

    const loadExistingSession = async (res) => {
        await loginAuth(res.access_token, res.refresh_token);
        trackEvent("logged_in");

        const profile = await getUserProfile(res.access_token);
        await updateUser(profile);

        const [bikesRes, historicRes] = await Promise.all([
            getUserBikes(res.access_token),
            getUserHistoric(res.access_token),
        ]);
        await updateBikes(bikesRes);
        await updateHistoric(historicRes);

        router.replace("/(tabs)/profile");
    };

    const handleRegister = async () => {
        if (registeredEmail && registeredEmail === email) {
            setGeneralError(null);
            setStep(1);
            return;
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            errorHaptic();
            return;
        }
        if (password !== password2) {
            setPasswordMismatch(true);
            errorHaptic();
            return;
        }

        setIsLoading(true);
        setGeneralError(null);
        try {
            await register(null, null, null, email, password);
            setRegisteredEmail(email);
            trackEvent("account_created");
            setStep(1);
            startResendCooldown();
        } catch (error) {
            if (error?.status === 409) {
                try {
                    const res = await apiLogin(email, password);
                    await loadExistingSession(res);
                    return;
                } catch (loginError) {
                    if (loginError?.status === 403) {
                        setRegisteredEmail(email);
                        setStep(1);
                        handleResend();
                        return;
                    }
                    errorHaptic();
                    setGeneralError(t('auth.creationCompte.emailDejaUtilise'));
                    return;
                }
            }
            errorHaptic();
            setGeneralError(t('auth.creationCompte.erreurCreation'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async () => {
        setVerifyError(null);
        setResendMessage(null);
        setIsLoading(true);

        try {
            await verifyEmail(email, code);
        } catch (_error) {
            errorHaptic();
            setVerifyError(t('auth.creationCompte.codeInvalide'));
            setIsLoading(false);
            return;
        }

        try {
            const res = await apiLogin(email, password);
            await loginAuth(res.access_token, res.refresh_token);
            setAccessToken(res.access_token);
            trackEvent("logged_in");

            const profile = await getUserProfile(res.access_token);
            await updateUser(profile);

            setStep(2);
        } catch (_error) {
            router.replace("/login");
        } finally {
            setIsLoading(false);
        }
    };

    const RESEND_COOLDOWN_SECONDS = 60;
    const startResendCooldown = () => setResendCooldown(RESEND_COOLDOWN_SECONDS);

    const isCoolingDown = resendCooldown > 0;
    useEffect(() => {
        if (!isCoolingDown) return undefined;
        const id = setInterval(() => {
            setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
        }, 1000);
        return () => clearInterval(id);
    }, [isCoolingDown]);

    const handleResend = async () => {
        if (resendCooldown > 0 || isResending) return;
        setResendMessage(null);
        setVerifyError(null);
        setIsResending(true);
        try {
            await resendVerification(email);
            setResendMessage(t('auth.creationCompte.codeRenvoye'));
            startResendCooldown();
        } catch (error) {
            if (error?.status === 429) {
                setResendMessage(t('auth.creationCompte.tropDeTentatives'));
                startResendCooldown();
            } else {
                setResendMessage(t('auth.creationCompte.envoiImpossible'));
            }
        } finally {
            setIsResending(false);
        }
    };

    const didAutoResend = useRef(false);
    useEffect(() => {
        if (startAtVerify && email && !didAutoResend.current) {
            didAutoResend.current = true;
            handleResend();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const runSave = async (saveFn) => {
        setIsLoading(true);
        try {
            await saveFn();
            goNext();
        } catch (_error) {
            errorHaptic();
            setGeneralError(null);
            goNext();
        } finally {
            setIsLoading(false);
        }
    };

    const saveName = () =>
        runSave(async () => {
            if (!firstName.trim() && !lastName.trim()) return;
            const updated = await changeProfileInfo(accessToken, firstName.trim(), lastName.trim());
            await updateUser(updated);
        });

    const saveBirthDate = () =>
        runSave(async () => {
            const dateStr = birthDate.toISOString().split("T")[0];
            const updated = await changeProfileInfo(accessToken, undefined, undefined, undefined, dateStr);
            await updateUser(updated);
        });

    const saveSportLevel = () =>
        runSave(async () => {
            const updated = await changeProfileInfo(accessToken, undefined, undefined, undefined, undefined, level);
            await updateUser(updated);
        });

    const saveAddresses = () =>
        runSave(async () => {
            const updated = await changeAddress(accessToken, home, work);
            await updateUser(updated);
        });

    const handleAddBike = async ({ name, type, isElectric }) => {
        const bike = await addBike(accessToken, name, type, isElectric);
        const newList = [...addedBikes, bike];
        setAddedBikes(newList);
        await updateBikes(newList);
    };

    const handleFinish = () => {
        router.replace("/(tabs)/profile");
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <StepCredentials
                        email={email}
                        setEmail={setEmail}
                        password={password}
                        setPassword={setPassword}
                        password2={password2}
                        setPassword2={setPassword2}
                        emailSyntaxError={emailSyntaxError}
                        setEmailSyntaxError={setEmailSyntaxError}
                        passwordMismatch={passwordMismatch}
                        setPasswordMismatch={setPasswordMismatch}
                        generalError={generalError}
                        onSubmit={handleRegister}
                        onGoLogin={() => router.push("/login")}
                        isLoading={isLoading}
                    />
                );
            case 1:
                return (
                    <StepVerifyEmail
                        email={email}
                        code={code}
                        setCode={setCode}
                        onSubmit={handleVerify}
                        onResend={handleResend}
                        onEditEmail={() => setStep(0)}
                        error={verifyError}
                        isLoading={isLoading}
                        isResending={isResending}
                        resendMessage={resendMessage}
                        cooldown={resendCooldown}
                    />
                );
            case 2:
                return (
                    <StepName
                        firstName={firstName}
                        setFirstName={setFirstName}
                        lastName={lastName}
                        setLastName={setLastName}
                        onNext={saveName}
                        onSkip={goNext}
                        isLoading={isLoading}
                    />
                );
            case 3:
                return (
                    <StepBirthDate
                        birthDate={birthDate}
                        setBirthDate={setBirthDate}
                        hasValue={birthDateHasValue}
                        setHasValue={setBirthDateHasValue}
                        onNext={saveBirthDate}
                        onSkip={goNext}
                        isLoading={isLoading}
                    />
                );
            case 4:
                return (
                    <StepSportLevel
                        level={level}
                        setLevel={setLevel}
                        onNext={saveSportLevel}
                        onSkip={goNext}
                        isLoading={isLoading}
                    />
                );
            case 5:
                return (
                    <StepAddresses
                        home={home}
                        setHome={setHome}
                        work={work}
                        setWork={setWork}
                        onNext={saveAddresses}
                        onSkip={goNext}
                        isLoading={isLoading}
                    />
                );
            case 6:
                return (
                    <StepBikes
                        addedBikes={addedBikes}
                        onAddBike={handleAddBike}
                        onFinish={handleFinish}
                        isFinishing={isLoading}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <SwipeBackScreen background={colors.bgMain}>
        <KeyboardAwareScrollView
            style={[styles.container, { backgroundColor: colors.bgMain }]}
            contentContainerStyle={styles.scrollContainer}
            enableOnAndroid={true}
            extraScrollHeight={80}
            extraHeight={200}
            keyboardShouldPersistTaps="handled"
        >
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={28} color={colors.textMain} />
            </TouchableOpacity>

            <OnboardingProgress current={step} total={TOTAL_STEPS} />

            {renderStep()}
        </KeyboardAwareScrollView>
        </SwipeBackScreen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContainer: { flexGrow: 1, padding: 20, paddingBottom: 50 },
    backButton: { marginTop: 40, marginBottom: 16 },
});
