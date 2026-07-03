import { createContext, useState, useEffect, useRef, useContext } from 'react';

const ThemeContext = createContext();

const VALID_MODES = ['light', 'auto', 'dark'];

const readMode = () => {
    const stored = localStorage.getItem('themeMode');
    return VALID_MODES.includes(stored) ? stored : 'auto';
};

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(readMode);
    const [systemDark, setSystemDark] = useState(prefersDark);
    const isFirstApply = useRef(true);
    const transitionTimeout = useRef(null);

    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (event) => setSystemDark(event.matches);
        media.addEventListener('change', handleChange);
        return () => media.removeEventListener('change', handleChange);
    }, []);

    const effectiveTheme = mode === 'auto' ? (systemDark ? 'dark' : 'light') : mode;

    useEffect(() => {
        localStorage.setItem('themeMode', mode);
    }, [mode]);

    useEffect(() => {
        const root = document.documentElement;

        if (isFirstApply.current) {
            isFirstApply.current = false;
            root.dataset.theme = effectiveTheme;
            return;
        }

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduceMotion) {
            root.classList.add('theme-transition');
            if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
            transitionTimeout.current = setTimeout(() => {
                root.classList.remove('theme-transition');
            }, 500);
        }

        root.dataset.theme = effectiveTheme;
    }, [effectiveTheme]);

    useEffect(() => () => {
        if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
    }, []);

    return (
        <ThemeContext.Provider value={{ mode, setMode, effectiveTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
