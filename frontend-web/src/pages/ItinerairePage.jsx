import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Header from "../components/layout/Header";
import MapComponent from "../modules/map/MapComponent";
import SearchAside from "../components/layout/SearchAside";
import ReportModal from "../components/layout/modals/ReportModal";
import { calculateItineraries, getReports, createReport, deleteReport } from "../services/apiBack";
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
    const [reports, setReports] = useState([]);
    const [reportCoords, setReportCoords] = useState(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isReportMode, setIsReportMode] = useState(false);

    const { token } = useAuth();

    useEffect(() => {
        getReports().then(setReports).catch(console.error);
    }, []);

    const handleStartSelect = (coords) => {
        setRoutePaths(null);
        setStartPoint(coords);
    };

    const handleEndSelect = (coords) => {
        setRoutePaths(null);
        setEndPoint(coords);
    };

    const handleCalculateRoute = async () => {
        if (!startPoint || !endPoint || !selectedBike || startPoint === endPoint || !startPoint.lat || !endPoint.lat) {
            return;
        }

        setIsLoading(true);
        setRoutePaths(null);
        try {
            const itineraries = await calculateItineraries(token, startPoint, endPoint, selectedBike, maxDuration, startPoint.name, endPoint.name);
            if (itineraries && itineraries.length > 0) {
                setErrorPath(false);
                setRoutePaths(itineraries);
            } else {
                setErrorPath(true);
            }
        } catch (error) {
            setErrorPath(true);
            setIsLoading(false);
            return;
        }


        setIsLoading(false);
    };

    const handleMapClick = (coords) => {
        if (!token || !isReportMode) return;
        setReportCoords(coords);
        setIsReportModalOpen(true);
    };

    const handleDeleteReport = async (reportId) => {
        try {
            await deleteReport(token, reportId);
            setReports(prev => prev.filter(r => r.id !== reportId));
        } catch (error) {
            console.error("Erreur suppression signalement:", error);
        }
    };

    const handleReportSubmit = async ({ reportType, description, lat, lon }) => {
        try {
            const newReport = await createReport(token, reportType, description, lat, lon);
            setReports(prev => [...prev, newReport]);
            setIsReportModalOpen(false);
            setIsReportMode(false);
        } catch (error) {
            console.error("Erreur signalement:", error);
        }
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
                    reports={reports}
                    onMapClick={handleMapClick}
                    onDeleteReport={token ? handleDeleteReport : null}
                    isReportMode={isReportMode}
                    onToggleReportMode={() => token && setIsReportMode(prev => !prev)}
                    canReport={!!token}
                    littleMap={false}
                />
            </div>
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onConfirm={handleReportSubmit}
                coords={reportCoords}
            />
        </>
    )
}
