import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

const BUILD_ID = Date.now().toString(36)

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), svgr()],
    define: {
        'import.meta.env.VITE_BUILD_ID': JSON.stringify(BUILD_ID),
    },
})
