import { isRouteErrorResponse, NavLink, useRouteError } from 'react-router-dom';

export default function ErrorPage() {
    const error = useRouteError();
    if (isRouteErrorResponse(error)) {
        if (error.status === 404)
            return (
                <div className="flex h-screen w-screen flex-col items-center justify-center px-6 text-center">
                    <p className="text-base font-semibold text-indigo-400">404 - Not Found</p>
                    <h1 className="mt-4 text-balance text-7xl font-semibold tracking-tight">
                        Page not found
                    </h1>
                    <p className="mt-6 text-pretty text-xl font-medium leading-8 text-gray-400">
                        Sorry, we couldn't find the page you're looking for.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <NavLink
                            to={'/'}
                            className="shadow-xs rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                        >
                            Go back home
                        </NavLink>
                    </div>
                </div>
            );
    }

    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center px-6 text-center">
            <h1 className="mt-4 text-balance text-7xl font-semibold tracking-tight">
                Something went wrong D:
            </h1>
            <p className="mt-6 text-pretty text-xl font-medium leading-8 text-gray-400">
                An unexpected error occoured.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
                <NavLink
                    to={'/'}
                    className="shadow-xs rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                    Go back home
                </NavLink>
            </div>
        </div>
    );
}
