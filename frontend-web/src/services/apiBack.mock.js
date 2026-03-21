// Simulation des requêtes vers le backend pour le développement frontend sans dépendance au backend
let userProfile = {}

let userBikes = [];

let currentID = 0;

export async function calculateItineraries(token, start, end, bikeType, maxDuration) {
    await new Promise(resolve => setTimeout(resolve, 250));

    const dLat = end.lat - start.lat;
    const dLon = end.lon - start.lon;

    const itineraries = [
        {
            id: "secure",
            name: "Sécurisé",
            score: 0.95,
            distance: 5.2,
            duration: 25,
            percent_bike_lane: 0.8,
            path: [
                { lat: start.lat, lon: start.lon },
                { lat: start.lat + dLat * 0.2 + 0.003, lon: start.lon + dLon * 0.2 - 0.003 },
                { lat: start.lat + dLat * 0.5 + 0.004, lon: start.lon + dLon * 0.5 - 0.004 },
                { lat: start.lat + dLat * 0.8 + 0.003, lon: start.lon + dLon * 0.8 - 0.003 },
                { lat: end.lat, lon: end.lon }
            ]
        },
        {
            id: "fast",
            name: "Rapide",
            score: 0.4,
            distance: 4.5,
            duration: 18,
            percent_bike_lane: 0.3,
            path: [
                { lat: start.lat, lon: start.lon },
                { lat: start.lat + dLat * 0.33, lon: start.lon + dLon * 0.33 },
                { lat: start.lat + dLat * 0.66, lon: start.lon + dLon * 0.66 },
                { lat: end.lat, lon: end.lon }
            ]
        },
        {
            id: "balanced",
            name: "Meilleur compromis",
            score: 0.75,
            distance: 4.8,
            duration: 21,
            percent_bike_lane: 0.5,
            path: [
                { lat: start.lat, lon: start.lon },
                { lat: start.lat + dLat * 0.25 + 0.001, lon: start.lon + dLon * 0.25 - 0.001 },
                { lat: start.lat + dLat * 0.5 + 0.0015, lon: start.lon + dLon * 0.5 - 0.0015 },
                { lat: start.lat + dLat * 0.75 + 0.001, lon: start.lon + dLon * 0.75 - 0.001 },
                { lat: end.lat, lon: end.lon }
            ]
        }
    ];
    return itineraries;
}

export async function login(email, password) {
    await new Promise(resolve => setTimeout(resolve, 250));
    return {
        access_token: "fake_token_12345",
        token_type: "bearer",
        expires_in: 3600
    };
}

export async function register(firstName, lastName, birthdate, email, password) {
    await new Promise(resolve => setTimeout(resolve, 250));
    userProfile = {
        first_name: firstName,
        last_name: lastName,
        birth_date: birthdate,
        email: email,
    };
    localStorage.setItem("user", JSON.stringify(userProfile));
}

export async function getUserProfile(token) {
    await new Promise(resolve => setTimeout(resolve, 250));
    userProfile = JSON.parse(localStorage.getItem("user")) || userProfile;
    return userProfile;
}

export async function changeProfileInfo(token, firstName, lastName, email, birthDate, password, level) {
    await new Promise(resolve => setTimeout(resolve, 250));
    userProfile = JSON.parse(localStorage.getItem("user")) || userProfile;
    userProfile.first_name = firstName;
    userProfile.last_name = lastName;
    userProfile.birth_date = birthDate;
    userProfile.email = email;
    userProfile.sport_level = level;
    localStorage.setItem("user", JSON.stringify(userProfile));
}

export async function changeAddress(token, homeAddress, workAddress) {
    await new Promise(resolve => setTimeout(resolve, 250));
    userProfile = JSON.parse(localStorage.getItem("user")) || userProfile;
    userProfile.home_address = homeAddress;
    userProfile.work_address = workAddress;
    localStorage.setItem("user", JSON.stringify(userProfile));
}

export async function getUserBikes(token) {
    await new Promise(resolve => setTimeout(resolve, 250));
    userBikes = JSON.parse(localStorage.getItem("bikes")) || userBikes;
    return userBikes;
}

export async function addBike(token, name, type, isElectric) {
    await new Promise(resolve => setTimeout(resolve, 250));
    userBikes = JSON.parse(localStorage.getItem("bikes")) || userBikes;
    currentID = JSON.parse(localStorage.getItem("id")) || currentID;
    userBikes.push({ id: ++currentID, name, type, isElectric });
    localStorage.setItem("id", JSON.stringify(currentID));
    localStorage.setItem("bikes", JSON.stringify(userBikes));
}

export async function editBike(token, bikeId, name, type, isElectric) {
    await new Promise(resolve => setTimeout(resolve, 250));
    userBikes = JSON.parse(localStorage.getItem("bikes")) || userBikes;
    userBikes = userBikes.map(b => b.id === bikeId ? { id: bikeId, name, type, isElectric } : b);
    localStorage.setItem("bikes", JSON.stringify(userBikes));
}

export async function suppressBike(token, bike) {
    await new Promise(resolve => setTimeout(resolve, 250));
    userBikes = JSON.parse(localStorage.getItem("bikes")) || userBikes;
    console.log("Suppression du vélo :", bike);
    userBikes = userBikes.filter(b => b.id !== bike.id);
    localStorage.setItem("bikes", JSON.stringify(userBikes));
}

export async function changePassword(token, oldPassword, newPassword) {
    await new Promise(resolve => setTimeout(resolve, 250));
}
