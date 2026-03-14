import { useState } from "react";
import Header from "../components/layout/Header";
import MapComponent from "../modules/map/MapComponent";
import SearchAside from "../components/layout/SearchAside";
import { calculateItineraries } from "../services/apiBack";
import "./ItinerairePage.css";

export default function ItinerairePage() {
    const [startPoint, setStartPoint] = useState(null);
    const [endPoint, setEndPoint] = useState(null);
    const [routePaths, setRoutePaths] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedBike, setSelectedBike] = useState(null);
    const [selectedItineraire, setSelectedItineraire] = useState(null);
    const [maxTime, setMaxTime] = useState(null);
    const [maxDuration, setMaxDuration] = useState(null);
    const [errorPath, setErrorPath] = useState(false);

    const handleStartSelect = (coords) => {
        setRoutePaths(null);
        setStartPoint(coords);
    };

    const handleEndSelect = (coords) => {
        setRoutePaths(null);
        setEndPoint(coords);
    };

    const handleCalculateRoute = async () => {
        if (!startPoint || !endPoint) { return; }

        setIsLoading(true);
        setRoutePaths(null);
        const itineraries = await calculateItineraries(startPoint, endPoint, selectedBike, maxDuration);

        if (itineraries && itineraries.length > 0) {
            setErrorPath(false);
            setRoutePaths(itineraries);
        } else {
            setErrorPath(true);
        }

        setIsLoading(false);
    };

    const handleSwap = () => {
        const temp = startPoint;
        setStartPoint(endPoint);
        setEndPoint(temp);
    };

    const handleMaxTimeChange = (e) => {
        const [hours, minutes] = e.target.value.split(":").map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
            const newMaxTime = new Date();
            newMaxTime.setHours(hours);
            newMaxTime.setMinutes(minutes);
            const newMaxDuration = Math.round((newMaxTime.getTime() - Date.now()) / 60000);
            if (newMaxDuration > 0) {
                setMaxDuration(newMaxDuration);
                setMaxTime(e.target.value);
            }
        } else {
            setMaxTime(null);
            setMaxDuration(null);
        }
    }

    const handleMaxDurationChange = (e) => {
        setMaxDuration(e.target.value);
        const minutes = parseInt(e.target.value);
        if (!isNaN(minutes) && minutes > 0) {
            let newMaxTime = new Date();
            newMaxTime.setMinutes(newMaxTime.getMinutes() + minutes % 60);
            newMaxTime.setHours(newMaxTime.getHours() + Math.floor(minutes / 60));
            setMaxTime(newMaxTime.toTimeString().slice(0, 5));
        } else {
            setMaxDuration(null);
            setMaxTime(null);
        }
    }

    return (
        <>
            <Header page="itineraire" />
            <div className="main-page-itineraire">
                <SearchAside
                    startAdress={startPoint ? startPoint.name : ""}
                    endAdress={endPoint ? endPoint.name : ""}
                    onStartSelect={handleStartSelect}
                    onEndSelect={handleEndSelect}
                    onSearchClick={handleCalculateRoute}
                    onSwap={handleSwap}
                    maxTime={maxTime}
                    onMaxTimeChange={handleMaxTimeChange}
                    maxDuration={maxDuration}
                    onMaxDurationChange={handleMaxDurationChange}
                    selectedBike={selectedBike}
                    onBikeSelect={setSelectedBike}
                    itineraires={routePaths}
                    selectedItineraire={selectedItineraire}
                    setSelectedItineraire={setSelectedItineraire}
                    errorPath={errorPath}
                    isReady={startPoint && endPoint && selectedBike && !isLoading}
                />
                <MapComponent
                    start={startPoint}
                    end={endPoint}
                    pointilles={[startPoint && endPoint && !routePaths ? [startPoint, endPoint] : []]}
                    itineraires={routePaths}
                    selectedItineraire={selectedItineraire}
                    setSelectedItineraire={setSelectedItineraire}
                />
            </div>
        </>
    )
}
