import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Meta from "../components/Meta";
import MapComponent from "../modules/map/MapComponent";
import SearchAside from "../components/layout/SearchAside";
import ReportModal from "../components/layout/modals/ReportModal";
import { calculateItineraries, getReports, createReport, deleteReport, getTraffic, voteReport, reportAbuse, blockReportAuthor } from "../services/apiBack";
import { trackEvent } from "../services/analytics";
import "./ItinerairePage.css";

const GENERIC_ROUTE_ERROR = "Une erreur est survenue lors de la recherche de l'itinéraire.";

const bikeLabel = (bikeId) =>
    typeof bikeId === "string" && bikeId.startsWith("default-") ? bikeId.slice("default-".length) : "perso";

export default function ItinerairePage() {
    const [startPoint, setStartPoint] = useState(null);
    const [endPoint, setEndPoint] = useState(null);
    const [routePaths, setRoutePaths] = useState(null);
    const [routeWeather, setRouteWeather] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedBike, setSelectedBike] = useState(null);
    const [selectedItineraire, setSelectedItineraire] = useState(null);
    const [maxTime, setMaxTime] = useState(null);
    const [maxDuration, setMaxDuration] = useState(null);
    const [errorPath, setErrorPath] = useState(null);
    const [reports, setReports] = useState([]);
    const [reportCoords, setReportCoords] = useState(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isReportMode, setIsReportMode] = useState(false);
    const [traffic, setTraffic] = useState(null);
    const [trafficError, setTrafficError] = useState(null);
    const [showTraffic, setShowTraffic] = useState(
        () => new URLSearchParams(window.location.search).get('couche') === 'traffic'
    );

    const { token, user } = useAuth();

    useEffect(() => {
        getReports(token).then(setReports).catch(console.error);
    }, [token]);

    useEffect(() => {
        if (!showTraffic) return;

        let cancelled = false;
        let timer = null;

        const load = async () => {
            try {
                const data = await getTraffic();
                if (cancelled) return;
                setTraffic(data);
                setTrafficError(null);
                timer = setTimeout(load, (data?.refresh_interval_s || 300) * 1000);
            } catch (error) {
                if (cancelled) return;
                setTrafficError("Trafic momentanément indisponible.");
                timer = setTimeout(load, 60000);
            }
        };
        load();

        return () => { cancelled = true; if (timer) clearTimeout(timer); };
    }, [showTraffic]);

    const handleStartSelect = (coords) => {
        setRoutePaths(null);
        setRouteWeather(null);
        setStartPoint(coords);
    };

    const handleEndSelect = (coords) => {
        setRoutePaths(null);
        setRouteWeather(null);
        setEndPoint(coords);
    };

    const handleCalculateRoute = async () => {
        if (!startPoint || !endPoint || !selectedBike || startPoint === endPoint || !startPoint.lat || !endPoint.lat) {
            return;
        }

        setIsLoading(true);
        setRoutePaths(null);
        setRouteWeather(null);
        try {
            const { routes: itineraries, weather } = await calculateItineraries(token, startPoint, endPoint, selectedBike, maxDuration, startPoint.name, endPoint.name);
            if (itineraries && itineraries.length > 0) {
                setErrorPath(null);
                setRoutePaths(itineraries);
                setRouteWeather(weather);
                trackEvent("route_calculated", { bike: bikeLabel(selectedBike), count: itineraries.length });
            } else {
                setErrorPath(GENERIC_ROUTE_ERROR);
                trackEvent("route_calculation_failed", { bike: bikeLabel(selectedBike) });
            }
        } catch (error) {
            if (error.code === "OUT_OF_ZONE") {
                setErrorPath(error.detailMessage || GENERIC_ROUTE_ERROR);
                trackEvent("address_out_of_zone", { city: startPoint.city || endPoint.city || "inconnue" });
            } else {
                setErrorPath(GENERIC_ROUTE_ERROR);
                trackEvent("route_calculation_failed", { bike: bikeLabel(selectedBike) });
            }
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

    const handleReportAt = (coords) => {
        if (!token) return;
        setReportCoords(coords);
        setIsReportModalOpen(true);
    };

    const handleReportAbuse = async (report, reason) => {
        try {
            const res = await reportAbuse(token, report.id, reason);
            trackEvent("report_abuse_reported", { reason });
            if (res?.is_hidden) setReports(prev => prev.filter(r => r.id !== report.id));
        } catch (error) {
            console.error("Erreur dénonciation:", error);
        }
    };

    const handleBlockAuthor = async (report) => {
        try {
            await blockReportAuthor(token, report.id);
            trackEvent("report_author_blocked");
            setReports(prev => prev.filter(r => r.user_id !== report.user_id));
        } catch (error) {
            console.error("Erreur blocage:", error);
        }
    };

    const handleDeleteReport = async (reportId) => {
        try {
            await deleteReport(token, reportId);
            setReports(prev => prev.filter(r => r.id !== reportId));
        } catch (error) {
            console.error("Erreur suppression signalement:", error);
        }
    };

    const handleVoteReport = async (reportId, isPresent) => {
        try {
            const res = await voteReport(token, reportId, isPresent);
            trackEvent(isPresent ? "report_confirmed" : "report_denied", { report_id: reportId });
            if (res?.is_disabled) {
                setReports(prev => prev.filter(r => r.id !== reportId));
            } else if (res) {
                setReports(prev => prev.map(r => (r.id === reportId
                    ? { ...r, confirmations_count: res.confirmations_count, denials_count: res.denials_count }
                    : r)));
            }
            return res;
        } catch (error) {
            console.error("Erreur vote signalement:", error);
            return null;
        }
    };

    const handleReportSubmit = async ({ reportType, description, lat, lon }) => {
        try {
            const newReport = await createReport(token, reportType, description, lat, lon);
            setReports(prev => [...prev, newReport]);
            setIsReportModalOpen(false);
            setIsReportMode(false);
            trackEvent("report_created", { type: reportType });
        } catch (error) {
            console.error("Erreur signalement:", error);
        }
    };

    const handleSelectItineraire = (id) => {
        if (selectedItineraire === id) return;
        setSelectedItineraire(id);
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
            <Meta
                title="Sécu'Cycle | Itinéraires"
                description="Calculez un itinéraire à vélo sécurisé à Bordeaux et à Tournai avec Sécu'Cycle : trajet adapté à votre profil, votre vélo et au type de route."
                preconnect={[
                    "https://api.secu-cycle.fr",
                    { href: "https://api.maptiler.com", crossOrigin: true },
                ]}
            />
            <h1 className="sr-only">Calculateur d'itinéraire à vélo sécurisé à Bordeaux et à Tournai</h1>
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
                    weather={routeWeather}
                    selectedItineraire={selectedItineraire}
                    setSelectedItineraire={handleSelectItineraire}
                    errorPath={errorPath}
                    isReady={startPoint && endPoint && selectedBike && !isLoading}
                />
                <MapComponent
                    start={startPoint}
                    end={endPoint}
                    pointilles={[startPoint && endPoint && !routePaths ? [startPoint, endPoint] : []]}
                    itineraires={routePaths}
                    selectedItineraire={selectedItineraire}
                    setSelectedItineraire={handleSelectItineraire}
                    traffic={traffic}
                    trafficError={trafficError}
                    showTraffic={showTraffic}
                    onToggleTraffic={() => setShowTraffic(prev => !prev)}
                    reports={reports}
                    onMapClick={handleMapClick}
                    onDeleteReport={token ? handleDeleteReport : null}
                    onVote={token ? handleVoteReport : null}
                    onReportAbuse={token ? handleReportAbuse : null}
                    onBlockAuthor={token ? handleBlockAuthor : null}
                    canVote={!!token}
                    currentUserId={user?.id}
                    isReportMode={isReportMode}
                    onToggleReportMode={() => token && setIsReportMode(prev => !prev)}
                    canReport={!!token}
                    onNavigateToPoi={handleEndSelect}
                    onSetStart={handleStartSelect}
                    onSetEnd={handleEndSelect}
                    onReportAt={token ? handleReportAt : null}
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
