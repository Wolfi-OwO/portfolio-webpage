import { createBrowserRouter } from 'react-router-dom';
import DefaultLayout from './layouts/default-layout/default-layout.jsx';
import Homepage from './pages/homepage/homepage.jsx';
import ProjectsPage from './pages/projects-page/projects-page.jsx';
import ContactPage from './pages/contact-page/contact-page.jsx';
import PrivacyPolicyPage from './pages/privacy-policy-page/privacy-policy-page.jsx';
import ErrorPage from './pages/error-page/error-page.jsx';

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
                element: <ProjectsPage />,
            },
            {
                path: '/contact',
                element: <ContactPage />,
            },
            {
                path: '/privacy-policy',
                element: <PrivacyPolicyPage />,
            },
        ],
    },
]);

export { router };
