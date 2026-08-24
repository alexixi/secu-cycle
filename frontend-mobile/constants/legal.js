import * as WebBrowser from 'expo-web-browser';

const SITE_URL = 'https://secu-cycle.fr';

export const LEGAL_LINKS = {
    privacy: `${SITE_URL}/confidentialite`,
    terms: `${SITE_URL}/conditions-utilisation`,
    legalNotice: `${SITE_URL}/mentions-legales`,
    deleteAccount: `${SITE_URL}/suppression-compte`,
};

export async function openLegalPage(url) {
    try {
        await WebBrowser.openBrowserAsync(url);
    } catch (error) {
        console.warn('Ouverture de la page légale impossible :', error);
    }
}
