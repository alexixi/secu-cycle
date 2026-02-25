export async function calculateItineraries(start, end, bikeType) {
    try {
        const response = await fetch("/api/itineraries", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                start_lat: start.lat,
                start_lon: start.lon,
                end_lat: end.lat,
                end_lon: end.lon,
                bike_type: bikeType
            })
        });

        if (!response.ok) {
            console.error("Erreur HTTP API Itinéraires : ", response.status, response.statusText);
            return null;
        }

        const data = await response.json();
        return data.itineraries;

    } catch (error) {
        console.error("Erreur de la récupération des itinéraires : ", error);
        return null;
    }
}
