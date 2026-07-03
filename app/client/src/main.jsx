import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { LocaleProvider } from './i18n/LocaleContext.jsx';
import { router } from './routes.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <LocaleProvider>
            <RouterProvider router={router} />
        </LocaleProvider>
    </StrictMode>,
);
