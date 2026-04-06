// Calcule la distance en mètres entre deux points GPS
export function haversineDistance(pos1, pos2) {
    const R = 6371000;
    const toRad = (x) => (x * Math.PI) / 180;

    const dLat = toRad(pos2.lat - pos1.lat);
    const dLon = toRad(pos2.lon - pos1.lon);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(pos1.lat)) *
        Math.cos(toRad(pos2.lat)) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Calcule le cap (bearing) entre deux points, en degrés (0-360)
function bearing(pos1, pos2) {
    const toRad = (x) => (x * Math.PI) / 180;
    const toDeg = (x) => (x * 180) / Math.PI;

    const dLon = toRad(pos2.lon - pos1.lon);
    const lat1 = toRad(pos1.lat);
    const lat2 = toRad(pos2.lat);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Déduit l'instruction textuelle à partir de l'angle de virage
function getInstructionFromAngle(angleDiff) {
    const angle = ((angleDiff + 540) % 360) - 180;

    if (angle > 150 || angle < -150) return { text: 'Faire demi-tour', icon: 'u-turn-right' };
    if (angle > 60)  return { text: 'Tourner à droite', icon: 'turn-right' };
    if (angle > 20)  return { text: 'Légèrement à droite', icon: 'subdirectory-arrow-right' };
    if (angle < -60) return { text: 'Tourner à gauche', icon: 'turn-left' };
    if (angle < -20) return { text: 'Légèrement à gauche', icon: 'subdirectory-arrow-left' };
    return { text: 'Continuer tout droit', icon: 'arrow-up' };
}

// Cherche le prochain vrai changement de direction dans le path restant
function findNextTurn(points, fromIndex) {
    const MIN_DIST_FOR_TURN = 15; // ignore les micro-virages < 15m
    const ANGLE_THRESHOLD = 20;   // angle min pour considérer un vrai virage

    for (let i = fromIndex; i < points.length - 2; i++) {
        const segDist = haversineDistance(points[i], points[i + 1]);
        if (segDist < MIN_DIST_FOR_TURN) continue;

        const b1 = bearing(points[i], points[i + 1]);
        const b2 = bearing(points[i + 1], points[i + 2]);
        const angleDiff = ((b2 - b1 + 540) % 360) - 180;

        if (Math.abs(angleDiff) >= ANGLE_THRESHOLD) {
            return {
                index: i + 1,
                point: points[i + 1],
                instruction: getInstructionFromAngle(angleDiff),
            };
        }
    }
    return null;
}

export function getGuidanceState(currentPos, path) {
    if (!path || path.length < 2) return null;

    const points = path.map(p => ({
        lat: parseFloat(p.lat),
        lon: parseFloat(p.lon),
    }));

    let closestIndex = 0;
    let closestDist = Infinity;
    points.forEach((p, i) => {
        const d = haversineDistance(currentPos, p);
        if (d < closestDist) {
            closestDist = d;
            closestIndex = i;
        }
    });

    const isOffRoute = closestDist > 30; // seuil 30m
    const nextTurn = findNextTurn(points, closestIndex);

    const destination = points[points.length - 1];
    const distanceToDestination = haversineDistance(currentPos, destination);

    let distanceToNext = null;
    let currentInstruction = { text: 'Continuer tout droit', icon: 'arrow-up' };

    if (nextTurn) {
        distanceToNext = haversineDistance(currentPos, nextTurn.point);
        if (distanceToNext < 200) {
            currentInstruction = nextTurn.instruction;
        }
    }

    return {
        currentInstruction,
        distanceToNext,
        distanceToDestination,
        isOffRoute,
        hasArrived: distanceToDestination < 15,
    };
}