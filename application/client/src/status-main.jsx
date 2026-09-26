import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LocaleProvider } from './i18n/LocaleContext.jsx';
import StatusPage from './pages/status-page/status-page.jsx';
import IncidentsPage from './pages/status-page/incidents-page.jsx';
import './index.css';

// The standalone status bundle has no app shell (and thus no theme toggle),
// so it follows the OS preference — same black/white look as the main site on
// a dark system. Set before render to avoid a flash of the wrong theme.
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const applyTheme = () => document.documentElement.classList.toggle('dark', darkQuery.matches);
applyTheme();
darkQuery.addEventListener('change', applyTheme);

// Standalone entry for the `status.` subdomain — no router, no app shell,
// just the status page itself (see status.html and server.js). server.js
// already serves any path under the `status.` host at HTTP 200 with this
// same bundle, so a plain pathname check is all "routing" IncidentsPage
// needs — no router library for one extra path.
const isIncidents = window.location.pathname === '/incidents';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <LocaleProvider>{isIncidents ? <IncidentsPage /> : <StatusPage />}</LocaleProvider>
    </StrictMode>,
);
