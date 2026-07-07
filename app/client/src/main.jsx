import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { LocaleProvider } from './i18n/LocaleContext.jsx';
import { router } from './routes.jsx';
import StatusPage from './pages/status-page/status-page.jsx';
import './index.css';

// The status page lives on its own `status.` subdomain (like status.github.com) —
// a standalone view with no nav/footer/router, independent of the main app shell.
const onStatusSubdomain = window.location.hostname.split('.')[0] === 'status';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <LocaleProvider>
            {onStatusSubdomain ? <StatusPage /> : <RouterProvider router={router} />}
        </LocaleProvider>
    </StrictMode>,
);
