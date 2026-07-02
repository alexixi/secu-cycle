import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';

const storedThemeMode = localStorage.getItem('themeMode') || 'auto';
const initialDark = storedThemeMode === 'dark'
    || (storedThemeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.dataset.theme = initialDark ? 'dark' : 'light';

const root = document.getElementById('root');

const tree = (
    <StrictMode>
        <HelmetProvider>
            <BrowserRouter>
                <ThemeProvider>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </ThemeProvider>
            </BrowserRouter>
        </HelmetProvider>
    </StrictMode>
);

if (root.hasChildNodes()) {
    hydrateRoot(root, tree);
} else {
    createRoot(root).render(tree);
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((reg) => {
            reg.addEventListener('updatefound', () => {
                const sw = reg.installing;
                if (!sw) return;
                sw.addEventListener('statechange', () => {
                    if (sw.state === 'installed' && navigator.serviceWorker.controller) {
                        sw.postMessage('SKIP_WAITING');
                    }
                });
            });
        }).catch(() => { });
    });

    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) return;
        reloading = true;
        window.location.reload();
    });
}
