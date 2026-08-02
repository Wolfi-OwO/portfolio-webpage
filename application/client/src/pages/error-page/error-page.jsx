import { isRouteErrorResponse, NavLink, useRouteError } from 'react-router-dom';

export default function ErrorPage() {
    const error = useRouteError();
    if (isRouteErrorResponse(error)) {
        if (error.status === 404)
            return (
                <div className="flex h-screen w-screen flex-col items-center justify-center bg-[var(--bg)] px-6 text-center text-[var(--text)]">
                    <p className="font-mono text-base font-semibold text-[var(--accent)]">
                        404 - Not Found
                    </p>
                    <h1 className="mt-4 text-balance text-7xl font-semibold tracking-tight">
                        Page not found
                    </h1>
                    <p className="mt-6 text-pretty text-xl font-medium leading-8 text-[var(--muted)]">
                        Sorry, we couldn't find the page you're looking for.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <NavLink
                            to={'/'}
                            className="rounded-md bg-[var(--text)] px-3.5 py-2.5 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                        >
                            Go back home
                        </NavLink>
                    </div>
                </div>
            );
    }

    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-[var(--bg)] px-6 text-center text-[var(--text)]">
            <h1 className="mt-4 text-balance text-7xl font-semibold tracking-tight">
                Something went wrong D:
            </h1>
            <p className="mt-6 text-pretty text-xl font-medium leading-8 text-[var(--muted)]">
                An unexpected error occurred.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
                <NavLink
                    to={'/'}
                    className="rounded-md bg-[var(--text)] px-3.5 py-2.5 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                >
                    Go back home
                </NavLink>
            </div>
        </div>
    );
}
