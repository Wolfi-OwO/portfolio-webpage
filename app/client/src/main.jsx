import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import {IntlProvider } from 'react-intl';
import { router } from './routes.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <IntlProvider locale={navigator.language}>
            <RouterProvider router={router} />
        </IntlProvider>
    </StrictMode>,
);
