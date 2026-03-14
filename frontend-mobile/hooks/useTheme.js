import { useColorScheme } from 'react-native';
import { colors, typography } from '../constants/theme';

export const useTheme = () => {
    const systemTheme = useColorScheme();
    const isDark = systemTheme === 'dark';

    const themeColors = isDark ? colors.dark : colors.light;

    return {
        colors: themeColors,
        typography,
        isDark,
    };
};
