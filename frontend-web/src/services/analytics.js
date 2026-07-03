export function trackEvent(name, props) {
    try {
        window.umami?.track(name, props);
    } catch (e) {
        console.warn("Analytics indisponible :", e);
    }
}
