import { useState } from "react";
import Header from "../components/layout/Header";
import Button from "../components/ui/Button";
import LinkButton from "../components/ui/LinkButton";
import IconButton from "../components/ui/IconButton";
import "../components/ui/Input.css"
import { useAuth } from "../context/AuthContext";
import { FaPersonCirclePlus } from "react-icons/fa6";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ImSad2 } from "react-icons/im";
import { register, login, getUserProfile } from "../services/apiBack";
import { useNavigate } from "react-router-dom";
import { LuLogIn } from "react-icons/lu";
import confetti from "canvas-confetti"
import "../components/ui/Form.css"

export default function ProfileCreationPage() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [birthDate, setBirthdate] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const [password2, setPassword2] = useState("");
    const [hasError, setHasError] = useState(false);
    const [isValidated, setIsValidated] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);
    const [emailSyntaxError, setemailSyntaxError] = useState(false);
    const [emailAlreadyUsedError, setEmailAlreadyUsedError] = useState(false);
    const [generalError, setGeneralError] = useState(false);

    const { loginAuth, updateUser } = useAuth();


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== password2) {
            setHasError(true);
            return;
        }

        try {
            await register(firstName, lastName, birthDate, email, password);
            triggerConfetti();
            try {
                const response_login = await login(email, password);
                loginAuth(response_login.access_token);
                const response_user = await getUserProfile(response_login.access_token);
                updateUser(response_user);
                navigate("/profil");
            } catch (error) {
                navigate("/login");
            }
        } catch (error) {
            setGeneralError(true);
        }
    };

    const handlePasswordChange = (setter) => (e) => {
        setter(e.target.value);
        if (hasError) setHasError(false);
        setGeneralError(false);
    };

    const handlePasswordBlur = () => {
        setGeneralError(false);
        if (password && password2) {
            if (password !== password2) {
                setHasError(true);
                setIsValidated(false);
            } else {
                setHasError(false);
                setIsValidated(true);
            }
        }
    };

    const triggerConfetti = () => {
        const end = Date.now() + 3 * 1000;
        const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

        const frame = () => {
            if (Date.now() > end) return;

            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                startVelocity: 80,
                origin: { x: 0, y: 0.8 },
                colors: colors,
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                startVelocity: 80,
                origin: { x: 1, y: 0.8 },
                colors: colors,
            });

            requestAnimationFrame(frame);
        };
        frame();
    };

    return (
        <>
            <Header page="signin" />
            <div className="page-form-container">
                <div className="form-container">
                    <form className="form" onSubmit={handleSubmit}>
                        <h2>Créer un compte</h2>

                        <div className="input-group">
                            <label htmlFor="text">Prénom</label>
                            <input
                                className="input"
                                type="text"
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="lastName">Nom</label>
                            <input
                                className="input"
                                type="text"
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value) && setGeneralError(false)}
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="birthdate">Date de naissance</label>
                            <input
                                className="input"
                                type="date"
                                id="birthdate"
                                value={birthDate}
                                onChange={(e) => setBirthdate(e.target.value) && setGeneralError(false)}
                            />
                        </div>

                        <div className={`input-group ${emailSyntaxError ? "input-error" : ""}`}>
                            <label htmlFor="email">Adresse mail *</label>
                            <input
                                className="input"
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value) || setemailSyntaxError(false) || setEmailAlreadyUsedError(false) || setGeneralError(false)}
                                onBlur={(e) => {
                                    if (!e.target.value) {
                                        setemailSyntaxError(false);
                                    } else if (!e.target.value.includes("@") || !e.target.value.includes(".")) {
                                        setemailSyntaxError(true);
                                    } else {
                                        setemailSyntaxError(false);
                                    }
                                }}
                                placeholder="exemple@gmail.com"
                                required
                            />
                            {emailSyntaxError && (
                                <div className="error-text">
                                    Adresse mail invalide.
                                </div>
                            )}
                            {emailAlreadyUsedError && (
                                <div className="error-text">
                                    Adresse mail déjà utilisée.
                                </div>
                            )}
                        </div>

                        <div className={`input-group ${hasError ? "input-error" : ""}`}>
                            <label htmlFor="password">Mot de passe *</label>
                            <div className="password-container">
                                <input
                                    className="input"
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={handlePasswordChange(setPassword)}
                                    onBlur={handlePasswordBlur}
                                    required
                                />
                                <IconButton type="button" className="show-password" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </IconButton>

                            </div>
                        </div>

                        <div className={`input-group ${hasError ? "input-error" : ""}`}>
                            <label htmlFor="password2">Confirmation du mot de passe *</label>
                            <div className="password-container">
                                <input
                                    className="input"
                                    type={showPassword2 ? "text" : "password"}
                                    id="password2"
                                    value={password2}
                                    onChange={handlePasswordChange(setPassword2)}
                                    onBlur={handlePasswordBlur}
                                    required
                                />
                                <IconButton type="button" className="show-password" onClick={() => setShowPassword2(!showPassword2)}>
                                    {showPassword2 ? <FaEyeSlash /> : <FaEye />}
                                </IconButton>
                            </div>
                        </div>

                        {hasError && <p className="error-text">Les mots de passe ne correspondent pas.</p>}

                        <Button type="submit" id="signin-button" disabled={!email || !password || !password2 || hasError || !isValidated}><FaPersonCirclePlus />    Créer mon compte</Button>

                        {generalError && <p className="error-text"><ImSad2 /> Une erreur est survenue lors de la création du compte.<br />Veuillez réessayer.</p>}
                    </form>

                    <div className="separator">ou</div>

                    <LinkButton to={"/login"}>J'ai déjà un compte <LuLogIn /></LinkButton>

                    <div className="rule">* Les champs marqués d'une étoile sont obligatoires.</div>

                </div>
            </div>
        </>
    )
}
