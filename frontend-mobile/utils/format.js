export function formatDistance(meters) {
    if (meters === null || meters === undefined) return '';
    if (meters < 50) return 'Maintenant';
    const rounded = Math.round(meters / 10) * 10;
    if (rounded < 1000) return `${rounded} m`;
    return `${(rounded / 1000).toFixed(1)} km`;
}
