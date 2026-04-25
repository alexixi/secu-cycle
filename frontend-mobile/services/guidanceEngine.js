export function haversineDistance(pos1, pos2) {
    const R = 6371000;
    const toRad = (x) => (x * Math.PI) / 180;

    const dLat = toRad(pos2[1] - pos1[1]);
    const dLon = toRad(pos2[0] - pos1[0]);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(pos1[1])) *
        Math.cos(toRad(pos2[1])) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearing(pos1, pos2) {
    const toRad = (x) => (x * Math.PI) / 180;
    const toDeg = (x) => (x * 180) / Math.PI;

    const dLon = toRad(pos2[0] - pos1[0]);
    const lat1 = toRad(pos1[1]);
    const lat2 = toRad(pos2[1]);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function getInstructionFromAngle(angleDiff) {
    const angle = ((angleDiff + 540) % 360) - 180;

    if (angle > 150 || angle < -150) return { text: 'Faire demi-tour', icon: 'u-turn-right' };
    if (angle > 60)  return { text: 'Tourner à droite', icon: 'turn-right' };
    if (angle > 20)  return { text: 'Légèrement à droite', icon: 'subdirectory-arrow-right' };
    if (angle < -60) return { text: 'Tourner à gauche', icon: 'turn-left' };
    if (angle < -20) return { text: 'Légèrement à gauche', icon: 'subdirectory-arrow-left' };
    return { text: 'Continuer tout droit', icon: 'arrow-up' };
}

function findNextTurn(points, fromIndex) {
    const MIN_DIST_FOR_TURN = 15;
    const ANGLE_THRESHOLD = 20;

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

export function getGuidanceState(currentPosObj, activeRoute) {
    if (!activeRoute || !activeRoute.path || activeRoute.path.length < 2) return null;

    const currentPos = [currentPosObj.lon, currentPosObj.lat];

    const points = activeRoute.path.map(p => [parseFloat(p[1]), parseFloat(p[0])]);

    let closestIndex = 0;
    let closestDist = Infinity;
    points.forEach((p, i) => {
        const d = haversineDistance(currentPos, p);
        if (d < closestDist) {
            closestDist = d;
            closestIndex = i;
        }
    });

    const isOffRoute = closestDist > 30;

    const nextTurn = findNextTurn(points, closestIndex);

    const destination = points[points.length - 1];
    const distanceToDestination = haversineDistance(currentPos, destination);

    const totalRouteDistance = haversineDistance(points[0], destination);
    let progress = 0;
    if (totalRouteDistance > 0) {
        progress = 1 - (distanceToDestination / totalRouteDistance);
        progress = Math.max(0, Math.min(1, progress));
    }

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
        progress,
        hasArrived: distanceToDestination < 15,
    };
}
