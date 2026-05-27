import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    css: {
        devSourcemap: false,
    },
    build: {
        target: 'es2020',
        sourcemap: false,
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8080/',
            },
            '/auth': {
                target: 'http://localhost:8080/',
            },
        },
    },
});
