import Header from "../components/layout/Header";
import MapComponent from "../modules/map/MapComponent";

export default function ItinerairePage() {
    return (
        <>
            <Header page="itineraire" />
            <SearchAside />
            <MapComponent
                start={[44.7966, -0.6156]}
                end={[44.8312, -0.5728]}
                roadPaths={[[[44.7966, -0.6156], [44.814, -0.6], [44.8312, -0.5728]]]}
            />
        </>
    )
}
