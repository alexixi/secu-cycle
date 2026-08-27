import { useTranslation } from "react-i18next";
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

function mapRequestError(error, t) {
    const cle = { 401: "motDePasseIncorrect", 409: "emailPris", 429: "tropDeDemandes", 422: "emailInvalide" }[error?.status]
        ?? (error?.status ? "generique" : "horsLigne");
    return t(`changementEmail.erreursDemande.${cle}`);
}

function mapConfirmError(error, t) {
    const cle = { 400: "codeInvalide", 409: "emailPris", 429: "tropDeTentatives" }[error?.status]
        ?? (error?.status ? "generique" : "horsLigne");
    return t(`changementEmail.erreursConfirmation.${cle}`);
}

export default function ChangeEmailPage() {
    const { t } = useTranslation('auth');
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
            setError(mapRequestError(err, t));
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
            setResendMessage(t('changementEmail.codeRenvoye'));
            startResendCooldown();
        } catch (err) {
            if (err?.status === 429) {
                setResendMessage(t('changementEmail.tropDeDemandes'));
                startResendCooldown();
            } else {
                setResendMessage(t('changementEmail.envoiImpossible'));
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
                state: { message: t('changementEmail.succes') },
            });
        } catch (err) {
            setError(mapConfirmError(err, t));
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
        ? t('changementEmail.envoi')
        : resendCooldown > 0
            ? t('changementEmail.renvoyerCodeDelai', { secondes: resendCooldown })
            : t('changementEmail.renvoyerCode');

    return (
        <>
            <Meta title={t('changementEmail.titrePage')} description={t('changementEmail.metaDescription')} noindex />
            <div className="page-form-container">
                <div className="form-container">
                    {step === 0 ? (
                        <form className="form" onSubmit={handleRequest}>
                            <h2>{t('changementEmail.h2')}</h2>
                            <p className="separator" style={{ margin: "0 0 1.5rem" }}>
                                {t('changementEmail.intro', { longueur: CODE_LENGTH })}
                            </p>

                            <div className="input-container">
                                <div className="input-group">
                                    <label htmlFor="current-email">{t('changementEmail.adresseActuelle')}</label>
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
                                    <label htmlFor="new-email">{t('changementEmail.nouvelleAdresse')}</label>
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
                                        placeholder={t('champs.emailPlaceholder')}
                                        autoComplete="email"
                                        required
                                    />
                                    {emailError && (
                                        <div className="error-text">Adresse mail invalide.</div>
                                    )}
                                    {isSameAsCurrent && newEmail.length > 0 && (
                                        <div className="error-text">{t('erreurs.emailDejaActuel')}</div>
                                    )}
                                </div>

                                <div className="input-group">
                                    <label htmlFor="password">{t('champs.votreMotDePasse')}</label>
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
                                {isLoading ? t('changementEmail.envoi') : <>{t('changementEmail.envoyerCode')} <LuMail /></>}
                            </Button>

                            <Link to={path("profil")} className="forgot-password-link" style={{ textAlign: "center" }}>
                                {t('changementEmail.retourProfil')}
                            </Link>
                        </form>
                    ) : (
                        <form className="form" onSubmit={handleConfirm}>
                            <h2>{t('changementEmail.h2Confirmation')}</h2>
                            <p className="separator" style={{ margin: "0 0 1rem" }}>
                                {t('changementEmail.codeEnvoye', { longueur: CODE_LENGTH })}<br />
                                <strong>{newEmail.trim()}</strong>.
                            </p>
                            <p className="separator" style={{ margin: "0 0 1.5rem" }}>
                                {t('changementEmail.alerteAncienneAdresse')}
                            </p>

                            <div className="input-container">
                                <div className={"input-group" + (error ? " input-error" : "")}>
                                    <label htmlFor="code">{t('changementEmail.labelCode')}</label>
                                    <CodeInput
                                        value={code}
                                        onChange={(v) => { setCode(v); setError(""); }}
                                        autoFocus
                                    />
                                </div>

                                {error && <div className="error-text">{error}</div>}
                            </div>

                            <Button type="submit" disabled={code.length < CODE_LENGTH || isLoading}>
                                {isLoading ? t('changementEmail.confirmation') : <>{t('changementEmail.confirmer')} <LuCheck /></>}
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
                                {t('changementEmail.autreAdresse')}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
