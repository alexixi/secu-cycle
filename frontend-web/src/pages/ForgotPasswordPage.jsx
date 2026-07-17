import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { LuKeyRound } from "react-icons/lu";

import Meta from "../components/Meta";
import Button from "../components/ui/Button";
import PasswordInput from "../components/ui/PasswordInput";
import { forgotPassword, resetPassword } from "../services/apiBack";
import "../components/ui/Input.css";
import "../components/ui/Form.css";

const CODE_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 10;
const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
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
            setResendMessage("Si un compte existe, un nouveau code a été envoyé.");
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

    const handleReset = async (e) => {
        if (e) e.preventDefault();
        setResetError("");
        setResendMessage("");
        if (password !== password2) {
            setResetError("Les mots de passe ne correspondent pas.");
            return;
        }
        setIsLoading(true);
        try {
            await resetPassword(email, code, password);
            navigate("/login", {
                state: { message: "Mot de passe réinitialisé. Vous pouvez vous connecter." },
            });
        } catch (error) {
            if (error?.status === 429) {
                setResetError("Trop de tentatives. Veuillez réessayer plus tard.");
            } else {
                setResetError("Code invalide ou expiré.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCodeChange = (e) => {
        setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH));
        setResetError("");
    };

    const resendDisabled = isResending || resendCooldown > 0;
    const resendLabel = isResending
        ? "Envoi…"
        : resendCooldown > 0
            ? `Renvoyer le code (${resendCooldown}s)`
            : "Renvoyer le code";

    return (
        <>
            <Meta title="Mot de passe oublié | Sécu'Cycle" description="Réinitialisez le mot de passe de votre compte Sécu'Cycle." noindex />
            <div className="page-form-container">
                <div className="form-container">
                    {step === 0 ? (
                        <form className="form" onSubmit={handleRequest}>
                            <h2>Mot de passe oublié</h2>
                            <p className="separator" style={{ margin: "0 0 1.5rem" }}>
                                Saisissez votre adresse mail : nous vous enverrons un code
                                pour réinitialiser votre mot de passe.
                            </p>

                            <div className="input-container">
                                <div className={"input-group" + (emailError ? " input-error" : "")}>
                                    <label htmlFor="email">Adresse mail</label>
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
                                        placeholder="exemple@gmail.com"
                                        autoComplete="username"
                                        required
                                    />
                                    {emailError && (
                                        <div className="error-text">Adresse mail invalide.</div>
                                    )}
                                </div>
                            </div>

                            <Button type="submit" disabled={!email || emailError || isLoading}>
                                {isLoading ? "Envoi…" : <>Envoyer le code <LuKeyRound /></>}
                            </Button>

                            <Link to="/login" className="forgot-password-link" style={{ textAlign: "center" }}>
                                Retour à la connexion
                            </Link>
                        </form>
                    ) : (
                        <form className="form" onSubmit={handleReset}>
                            <h2>Réinitialisation</h2>
                            <p className="separator" style={{ margin: "0 0 1.5rem" }}>
                                Nous avons envoyé un code à {CODE_LENGTH} chiffres à<br />
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
                                    <label htmlFor="code">Code de réinitialisation</label>
                                    <input
                                        className="input"
                                        type="text"
                                        inputMode="numeric"
                                        id="code"
                                        name="code"
                                        value={code}
                                        onChange={handleCodeChange}
                                        placeholder="––––––"
                                        maxLength={CODE_LENGTH}
                                        autoComplete="one-time-code"
                                        required
                                    />
                                </div>

                                <div className={"input-group" + (resetError ? " input-error" : "")}>
                                    <label htmlFor="password">Nouveau mot de passe</label>
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
                                        Au moins {MIN_PASSWORD_LENGTH} caractères.
                                    </div>
                                </div>

                                <div className={"input-group" + (resetError ? " input-error" : "")}>
                                    <label htmlFor="password2">Confirmer le mot de passe</label>
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
                                {isLoading ? "Réinitialisation…" : <>Réinitialiser <LuKeyRound /></>}
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
