import { Link } from "react-router-dom";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  return (
    <div className="notfound-page">
      <h1>404</h1>
      <p>Cette page n'existe pas.</p>
      <Link to="/">Retour au tableau de bord</Link>
    </div>
  );
}
