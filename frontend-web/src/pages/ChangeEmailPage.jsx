import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { LuMail, LuCheck } from "react-icons/lu";

import Meta from "../components/Meta";
import Button from "../components/ui/Button";
import CodeInput, { CODE_LENGTH } from "../components/ui/CodeInput";
import PasswordInput from "../components/ui/PasswordInput";
import { useAuth } from "../context/AuthContext";
import { confirmEmailChange, requestEmailChange } from "../services/apiBack";
import "../components/ui/Input.css";
import "../components/ui/Form.css";
import { useLocalizedPath } from '../i18n/useLang';

const RESEND_COOLDOWN_SECONDS = 60;

function mapRequestError(error) {
    if (error?.status === 401) return "Mot de passe incorrect.";
    if (error?.status === 409) return "Cette adresse mail est déjà utilisée par un autre compte.";
    if (error?.status === 429) return "Trop de demandes de changement. Réessayez plus tard.";
    if (error?.status === 422) return "Adresse mail invalide.";
    if (!error?.status) return "Connexion impossible. Vérifiez votre connexion internet.";
    return "Une erreur est survenue lors de l'envoi du code.";
}

function mapConfirmError(error) {
    if (error?.status === 400) return "Code invalide ou expiré.";
    if (error?.status === 409) return "Cette adresse vient d'être utilisée par un autre compte. Essayez-en une autre.";
    if (error?.status === 429) return "Trop de tentatives. Veuillez réessayer plus tard.";
    if (!error?.status) return "Connexion impossible. Vérifiez votre connexion internet.";
    return "Une erreur est survenue lors de la confirmation.";
}

