import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { colors, typography } from '../constants/theme';

export const THEME_MODE_KEY = 'userAppThemeMode';
export const THEME_MODES = ['light', 'auto', 'dark'];

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const systemTheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState('auto');

    useEffect(() => {
        AsyncStorage.getItem(THEME_MODE_KEY)
            .then((saved) => {
                if (THEME_MODES.includes(saved)) setThemeModeState(saved);
            })
            .catch(() => { });
    }, []);

    const setThemeMode = useCallback(async (mode) => {
        if (!THEME_MODES.includes(mode)) return;
        setThemeModeState(mode);
        try {
            await AsyncStorage.setItem(THEME_MODE_KEY, mode);
        } catch (e) {
            console.warn('Préférence de thème non sauvegardée :', e);
        }
    }, []);

    const value = useMemo(() => {
        const isDark = themeMode === 'auto' ? systemTheme === 'dark' : themeMode === 'dark';

        return {
            colors: isDark ? colors.dark : colors.light,
            typography,
            isDark,
            themeMode,
            setThemeMode,
        };
    }, [themeMode, systemTheme, setThemeMode]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
