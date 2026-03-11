import './ItinerariesSelect.css';

export default function ItinerariesSelect({ itineraires, selectedItineraire, setSelectedItineraire }) {
    if (itineraires && itineraires.length > 0) {
        return (
            <div className="itineraries-select">
                <h3>Itinéraires disponibles</h3>
                <div className='path-container'>
                    {itineraires.map((itineraire) => (
                        <div
                            key={itineraire.id}
                            className={selectedItineraire === itineraire.id ? "path path-selected" : "path"}
                            onClick={() => setSelectedItineraire(itineraire.id)}
                        >
                            <h3>{itineraire.name}</h3>
                            <div className='path-info'>
                                <span>{itineraire.distance} km</span>
                                <span>{itineraire.duration} min</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}