export default function ChangeEmailPage() {
    const path = useLocalizedPath();
    const navigate = useNavigate();
    const { user, token, updateUser, loginAuth } = useAuth();

    const currentEmail = user?.email || "";

    const [step, setStep] = useState(0);

    const [newEmail, setNewEmail] = useState("");
    const [emailError, setEmailError] = useState(false);
    const [password, setPassword] = useState("");

    const [code, setCode] = useState("");
    const [error, setError] = useState("");

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

    const isSameAsCurrent =
        newEmail.trim().toLowerCase() === currentEmail.trim().toLowerCase();

    const handleRequest = async (e) => {
        if (e) e.preventDefault();
        if (!newEmail || emailError || !password || isSameAsCurrent) return;

        setError("");
        setResendMessage("");
        setIsLoading(true);
        try {
            await requestEmailChange(token, newEmail.trim(), password);
            setCode("");
            startResendCooldown();
            setStep(1);
        } catch (err) {
            setError(mapRequestError(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || isResending) return;
        setResendMessage("");
        setError("");
        setIsResending(true);
        try {
            await requestEmailChange(token, newEmail.trim(), password);
            setResendMessage("Un nouveau code a été envoyé.");
            startResendCooldown();
        } catch (err) {
            if (err?.status === 429) {
                setResendMessage("Trop de demandes. Veuillez réessayer plus tard.");
                startResendCooldown();
            } else {
                setResendMessage("Impossible d'envoyer le code pour le moment.");
            }
        } finally {
            setIsResending(false);
        }
    };

    const handleConfirm = async (e) => {
        if (e) e.preventDefault();
        setError("");
        setResendMessage("");
        setIsLoading(true);
        try {
            const result = await confirmEmailChange(token, code);

            if (result?.access_token) {
                loginAuth(result.access_token, result.refresh_token);
            }
            if (result?.user) {
                updateUser({ ...user, ...result.user });
            }

            navigate(path("profil"), {
                state: { message: "Votre adresse mail a bien été modifiée." },
            });
        } catch (err) {
            setError(mapConfirmError(err));
        } finally {
            setIsLoading(false);
        }
    };

    const backToEmailStep = () => {
        setStep(0);
        setCode("");
        setError("");
        setResendMessage("");
    };

    const resendDisabled = isResending || resendCooldown > 0;
    const resendLabel = isResending
        ? "Envoi…"
        : resendCooldown > 0
            ? `Renvoyer le code (${resendCooldown}s)`
            : "Renvoyer le code";

    return (
        <>
            <Meta title="Modifier mon adresse mail | Sécu'Cycle" description="Modifiez l'adresse mail de votre compte Sécu'Cycle." noindex />
            <div className="page-form-container">
                <div className="form-container">
                    {step === 0 ? (
                        <form className="form" onSubmit={handleRequest}>
                            <h2>Modifier mon adresse mail</h2>
                            <p className="separator" style={{ margin: "0 0 1.5rem" }}>
                                Nous enverrons un code à {CODE_LENGTH} chiffres à votre nouvelle
                                adresse pour vérifier qu&apos;elle vous appartient.
                            </p>

                            <div className="input-container">
                                <div className="input-group">
                                    <label htmlFor="current-email">Adresse actuelle</label>
                                    <input
                                        className="input"
                                        type="email"
                                        id="current-email"
                                        value={currentEmail}
                                        autoComplete="username"
                                        disabled
                                        readOnly
                                    />
                                </div>

                                <div className={"input-group" + (emailError ? " input-error" : "")}>
                                    <label htmlFor="new-email">Nouvelle adresse mail</label>
                                    <input
                                        className="input"
                                        type="email"
                                        id="new-email"
                                        value={newEmail}
                                        onChange={(e) => {
                                            setNewEmail(e.target.value);
                                            setEmailError(false);
                                            setError("");
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
                                        autoComplete="email"
                                        required
                                    />
                                    {emailError && (
                                        <div className="error-text">Adresse mail invalide.</div>
                                    )}
                                    {isSameAsCurrent && newEmail.length > 0 && (
                                        <div className="error-text">C&apos;est déjà votre adresse actuelle.</div>
                                    )}
                                </div>

                                <div className="input-group">
                                    <label htmlFor="password">Votre mot de passe</label>
                                    <PasswordInput
                                        name="password"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setError("");
                                        }}
                                    />
                                    <div className="rule" style={{ marginTop: "0.5rem" }}>
                                        Demandé pour confirmer que c&apos;est bien vous.
                                    </div>
                                </div>

                                {error && <div className="error-text">{error}</div>}
                            </div>

                            <Button
                                type="submit"
                                disabled={!newEmail || emailError || isSameAsCurrent || !password || isLoading}
                            >
                                {isLoading ? "Envoi…" : <>Envoyer le code <LuMail /></>}
                            </Button>

                            <Link to={path("profil")} className="forgot-password-link" style={{ textAlign: "center" }}>
                                Retour au profil
                            </Link>
                        </form>
                    ) : (
                        <form className="form" onSubmit={handleConfirm}>
                            <h2>Confirmation</h2>
                            <p className="separator" style={{ margin: "0 0 1rem" }}>
                                Nous avons envoyé un code à {CODE_LENGTH} chiffres à<br />
                                <strong>{newEmail.trim()}</strong>.
                            </p>
                            <p className="separator" style={{ margin: "0 0 1.5rem" }}>
                                Une alerte a également été envoyée à votre adresse actuelle. Le
                                changement ne prendra effet qu&apos;après validation du code.
                            </p>

                            <div className="input-container">
                                <div className={"input-group" + (error ? " input-error" : "")}>
                                    <label htmlFor="code">Code de confirmation</label>
                                    <CodeInput
                                        value={code}
                                        onChange={(v) => { setCode(v); setError(""); }}
                                        autoFocus
                                    />
                                </div>

                                {error && <div className="error-text">{error}</div>}
                            </div>

                            <Button type="submit" disabled={code.length < CODE_LENGTH || isLoading}>
                                {isLoading ? "Confirmation…" : <>Confirmer le changement <LuCheck /></>}
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

                            <button
                                type="button"
                                className="forgot-password-link"
                                style={{ textAlign: "center", background: "none", border: "none", cursor: "pointer" }}
                                onClick={backToEmailStep}
                            >
                                Utiliser une autre adresse
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
