import { useTranslation } from "react-i18next";
import "./SearchAside.css";
import Button from "../ui/Button";
import SwapButton from "../ui/SwapButton";
import AdressInput from "../ui/AdressInput";
import BikeSelect from "./BikeSelect";
import ItinerariesSelect from "./ItinerariesSelect";
import "../ui/Input.css";
import { MdDirectionsBike } from "react-icons/md";
import { FaFlagCheckered } from "react-icons/fa";
import { PiPathBold } from "react-icons/pi";
import { FaRegClock } from "react-icons/fa6";
import { MdOutlineWaterDrop } from "react-icons/md";
import { departureSuggestion } from "../../modules/map/weather";


export default function SearchAside({ startAdress, endAdress, onStartSelect, onEndSelect, onSearchClick, onSwap, maxTime, onMaxTimeChange, maxDuration, onMaxDurationChange, selectedBike, onBikeSelect, itineraires, weather, selectedItineraire, setSelectedItineraire, errorPath, isReady }) {
    const { t } = useTranslation('itineraire');
    const departure = departureSuggestion(weather);

    return (
        <aside className="search-aside">
            <div className="adress-input-wrapper">
                <div className="adress-inputs">
                    <AdressInput id="adress-input-start" placeholder={t('recherche.depart')} defaultValue={startAdress} onSelect={onStartSelect} showFavorite checkCoverage><MdDirectionsBike size={24} /></AdressInput>
                    <AdressInput id="adress-input-end" placeholder={t('recherche.destination')} defaultValue={endAdress} onSelect={onEndSelect} showFavorite checkCoverage><FaFlagCheckered size={24} /></AdressInput>
                </div>
                <SwapButton onClick={onSwap} />
            </div>
            <div className="heure-temps-max-section">
                <h3><FaRegClock size={16} /> {t('recherche.contraintes')}</h3>
                <div className="heure-max">
                    <label htmlFor="heure-max-input">{t('recherche.heureMax')} </label>
                    <input type="time" className="input input-time" id="heure-max-input" name="heure-max" onChange={onMaxTimeChange} value={maxTime || ""} />
                </div>
                <div className="temps-max">
                    <label htmlFor="duree-max-input">{t('recherche.dureeMax')} <span>{t('recherche.dureeMaxUnite')}</span></label>
                    <input type="number" className="input input-number" id="duree-max-input" name="duree-max" onChange={onMaxDurationChange} value={maxDuration || ""} min="0" />
                </div>
                {departure && (
                    <p className="departure-hint">
                        <MdOutlineWaterDrop size={15} /> {departure.text}
                    </p>
                )}
            </div>
            <BikeSelect selectedBike={selectedBike} onSelect={onBikeSelect} />
            <ItinerariesSelect itineraires={itineraires} weather={weather} selectedItineraire={selectedItineraire} setSelectedItineraire={setSelectedItineraire} />
            <Button id="search-button" onClick={onSearchClick} disabled={!isReady}><PiPathBold /> {t('recherche.calculer')}</Button>
            {errorPath && <div className="error-text">{errorPath}</div>}
        </aside>
    );
}
