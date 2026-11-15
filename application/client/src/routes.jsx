import { createBrowserRouter } from 'react-router-dom';
import DefaultLayout from './layouts/default-layout/default-layout.jsx';
import Homepage from './pages/homepage/homepage.jsx';
import ErrorPage from './pages/error-page/error-page.jsx';

// Everything except the layout and the home page is fetched when its route is first opened,
// so a visit to the home page does not download the admin, legal and career code.
const page = (load) => async () => ({ Component: (await load()).default });

const router = createBrowserRouter([
    {
        path: '/',
        element: <DefaultLayout />,
        errorElement: <ErrorPage />,
        children: [
            {
                path: '/',
                element: <Homepage />,
            },
            {
                path: '/projects',
                lazy: page(() => import('./pages/projects-page/projects-page.jsx')),
            },
            {
                path: '/career',
                lazy: page(() => import('./pages/career-page/career-page.jsx')),
            },
            {
                path: '/services',
                lazy: page(() => import('./pages/services-page/services-page.jsx')),
            },
            {
                path: '/contact',
                lazy: page(() => import('./pages/contact-page/contact-page.jsx')),
            },
            {
                path: '/privacy-policy',
                lazy: page(() => import('./pages/privacy-policy-page/privacy-policy-page.jsx')),
            },
            // §5 ECG wants the imprint easy to find and recognisably labelled.
            // It is still a section of the privacy policy, but reaching it only
            // through a link labelled "Privacy Policy" does not meet that.
            {
                path: '/impressum',
                lazy: page(() => import('./pages/imprint-page/imprint-page.jsx')),
            },
            {
                path: '/admin/login',
                lazy: page(() => import('./pages/admin-login-page/admin-login-page.jsx')),
            },
            {
                path: '/secret',
                lazy: page(() => import('./pages/secret-page/secret-page.jsx')),
            },
        ],
    },
]);

export { router };
