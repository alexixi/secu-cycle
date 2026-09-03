import { useTranslation } from "react-i18next";
import Button from "../ui/Button";
import LinkButton from "../ui/LinkButton";
import PasswordInput from "../ui/PasswordInput";
import { FaPersonCirclePlus } from "react-icons/fa6";
import { LuLogIn } from "react-icons/lu";
import { ImSad2 } from "react-icons/im";
import "../ui/Input.css";
import "../ui/Form.css";
import "./Onboarding.css";
import { useLocalizedPath } from '../../i18n/useLang';

export const MIN_PASSWORD_LENGTH = 10;

export default function StepCredentials({
    email,
    setEmail,
    password,
    setPassword,
    password2,
    setPassword2,
    emailSyntaxError,
    setEmailSyntaxError,
    passwordMismatch,
    setPasswordMismatch,
    generalError,
    onSubmit,
    isLoading,
}) {
    const { t } = useTranslation('auth');
    const path = useLocalizedPath();
    const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <div className="onboarding-form">
        <form className="onboarding-form" onSubmit={handleSubmit}>
            <h2>{t('onboarding.identifiants.h2')}</h2>
            <p className="onboarding-subtitle">{t('onboarding.identifiants.intro')}</p>

            <div className={`input-group ${emailSyntaxError ? "input-error" : ""}`}>
                <label htmlFor="email">{t('onboarding.identifiants.email')}</label>
                <input
                    className="input"
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailSyntaxError(false);
                    }}
                    onBlur={(e) => {
                        if (!e.target.value) {
                            setEmailSyntaxError(false);
                        } else if (!e.target.value.includes("@") || !e.target.value.includes(".")) {
                            setEmailSyntaxError(true);
                        } else {
                            setEmailSyntaxError(false);
                        }
                    }}
                    placeholder={t('champs.emailPlaceholder')}
                    required
                    autoFocus
                />
                {emailSyntaxError && <div className="error-text">{t('erreurs.emailInvalide')}</div>}
            </div>

            <div className={`input-group ${passwordMismatch || passwordTooShort ? "input-error" : ""}`}>
                <label htmlFor="password">{t('onboarding.identifiants.motDePasse')}</label>
                <PasswordInput
                    value={password}
                    name="password"
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordMismatch(false);
                    }}
                />
                <div className="rule">{t('onboarding.identifiants.regleLongueur', { count: MIN_PASSWORD_LENGTH })}</div>
                {passwordTooShort && (
                    <div className="error-text">{t('onboarding.identifiants.tropCourt', { count: MIN_PASSWORD_LENGTH })}</div>
                )}
            </div>

            <div className={`input-group ${passwordMismatch ? "input-error" : ""}`}>
                <label htmlFor="password2">{t('onboarding.identifiants.confirmation')}</label>
                <PasswordInput
                    value={password2}
                    name="password2"
                    onChange={(e) => {
                        setPassword2(e.target.value);
                        setPasswordMismatch(false);
                    }}
                />
            </div>

            {passwordMismatch && <p className="error-text">{t('onboarding.identifiants.motsDePasseDifferents')}</p>}

            <Button
                type="submit"
                className="active"
                disabled={isLoading || !email || !password || !password2 || password.length < MIN_PASSWORD_LENGTH}
            >
                <FaPersonCirclePlus /> {isLoading ? t('onboarding.identifiants.creation') : t('onboarding.continuer')}
            </Button>

            {generalError && (
                <p className="error-text"><ImSad2 /> {generalError}</p>
            )}
        </form>

        <div className="separator">{t('connexion.ou')}</div>

        <LinkButton to={path("login")}>{t('onboarding.identifiants.dejaUnCompte')} <LuLogIn /></LinkButton>
        </div>
    );
}
