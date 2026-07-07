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
