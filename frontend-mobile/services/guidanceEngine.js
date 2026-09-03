// Géométrie du guidage.
//
// Ce module ne conserve que `haversineDistance`. Le moteur de guidage local —
// getGuidanceState, findNextTurn et leurs libellés de virage en dur — a été
// retiré : il n'était plus importé nulle part, le guidage venant entièrement de
// POST /routes/navigation, dont les instructions sont déjà traduites par le
// backend (guidance.turn.*). Le traduire aurait figé une seconde source de
// vérité sur des mots que l'API sert déjà.

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
