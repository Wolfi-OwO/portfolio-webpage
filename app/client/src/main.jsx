import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { LocaleProvider } from './i18n/LocaleContext.jsx';
import { router } from './routes.jsx';
import './index.css';

// The status page lives on its own `status.` subdomain and its own standalone
// bundle (see status.html, status-main.jsx and server.js) — it never reaches
// this entry point.
createRoot(document.getElementById('root')).render(
    <StrictMode>
        <LocaleProvider>
            <RouterProvider router={router} />
        </LocaleProvider>
    </StrictMode>,
);
