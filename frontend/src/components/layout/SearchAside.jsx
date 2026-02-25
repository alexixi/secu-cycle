import "./SearchAside.css";
import Button from "../ui/Button";
import SwapButton from "../ui/SwapButton";
import AdressInput from "../ui/AdressInput";
import BikeSelect from "./BikeSelect";
import { MdDirectionsBike } from "react-icons/md";
import { FaFlagCheckered } from "react-icons/fa";
import { PiPathBold } from "react-icons/pi";


export default function SearchAside({ startAdress, endAdress, onStartSelect, onEndSelect, onSearchClick, onSwap, selectedBike, onBikeSelect, isReady }) {
    return (
        <aside className="search-aside">
            <div className="adress-input-wrapper">
                <div className="adress-inputs">
                    <AdressInput id="adress-input-start" placeholder="Départ" defaultValue={startAdress} onSelect={onStartSelect}><MdDirectionsBike size={24} /></AdressInput>
                    <AdressInput id="adress-input-end" placeholder="Destination" defaultValue={endAdress} onSelect={onEndSelect}><FaFlagCheckered size={24} /></AdressInput>
                </div>
                <SwapButton onClick={onSwap} />
            </div>
            <BikeSelect selectedBike={selectedBike} onSelect={onBikeSelect} />
            <Button id="search-button" onClick={onSearchClick} disabled={!isReady}><PiPathBold /> Calculer les itinéraires</Button>
        </aside>
    );
}
