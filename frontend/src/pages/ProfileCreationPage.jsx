import { useState } from "react";
import Header from "../components/layout/Header";
import Button from "../components/ui/Button";
import LinkButton from "../components/ui/LinkButton";
import "../components/ui/Input.css"
import { FaPersonCirclePlus } from "react-icons/fa6";
import "./Form.css"

export default function ProfileCreationPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthdate] = useState("");
  const [password, setPassword] = useState("");

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
    <Header page="signin" />
    <div className="form-container">
        <form className="form" onSubmit={handleSubmit}>
            <h2>Créer un compte</h2>

                <div className="input-group">
                  <label htmlFor="text">Prénom</label>
                  <input
                      className="input"
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="input-group">
                  <label htmlFor="date">Date de naissance</label>
                  <input
                      className="input"
                      type="date"
                      id="birthdate"
                      value={birthDate}
                      onChange={(e) => setBirthdate(e.target.value)}
                    />
                </div>

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

            <Button id="signin-button" disabled={!email || !password}><FaPersonCirclePlus />    Créer mon compte</Button>
             
            <div className="separator">ou</div>
             
            <LinkButton to={"/login"}>J'ai déjà un compte</LinkButton>
                             
          </form>
      </div>
    </>
  )
}
