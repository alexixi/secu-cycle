import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <HelmetProvider>
            <BrowserRouter>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </BrowserRouter>
        </HelmetProvider>
    </StrictMode>,
)
