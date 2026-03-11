import React, { useState } from "react";
import Header from "../components/layout/Header";
import LinkButton from "../components/ui/LinkButton";
import Button from "../components/ui/Button";
import IconButton from "../components/ui/IconButton";
import { useNavigate } from "react-router-dom";
import { login, getUserProfile } from "../services/apiBack";
import { useAuth } from "../context/AuthContext";
import { LuLogIn } from "react-icons/lu";
import { FaPersonCirclePlus } from "react-icons/fa6";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../components/ui/Input.css"
import "../components/ui/Form.css"

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [hasError, setHasError] = useState(false);

    const { loginAuth, updateUser } = useAuth();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        try {
            const response_login = await login(email, password);
            loginAuth(response_login.access_token);
            const response_user = await getUserProfile(response_login.access_token);
            updateUser(response_user);
            navigate("/profil");
        } catch (error) {
            setHasError(true);
        }
    };

    return (
        <>
            <Header page="login" />
            <div className="page-form-container">
                <div className="form-container">
                    <form className="form" onSubmit={handleSubmit}>
                        <h2>Connexion</h2>

                        <div className="input-container">

                            <div className={"input-group" + (hasError || emailError ? " input-error" : "")}>
                                <label htmlFor="email">Adresse mail</label>
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
                                    placeholder="exemple@gmail.com"
                                    required
                                />
                                {emailError && (
                                    <div className="error-text">
                                        Adresse mail invalide.
                                    </div>
                                )}
                            </div>

                            <div className={"input-group" + (hasError ? " input-error" : "")}>
                                <label htmlFor="password">Mot de passe</label>
                                <div className="password-container">
                                    <input
                                        className="input"
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setHasError(false);
                                        }}
                                        required
                                    />
                                    <IconButton type="button" className="show-password" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </IconButton>
                                </div>
                            </div>
                            {hasError && (
                                <div className="error-text">
                                    Adresse mail ou mot de passe incorrect.<br /> Veuillez réessayer.
                                </div>
                            )}
                        </div>

                        <Button type="submit" id="login-button" disabled={!email || !password || hasError}> Se connecter <LuLogIn /></Button>

                        <div className="separator">ou</div>

                        <LinkButton to={"/signin"}><FaPersonCirclePlus /> Créer un compte</LinkButton>
                    </form>
                </div>
            </div>
        </>
    );
}
