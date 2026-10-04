import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Real path routing (react-router, as in the live app). `vite`/`vite preview` fall back to index.html on its own;
// a static host needs the same SPA fallback.
export default defineConfig({ base: '/', plugins: [react()], server: { port: 5174 } });
