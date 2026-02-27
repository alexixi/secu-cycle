import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), svgr()],
    server: {
        proxy: {
            // Dès que le front appelle "/api", Vite redirige vers le Back Python
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
        },
    },
})
