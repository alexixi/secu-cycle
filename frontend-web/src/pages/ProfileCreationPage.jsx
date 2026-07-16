import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { IoArrowBack } from "react-icons/io5";

import Meta from "../components/Meta";
import OnboardingProgress from "../components/onboarding/OnboardingProgress";
import StepCredentials, { MIN_PASSWORD_LENGTH } from "../components/onboarding/StepCredentials";
import StepVerifyEmail from "../components/onboarding/StepVerifyEmail";
import StepName from "../components/onboarding/StepName";
import StepBirthDate from "../components/onboarding/StepBirthDate";
import StepSportLevel from "../components/onboarding/StepSportLevel";
import StepAddresses from "../components/onboarding/StepAddresses";
import StepBikes from "../components/onboarding/StepBikes";
import { useAuth } from "../context/AuthContext";
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
import "../components/ui/Input.css";
import "../components/ui/Form.css";
import "../components/onboarding/Onboarding.css";

const TOTAL_STEPS = 7;
const RESEND_COOLDOWN_SECONDS = 60;

export default function ProfileCreationPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginAuth, updateUser, updateBikes, updateHistoric } = useAuth();

    const startAtVerify = location.state?.verify === true;
    const initialEmail = typeof location.state?.email === "string" ? location.state.email : "";
    const initialPassword = typeof location.state?.password === "string" ? location.state.password : "";

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
    const [birthDate, setBirthDate] = useState("");
    const [level, setLevel] = useState("");
    const [home, setHome] = useState("");
    const [work, setWork] = useState("");
    const [addedBikes, setAddedBikes] = useState([]);

    const [isLoading, setIsLoading] = useState(false);

    const goNext = () => setStep((s) => s + 1);

    const handleBack = () => {
        if (step === 0) {
            navigate(-1);
            return;
        }
        if (step === 1) {
            setStep(0);
            return;
        }
        setStep((s) => Math.max(2, s - 1));
    };

    const triggerConfetti = () => {
        const end = performance.now() + 1000;
        const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
        const frame = () => {
            if (performance.now() > end) return;
            confetti({ particleCount: 3, angle: 60, spread: 55, startVelocity: 80, origin: { x: 0, y: 0.8 }, colors });
            confetti({ particleCount: 2, angle: 120, spread: 55, startVelocity: 80, origin: { x: 1, y: 0.8 }, colors });
            requestAnimationFrame(frame);
        };
        frame();
    };

    const loadExistingSession = async (res) => {
        loginAuth(res.access_token, res.refresh_token);
        trackEvent("logged_in");

        const profile = await getUserProfile(res.access_token);
        updateUser(profile);

        const [bikesRes, historicRes] = await Promise.all([
            getUserBikes(res.access_token),
            getUserHistoric(res.access_token),
        ]);
        updateBikes(bikesRes);
        updateHistoric(historicRes);

        navigate("/profil");
    };

    const handleRegister = async () => {
        if (registeredEmail && registeredEmail === email) {
            setGeneralError(null);
            setStep(1);
            return;
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            return;
        }
        if (password !== password2) {
            setPasswordMismatch(true);
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
            trackEvent("signup_failed", { reason: error?.status === 409 ? "email_exists" : "error" });
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
                    setGeneralError("Cette adresse e-mail est déjà utilisée et le mot de passe ne correspond pas.");
                    return;
                }
            }
            setGeneralError("Une erreur est survenue lors de la création du compte. Veuillez réessayer.");
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
        } catch {
            setVerifyError("Code invalide ou expiré.");
            setIsLoading(false);
            return;
        }

        try {
            const res = await apiLogin(email, password);
            loginAuth(res.access_token, res.refresh_token);
            setAccessToken(res.access_token);
            trackEvent("logged_in");

            const profile = await getUserProfile(res.access_token);
            updateUser(profile);

            setStep(2);
        } catch {
            navigate("/login");
        } finally {
            setIsLoading(false);
        }
    };

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
            setResendMessage("Si un compte non vérifié existe, un nouveau code a été envoyé.");
            startResendCooldown();
        } catch (error) {
            if (error?.status === 429) {
                setResendMessage("Trop de tentatives. Veuillez réessayer plus tard.");
                startResendCooldown();
            } else {
                setResendMessage("Impossible d'envoyer le code pour le moment.");
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
        } catch {
            goNext();
        } finally {
            setIsLoading(false);
        }
    };

    const saveName = () =>
        runSave(async () => {
            if (!firstName.trim() && !lastName.trim()) return;
            const updated = await changeProfileInfo(accessToken, firstName.trim(), lastName.trim());
            updateUser(updated);
        });

    const saveBirthDate = () =>
        runSave(async () => {
            if (!birthDate) return;
            const updated = await changeProfileInfo(accessToken, undefined, undefined, undefined, birthDate);
            updateUser(updated);
        });

    const saveSportLevel = () =>
        runSave(async () => {
            if (!level) return;
            const updated = await changeProfileInfo(accessToken, undefined, undefined, undefined, undefined, level);
            updateUser(updated);
        });

    const saveAddresses = () =>
        runSave(async () => {
            const updated = await changeAddress(accessToken, home, work);
            updateUser(updated);
        });

    const handleAddBike = async ({ name, type, isElectric }) => {
        const bike = await addBike(accessToken, name, type, isElectric);
        const newList = [...addedBikes, bike];
        setAddedBikes(newList);
        updateBikes(newList);
        trackEvent("bike_added");
    };

    const handleFinish = () => {
        triggerConfetti();
        navigate("/profil");
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
        <>
            <Meta title="Créer un compte | Sécu'Cycle" description="Rejoignez la communauté Sécu'Cycle et roulez en toute sécurité." noindex />
            <div className="page-form-container">
                <div className="form-container">
                    <div className="onboarding-header">
                        <button type="button" className="onboarding-back" onClick={handleBack} aria-label="Retour">
                            <IoArrowBack size={24} />
                        </button>
                        <OnboardingProgress current={step} total={TOTAL_STEPS} />
                    </div>
                    {renderStep()}
                </div>
            </div>
        </>
    );
}
