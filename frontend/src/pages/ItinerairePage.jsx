import { useState } from "react";
import Header from "../components/layout/Header";
import MapComponent from "../modules/map/MapComponent";
import SearchAside from "../components/layout/SearchAside";
import "./ItinerairePage.css";

export default function ItinerairePage() {
    const [startPoint, setStartPoint] = useState(null);
    const [endPoint, setEndPoint] = useState(null);

    const handleStartSelect = (coords) => {
        console.log("Départ sélectionné :", coords);
        setStartPoint(coords); // On met à jour l'état
    };

    const handleEndSelect = (coords) => {
        console.log("Arrivée sélectionnée :", coords);
        setEndPoint(coords);
    };

    const handleCalculateRoute = () => {
        if (startPoint && endPoint) {
            console.log("Lancement du calcul entre", startPoint.name, "et", endPoint.name);
            // CALL bakcend
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
                    isReady={startPoint !== null && endPoint !== null}
                />
                <MapComponent
                    start={startPoint}
                    end={endPoint}
                    roadPaths={[startPoint && endPoint ? [startPoint, endPoint] : []]}
                    color="blue"
                    dashed={true}
                />
            </div>
        </>
    )
}
