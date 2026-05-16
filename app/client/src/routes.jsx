import { createBrowserRouter } from 'react-router-dom';
import DefaultLayout from './layouts/default-layout/default-layout.jsx';
import Homepage from './pages/homepage/homepage.jsx';
import ProjectsPage from './pages/projects-page/projects-page.jsx';

const router = createBrowserRouter([
    {
        path: '/',
        element: <DefaultLayout />,
        children: [
            {
                path: '/',
                element: <Homepage />
            },
            {
                path: '/projects',
                element: <ProjectsPage />
            }
        ],
    },
]);

export { router };
