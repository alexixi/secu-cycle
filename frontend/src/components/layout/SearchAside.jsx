import "./SearchAside.css";
import Button from "../ui/Button";
import AdressInput from "../ui/AdressInput";

export default function SearchAside() {
    return (
        <aside className="search-aside">
            <div className="input-zone">
                <AdressInput placeholder="Départ" />
                <AdressInput placeholder="Destination" />
            </div>
            <Button id="search-button">Calculer les itinéraires</Button>
        </aside>
    );
}
