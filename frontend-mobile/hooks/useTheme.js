import { useContext } from 'react';
import { useColorScheme } from 'react-native';
import { colors, typography } from '../constants/theme';
import { ThemeContext } from '../context/ThemeContext';

export const useTheme = () => {
    const context = useContext(ThemeContext);
    const systemTheme = useColorScheme();

    if (!context) {
        const isDark = systemTheme === 'dark';
        return {
            colors: isDark ? colors.dark : colors.light,
            typography,
            isDark,
            themeMode: 'auto',
            setThemeMode: () => { },
        };
    }

    return context;
};
