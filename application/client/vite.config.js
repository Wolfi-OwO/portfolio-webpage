import process from 'node:process';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = import.meta.dirname;

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    css: {
        devSourcemap: false,
    },
    build: {
        target: 'es2020',
        sourcemap: false,
        rollupOptions: {
            // Two independent HTML entries: the main SPA, and a standalone bundle
            // for the `status.` subdomain (see server.js) so visiting the status
            // page doesn't download the whole app's JS just to render one page.
            input: {
                main: path.resolve(__dirname, 'index.html'),
                status: path.resolve(__dirname, 'status.html'),
            },
        },
    },
    server: {
        // DEV_API_TARGET=https://www.woofi-developments.at runs the dev client against the live API, so career entries, projects and
        // activity are the real ones instead of an empty local database. Left unset it talks to the local server.
        proxy: {
            '/api': {
                target: process.env.DEV_API_TARGET || 'http://localhost:8080/',
                changeOrigin: true,
            },
            '/auth': {
                target: process.env.DEV_API_TARGET || 'http://localhost:8080/',
                changeOrigin: true,
            },
        },
    },
});
