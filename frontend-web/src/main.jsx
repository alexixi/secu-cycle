import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { BrowserRouter } from "react-router";
import { HelmetProvider } from 'react-helmet-async';
import { initI18n } from './i18n';
import { langFromPathname } from './i18n/routes';

const storedThemeMode = localStorage.getItem('themeMode') || 'auto';
const initialDark = storedThemeMode === 'dark'
    || (storedThemeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.dataset.theme = initialDark ? 'dark' : 'light';

// La langue se lit dans l'URL, jamais dans le stockage : c'est elle qui décide du
// contenu servi, et elle doit être posée avant le premier rendu pour que le HTML
// prérendu et l'hydratation concordent.
const lang = langFromPathname(window.location.pathname);
document.documentElement.lang = lang;

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

// Un aller-retour avant le premier rendu, sur le seul catalogue « common » : sans
// lui, l'en-tête et le pied de page — rendus hors du <Suspense> — afficheraient
// leurs clés le temps du chargement.
await initI18n(lang);

createRoot(root).render(tree);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(`/sw.js?v=${import.meta.env.VITE_BUILD_ID}`).then((reg) => {
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
