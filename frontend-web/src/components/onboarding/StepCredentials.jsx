import Button from "../ui/Button";
import LinkButton from "../ui/LinkButton";
import PasswordInput from "../ui/PasswordInput";
import { FaPersonCirclePlus } from "react-icons/fa6";
import { LuLogIn } from "react-icons/lu";
import { ImSad2 } from "react-icons/im";
import "../ui/Input.css";
import "../ui/Form.css";
import "./Onboarding.css";

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
    const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <div className="onboarding-form">
        <form className="onboarding-form" onSubmit={handleSubmit}>
            <h2>Créer un compte</h2>
            <p className="onboarding-subtitle">Commençons par votre adresse e-mail et un mot de passe.</p>

            <div className={`input-group ${emailSyntaxError ? "input-error" : ""}`}>
                <label htmlFor="email">Adresse mail *</label>
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
                    placeholder="exemple@gmail.com"
                    required
                    autoFocus
                />
                {emailSyntaxError && <div className="error-text">Adresse mail invalide.</div>}
            </div>

            <div className={`input-group ${passwordMismatch || passwordTooShort ? "input-error" : ""}`}>
                <label htmlFor="password">Mot de passe *</label>
                <PasswordInput
                    value={password}
                    name="password"
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordMismatch(false);
                    }}
                />
                <div className="rule">Au moins {MIN_PASSWORD_LENGTH} caractères.</div>
                {passwordTooShort && (
                    <div className="error-text">Le mot de passe doit contenir au moins {MIN_PASSWORD_LENGTH} caractères.</div>
                )}
            </div>

            <div className={`input-group ${passwordMismatch ? "input-error" : ""}`}>
                <label htmlFor="password2">Confirmation du mot de passe *</label>
                <PasswordInput
                    value={password2}
                    name="password2"
                    onChange={(e) => {
                        setPassword2(e.target.value);
                        setPasswordMismatch(false);
                    }}
                />
            </div>

            {passwordMismatch && <p className="error-text">Les mots de passe ne correspondent pas.</p>}

            <Button
                type="submit"
                className="active"
                disabled={isLoading || !email || !password || !password2 || password.length < MIN_PASSWORD_LENGTH}
            >
                <FaPersonCirclePlus /> {isLoading ? "Création…" : "Continuer"}
            </Button>

            {generalError && (
                <p className="error-text"><ImSad2 /> {generalError}</p>
            )}
        </form>

        <div className="separator">ou</div>

        <LinkButton to="/login">J&apos;ai déjà un compte <LuLogIn /></LinkButton>
        </div>
    );
}
