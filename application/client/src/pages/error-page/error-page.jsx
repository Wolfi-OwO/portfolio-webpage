import { isRouteErrorResponse, NavLink, useRouteError } from 'react-router-dom';

export default function ErrorPage() {
    const error = useRouteError();
    if (isRouteErrorResponse(error)) {
        if (error.status === 404)
            return (
                <div className="h-screen w-screen flex flex-col items-center justify-center text-center px-6">
                    <p className="text-base font-semibold text-indigo-400">404 - Not Found</p>
                    <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balanc sm:text-7xl">
                        Page not found
                    </h1>
                    <p className="mt-6 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">
                        Sorry, we couldn't find the page you're looking for.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <NavLink
                            to={'/'}
                            className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                        >
                            Go back home
                        </NavLink>
                    </div>
                </div>
            );
    }

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center text-center px-6">
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">
                Something went wrong D:
            </h1>
            <p className="mt-6 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">An unexpected error occoured.</p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
                <NavLink
                    to={'/'}
                    className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                    Go back home
                </NavLink>
            </div>
        </div>
    );
}
