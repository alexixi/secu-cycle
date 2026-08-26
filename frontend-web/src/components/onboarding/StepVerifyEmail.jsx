import { useTranslation } from "react-i18next";
import Button from "../ui/Button";
import CodeInput, { CODE_LENGTH } from "../ui/CodeInput";
import { FaCheckCircle } from "react-icons/fa";
import "../ui/Input.css";
import "../ui/Form.css";
import "./Onboarding.css";

export default function StepVerifyEmail({
    email,
    code,
    setCode,
    onSubmit,
    onResend,
    onEditEmail,
    error,
    isLoading,
    isResending,
    resendMessage,
    cooldown = 0,
}) {
    const { t } = useTranslation('auth');
    const resendDisabled = isResending || cooldown > 0;
    const resendLabel = isResending
        ? t('onboarding.verifEmail.envoi')
        : cooldown > 0
            ? t('onboarding.verifEmail.renvoyerCodeDelai', { secondes: cooldown })
            : t('onboarding.verifEmail.renvoyerCode');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <form className="form onboarding-form" onSubmit={handleSubmit}>
            <h2>{t('onboarding.verifEmail.h2')}</h2>
            <p className="onboarding-subtitle">
                {t('onboarding.verifEmail.codeEnvoye', { longueur: CODE_LENGTH })}<br />
                <strong>{email}</strong>.
            </p>

            <div className={`input-group ${error ? "input-error" : ""}`}>
                <label htmlFor="code">{t('onboarding.verifEmail.labelCode')}</label>
                <CodeInput value={code} onChange={setCode} autoFocus required={false} />
                {error && <div className="error-text">{error}</div>}
            </div>

            <Button type="submit" className="active" disabled={isLoading || code.length < CODE_LENGTH}>
                <FaCheckCircle /> {isLoading ? t('onboarding.verifEmail.verification') : t('onboarding.verifEmail.verifier')}
            </Button>

            <div className="onboarding-verify-links">
                <button type="button" className="onboarding-link" onClick={onResend} disabled={resendDisabled}>
                    {resendLabel}
                </button>
                <button type="button" className="onboarding-link secondary" onClick={onEditEmail}>
                    Modifier l&apos;e-mail
                </button>
            </div>

            {resendMessage && <p className="onboarding-resend-message">{resendMessage}</p>}
        </form>
    );
}
