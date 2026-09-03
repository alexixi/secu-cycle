import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { LuKeyRound } from "react-icons/lu";

import { useTranslation } from "react-i18next";
import Meta from "../components/Meta";
import Button from "../components/ui/Button";
import CodeInput, { CODE_LENGTH } from "../components/ui/CodeInput";
import PasswordInput from "../components/ui/PasswordInput";
import { forgotPassword, resetPassword } from "../services/apiBack";
import "../components/ui/Input.css";
import "../components/ui/Form.css";
import { useLocalizedPath } from '../i18n/useLang';
const MIN_PASSWORD_LENGTH = 10;
const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
    const { t } = useTranslation('auth');
    const path = useLocalizedPath();
    const navigate = useNavigate();
    const location = useLocation();

    const initialEmail = typeof location.state?.email === "string" ? location.state.email : "";

    const [step, setStep] = useState(0);
    const [email, setEmail] = useState(initialEmail);
    const [emailError, setEmailError] = useState(false);

    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [resetError, setResetError] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);

    const startResendCooldown = () => setResendCooldown(RESEND_COOLDOWN_SECONDS);

    const isCoolingDown = resendCooldown > 0;
    useEffect(() => {
        if (!isCoolingDown) return undefined;
        const id = setInterval(() => {
            setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
        }, 1000);
        return () => clearInterval(id);
    }, [isCoolingDown]);

    const handleRequest = async (e) => {
        if (e) e.preventDefault();
        if (!email || emailError) return;
        setIsLoading(true);
        try {
            await forgotPassword(email);
        } catch {
        } finally {
            setIsLoading(false);
        }
        startResendCooldown();
        setStep(1);
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || isResending) return;
        setResendMessage("");
        setResetError("");
        setIsResending(true);
        try {
            await forgotPassword(email);
            setResendMessage(t('motDePasseOublie.codeRenvoye'));
            startResendCooldown();
        } catch (error) {
            if (error?.status === 429) {
                setResendMessage(t('motDePasseOublie.tropDeTentatives'));
                startResendCooldown();
            } else {
                setResendMessage(t('motDePasseOublie.envoiImpossible'));
            }
        } finally {
            setIsResending(false);
        }
    };

    const handleReset = async (e) => {
        if (e) e.preventDefault();
        setResetError("");
        setResendMessage("");
        if (password !== password2) {
            setResetError(t('motDePasseOublie.motsDePasseDifferents'));
            return;
        }
        setIsLoading(true);
        try {
            await resetPassword(email, code, password);
            navigate(path("login"), {
                state: { message: t('motDePasseOublie.succes') },
            });
        } catch (error) {
            if (error?.status === 429) {
                setResetError(t('motDePasseOublie.tropDeTentatives'));
            } else {
                setResetError(t('motDePasseOublie.codeInvalide'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const resendDisabled = isResending || resendCooldown > 0;
    const resendLabel = isResending
        ? t('motDePasseOublie.envoi')
        : resendCooldown > 0
            ? t('motDePasseOublie.renvoyerCodeDelai', { secondes: resendCooldown })
            : t('motDePasseOublie.renvoyerCode');

    return (
        <>
            <Meta title={t('motDePasseOublie.titrePage')} description={t('motDePasseOublie.metaDescription')} noindex />
            <div className="page-form-container">
                <div className="form-container">
                    {step === 0 ? (
                        <form className="form" onSubmit={handleRequest}>
                            <h2>{t('motDePasseOublie.h2')}</h2>
                            <p className="separator" style={{ margin: "0 0 1.5rem" }}>
                                {t('motDePasseOublie.intro')}
                            </p>

                            <div className="input-container">
                                <div className={"input-group" + (emailError ? " input-error" : "")}>
                                    <label htmlFor="email">{t('champs.email')}</label>
                                    <input
                                        className="input"
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setEmailError(false);
                                        }}
                                        onBlur={(e) => {
                                            if (!e.target.value) {
                                                setEmailError(false);
                                            } else if (!e.target.value.includes("@") || !e.target.value.includes(".")) {
                                                setEmailError(true);
                                            } else {
                                                setEmailError(false);
                                            }
                                        }}
                                        placeholder={t('champs.emailPlaceholder')}
                                        autoComplete="username"
                                        required
                                    />
                                    {emailError && (
                                        <div className="error-text">{t('erreurs.emailInvalide')}</div>
                                    )}
                                </div>
                            </div>

                            <Button type="submit" disabled={!email || emailError || isLoading}>
                                {isLoading ? t('motDePasseOublie.envoi') : <>{t('motDePasseOublie.envoyerCode')} <LuKeyRound /></>}
                            </Button>

                            <Link to={path("login")} className="forgot-password-link" style={{ textAlign: "center" }}>
                                {t('motDePasseOublie.retourConnexion')}
                            </Link>
                        </form>
                    ) : (
                        <form className="form" onSubmit={handleReset}>
                            <h2>{t('motDePasseOublie.h2Reset')}</h2>
                            <p className="separator" style={{ margin: "0 0 1.5rem" }}>
                                {t('motDePasseOublie.codeEnvoye', { longueur: CODE_LENGTH })}<br />
                                <strong>{email}</strong>.
                            </p>

                            <input
                                type="email"
                                name="username"
                                value={email}
                                autoComplete="username"
                                readOnly
                                aria-hidden="true"
                                tabIndex={-1}
                                style={{ display: "none" }}
                            />

                            <div className="input-container">
                                <div className={"input-group" + (resetError ? " input-error" : "")}>
                                    <label htmlFor="code">{t('motDePasseOublie.labelCode')}</label>
                                    <CodeInput
                                        value={code}
                                        onChange={(v) => { setCode(v); setResetError(""); }}
                                    />
                                </div>

                                <div className={"input-group" + (resetError ? " input-error" : "")}>
                                    <label htmlFor="password">{t('motDePasseOublie.nouveauMotDePasse')}</label>
                                    <PasswordInput
                                        name="password"
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setResetError("");
                                        }}
                                    />
                                    <div className="rule" style={{ marginTop: "0.5rem" }}>
                                        {t('champs.regleMotDePasse', { min: MIN_PASSWORD_LENGTH })}
                                    </div>
                                </div>

                                <div className={"input-group" + (resetError ? " input-error" : "")}>
                                    <label htmlFor="password2">{t('motDePasseOublie.confirmerMotDePasse')}</label>
                                    <PasswordInput
                                        name="password2"
                                        autoComplete="new-password"
                                        value={password2}
                                        onChange={(e) => {
                                            setPassword2(e.target.value);
                                            setResetError("");
                                        }}
                                    />
                                </div>

                                {resetError && <div className="error-text">{resetError}</div>}
                            </div>

                            <Button
                                type="submit"
                                disabled={code.length < CODE_LENGTH || password.length < MIN_PASSWORD_LENGTH || password !== password2 || isLoading}
                            >
                                {isLoading ? t('motDePasseOublie.reinitialisation') : <>{t('motDePasseOublie.reinitialiser')} <LuKeyRound /></>}
                            </Button>

                            <button
                                type="button"
                                className="forgot-password-link"
                                style={{ textAlign: "center", background: "none", border: "none", cursor: resendDisabled ? "default" : "pointer" }}
                                onClick={handleResend}
                                disabled={resendDisabled}
                            >
                                {resendLabel}
                            </button>

                            {resendMessage && (
                                <p className="separator" style={{ marginTop: "0.5rem" }}>{resendMessage}</p>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
