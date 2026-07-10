import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LocaleProvider } from './i18n/LocaleContext.jsx';
import StatusPage from './pages/status-page/status-page.jsx';
import './index.css';

// The standalone status bundle has no app shell (and thus no theme toggle),
// so it follows the OS preference — same black/white look as the main site on
// a dark system. Set before render to avoid a flash of the wrong theme.
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const applyTheme = () => document.documentElement.classList.toggle('dark', darkQuery.matches);
applyTheme();
darkQuery.addEventListener('change', applyTheme);

// Standalone entry for the `status.` subdomain — no router, no app shell,
// just the status page itself (see status.html and server.js).
createRoot(document.getElementById('root')).render(
    <StrictMode>
        <LocaleProvider>
            <StatusPage />
        </LocaleProvider>
    </StrictMode>,
);
