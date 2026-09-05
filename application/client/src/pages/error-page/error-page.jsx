import { isRouteErrorResponse, NavLink, useRouteError } from 'react-router-dom';
import { usePageMeta } from '../../hooks/usePageMeta.js';

// React Router's own path matching can only ever throw a 404 ErrorResponse
// (no route matched); anything else reaching this boundary -- a thrown
// loader/action error, or a render exception with no ErrorResponse wrapper
// at all -- means the app started rendering and then broke, i.e. a 500.
// Those are the only two error classes this app produces, so two copy sets
// cover it without a per-status-code table nobody would ever populate.
const COPY = {
    404: {
        label: '404',
        heading: 'Page not found',
        body: "Sorry, we couldn't find the page you're looking for.",
    },
    500: {
        label: '500',
        heading: 'This page failed to render',
        body: 'An unexpected error occurred while loading this page. Reloading may help, or go back home.',
    },
};

function ErrorLayout({ label, heading, body }) {
    usePageMeta(heading);

    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-[var(--bg)] px-6 text-center text-[var(--text)]">
            {/* --down is the token the rest of the app reserves for a real
                down/error state (see index.css) -- this page is exactly that,
                so it earns the color instead of the neutral --accent. */}
            <p className="font-mono text-base font-semibold text-[var(--down)]">{label}</p>
            <h1 className="mt-4 text-balance text-7xl font-semibold tracking-tight">{heading}</h1>
            <p className="mt-6 text-pretty text-xl font-medium leading-8 text-[var(--muted)]">
                {body}
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

export default function ErrorPage() {
    const error = useRouteError();
    const is404 = isRouteErrorResponse(error) && error.status === 404;
    const copy = is404 ? COPY[404] : COPY[500];

    return <ErrorLayout label={copy.label} heading={copy.heading} body={copy.body} />;
}
