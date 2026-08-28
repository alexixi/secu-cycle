import { useContext } from 'react';

import { LocaleContext } from '../context/LocaleContext';
import { currentLanguage } from '../services/languagePreference';

/**
 * Langue courante et sélecteur de langue.
 *
 * Repli si le contexte est absent, comme useTheme : un composant peut être rendu
 * hors du provider (écran d'erreur, module monté à part) et ne doit pas planter
 * pour autant.
 */
export const useLocale = () => {
    const context = useContext(LocaleContext);

    if (!context) {
        return {
            language: currentLanguage(),
            languageMode: 'auto',
            setLanguageMode: () => { },
            ready: true,
        };
    }

    return context;
};
