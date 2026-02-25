import React, { useState } from "react";
import Header from "../components/layout/Header";
import LinkButton from "../components/ui/LinkButton";
import Button from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { login } from "../services/apiBack.mock";
import { LuLogIn } from "react-icons/lu";
import "../components/ui/Input.css"
import "./Form.css"

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        try {
            await login(email, password);
            navigate("/profil");
        } catch (error) {
            console.error("Erreur de connexion", error);
        }
    };

    return (
        <>
            <Header page="login" />
            <div className="form-container">
                <form className="form" onSubmit={handleSubmit}>
                    <h2>Connexion</h2>

                    <div className="input-container">

                        <div className="input-group">
                            <label htmlFor="email">Adresse mail</label>
                            <input
                                className="input"
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="exemple@gmail.com"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Mot de passe</label>
                            <input
                                className="input"
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                    </div>

                    <Button id="login-button" disabled={!email || !password}> Se connecter <LuLogIn /></Button>

                    <div className="separator">ou</div>

                    <LinkButton to={"/signin"}>Créer un compte</LinkButton>
                </form>
            </div>
        </>
    );
}
