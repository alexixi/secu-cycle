import { useState } from "react";
import Header from "../components/layout/Header";
import MapComponent from "../modules/map/MapComponent";
import SearchAside from "../components/layout/SearchAside";
import { calculateItineraries } from "../services/apiBack.mock";
import "./ItinerairePage.css";

export default function ItinerairePage() {
    const [startPoint, setStartPoint] = useState(null);
    const [endPoint, setEndPoint] = useState(null);
    const [routePaths, setRoutePaths] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleStartSelect = (coords) => {
        console.log("Départ sélectionné :", coords);
        setRoutePaths(null);
        setStartPoint(coords);
    };

    const handleEndSelect = (coords) => {
        console.log("Arrivée sélectionnée :", coords);
        setRoutePaths(null);
        setEndPoint(coords);
    };

    const handleCalculateRoute = async () => {
        if (startPoint && endPoint) {
            console.log("Lancement du calcul entre", startPoint.name, "et", endPoint.name);

            setIsLoading(true);
            setRoutePaths(null);
            const paths = await calculateItineraries(startPoint, endPoint);

            if (paths && paths.length > 0) {
                setRoutePaths(paths);
                console.log("Itinéraires reçus", paths);
            } else {
                alert("Erreur lors du calcul de l'itinéraire. Vérifiez que le backend est lancé.");
            }

            setIsLoading(false);
        } else {
            alert("Veuillez sélectionner un départ et une arrivée !");
        }
    };

    const handleSwap = () => {
        const temp = startPoint;
        setStartPoint(endPoint);
        setEndPoint(temp);
    };

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
                    isReady={startPoint && endPoint && !isLoading}
                />
                <MapComponent
                    start={startPoint}
                    end={endPoint}
                    pointilles={[startPoint && endPoint && !routePaths ? [startPoint, endPoint] : []]}
                    itineraires={routePaths}
                />
            </div>
        </>
    )
}
