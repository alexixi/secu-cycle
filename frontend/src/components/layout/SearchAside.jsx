import "./SearchAside.css";
import Button from "../ui/Button";
import SwapButton from "../ui/SwapButton";
import AdressInput from "../ui/AdressInput";
import { MdDirectionsBike } from "react-icons/md";
import { FaFlagCheckered } from "react-icons/fa";
import { PiPathBold } from "react-icons/pi";


export default function SearchAside({ startAdress, endAdress, onStartSelect, onEndSelect, onSearchClick, onSwap, isReady }) {
    return (
        <aside className="search-aside">
            <div className="adress-input-wrapper">
                <div className="adress-inputs">
                    <AdressInput placeholder="Départ" defaultValue={startAdress} onSelect={onStartSelect}><MdDirectionsBike size={24} /></AdressInput>
                    <AdressInput placeholder="Destination" defaultValue={endAdress} onSelect={onEndSelect}><FaFlagCheckered size={24} /></AdressInput>
                </div>
                <SwapButton onClick={onSwap} />
            </div>

            <Button id="search-button" onClick={onSearchClick} disabled={!isReady}><PiPathBold /> Calculer les itinéraires</Button>
        </aside>
    );
}
