import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, DeviceEventEmitter } from 'react-native';

import i18n from '../i18n';
import {
    LANGUAGE_MODES,
    currentLanguage,
    currentLanguageMode,
    loadLanguageMode,
    refreshResolvedLanguage,
    setLanguageMode as persistLanguageMode,
} from '../services/languagePreference';

export const LocaleContext = createContext(null);

// Émis quand la langue effective change. Les écrans qui affichent des mots venus
// du backend — badges, météo, qualité de l'air, instructions de guidage — doivent
// redemander leurs données : elles portent du texte rendu, pas des clés.
export const LANGUAGE_CHANGED = 'language-changed';

export function LocaleProvider({ children }) {
    const [languageMode, setModeState] = useState('auto');
    const [language, setLanguage] = useState(currentLanguage());
    const [ready, setReady] = useState(false);

    // i18next est déjà initialisé sur la langue du téléphone (voir i18n/index.js).
    // On ne corrige ici que le cas d'une préférence explicite, et le splash
    // couvre l'écran en attendant.
    useEffect(() => {
        let vivant = true;
        // Un AsyncStorage qui ne répond pas ne doit pas laisser l'application
        // bloquée sur le splash : au pire on démarre dans la langue du téléphone.
        const secours = setTimeout(() => { if (vivant) setReady(true); }, 1500);

        loadLanguageMode()
            .then(async (langue) => {
                if (!vivant) return;
                setModeState(currentLanguageMode());
                if (langue !== i18n.language) await i18n.changeLanguage(langue);
                if (vivant) setLanguage(langue);
            })
            .catch(() => { })
            .finally(() => {
                if (!vivant) return;
                clearTimeout(secours);
                setReady(true);
            });

        return () => { vivant = false; clearTimeout(secours); };
    }, []);

    // Changement à chaud. Le web change de langue en rechargeant la page ; ici
    // changeLanguage suffit : react-i18next émet « languageChanged » et tout
    // composant monté qui utilise useTranslation se re-rend, sans remontage.
    const setLanguageMode = useCallback(async (mode) => {
        if (!LANGUAGE_MODES.includes(mode)) return;

        setModeState(mode);
        const langue = await persistLanguageMode(mode);
        setLanguage(langue);
        await i18n.changeLanguage(langue);
        DeviceEventEmitter.emit(LANGUAGE_CHANGED, langue);
    }, []);

    // « Auto » doit suivre la langue du téléphone, y compris changée pendant que
    // l'application dormait.
    useEffect(() => {
        if (languageMode !== 'auto') return undefined;

        const sub = AppState.addEventListener('change', (etat) => {
            if (etat !== 'active') return;
            const langue = refreshResolvedLanguage();
            if (langue === i18n.language) return;
            setLanguage(langue);
            i18n.changeLanguage(langue);
            DeviceEventEmitter.emit(LANGUAGE_CHANGED, langue);
        });
        return () => sub.remove();
    }, [languageMode]);

    const value = useMemo(
        () => ({ language, languageMode, setLanguageMode, ready }),
        [language, languageMode, setLanguageMode, ready],
    );

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
