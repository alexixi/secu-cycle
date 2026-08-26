import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Meta from "../components/Meta";
import LinkButton from "../components/ui/LinkButton";
import Button from "../components/ui/Button";
import PasswordInput from "../components/ui/PasswordInput";
import { useNavigate, useLocation, Link } from "react-router";
import { login, getUserProfile, getUserBikes } from "../services/apiBack";
import { getUserHistoric } from "../services/apiBack";
import { useAuth } from "../context/AuthContext";
import { trackEvent } from "../services/analytics";
import { LuLogIn } from "react-icons/lu";
import { FaPersonCirclePlus } from "react-icons/fa6";
import { useLocalizedPath } from '../i18n/useLang';
import "../components/ui/Input.css"
import "../components/ui/Form.css"

export default function Login() {
    const { t } = useTranslation('auth');
    const path = useLocalizedPath();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const [emailError, setEmailError] = useState(false);
    const [hasError, setHasError] = useState(false);

    const location = useLocation();
    const [errorMessage, setErrorMessage] = useState(location.state?.message || "");

    useEffect(() => {
        if (location.state?.message) {
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const { loginAuth, updateUser, updateBikes, updateHistoric } = useAuth();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        try {
            const response_login = await login(email, password);
            loginAuth(response_login.access_token, response_login.refresh_token);
            const response_user = await getUserProfile(response_login.access_token);
            updateUser(response_user);
            const userBikes = await getUserBikes(response_login.access_token);
            updateBikes(userBikes);
            const response_historic = await getUserHistoric(response_login.access_token);
            updateHistoric(response_historic);
            trackEvent("logged_in");
            navigate(path("profil"));
        } catch (error) {
            if (error?.status === 403) {
                navigate(path("signin"), { state: { email, password, verify: true } });
                return;
            }
            console.error("Login error:", error);
            trackEvent("login_failed");
            setHasError(true);
        }
    };

    return (
        <>
            <Meta title={t('connexion.titrePage')} description={t('connexion.metaDescription')} noindex />
            <div className="page-form-container">
                {errorMessage && (
                    <div className="info-box">
                        <p>{errorMessage}</p>
                        <button className="button" onClick={() => setErrorMessage("")}>OK</button>
                    </div>
                )}
                <div className="form-container">
                    <form className="form" onSubmit={handleSubmit}>
                        <h2>{t('connexion.h2')}</h2>

                        <div className="input-container">

                            <div className={"input-group" + (hasError || emailError ? " input-error" : "")}>
                                <label htmlFor="email">{t('champs.email')}</label>
                                <input
                                    className="input"
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setHasError(false);
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
                                    required
                                />
                                {emailError && (
                                    <div className="error-text">
                                        {t('erreurs.emailInvalide')}
                                    </div>
                                )}
                            </div>

                            <div className={"input-group" + (hasError ? " input-error" : "")}>
                                <label htmlFor="password">{t('champs.motDePasse')}</label>
                                <PasswordInput
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setHasError(false);
                                    }}>
                                </PasswordInput>
                            </div>
                            {hasError && (
                                <div className="error-text">
                                    {t('connexion.identifiantsIncorrects')}<br /> {t('connexion.reessayer')}
                                </div>
                            )}
                            <Link
                                to={path("forgotPassword")}
                                state={{ email }}
                                className="forgot-password-link"
                            >
                                {t('connexion.motDePasseOublie')}
                            </Link>
                        </div>

                        <Button type="submit" id="login-button" disabled={!email || !password || hasError}> {t('connexion.seConnecter')} <LuLogIn /></Button>

                        <div className="separator">{t('connexion.ou')}</div>

                        <LinkButton to={path("signin")}><FaPersonCirclePlus /> {t('connexion.creerCompte')}</LinkButton>
                    </form>
                </div>
            </div>
        </>
    );
}
