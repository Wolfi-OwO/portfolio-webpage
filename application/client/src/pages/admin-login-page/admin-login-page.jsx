import { useReducer } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import { initialState, reducer } from './adminLoginReducer.js';
import { TOKEN_STORAGE_KEY } from '../../utils/auth.js';

const inputCls =
    'w-full rounded-md border border-[var(--line)] bg-[var(--bg)] py-3 pl-10 pr-4 text-sm text-[var(--text)] placeholder-[var(--muted)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]';

export default function AdminLoginPage() {
    const navigate = useNavigate();
    const [state, dispatch] = useReducer(reducer, initialState);
    const { username, password, showPassword, error, submitting } = state;

    async function handleSubmit(event) {
        event.preventDefault();
        dispatch({ type: 'SUBMIT_START' });

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                dispatch({
                    type: 'SUBMIT_ERROR',
                    payload: payload.message || 'Invalid credentials.',
                });
                return;
            }

            const { token } = await response.json();
            localStorage.setItem(TOKEN_STORAGE_KEY, token);
            dispatch({ type: 'SUBMIT_SUCCESS' });
            navigate('/');
        } catch (_err) {
            dispatch({ type: 'SUBMIT_ERROR', payload: 'Could not reach the server. Try again.' });
        }
    }

    return (
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-10 lg:py-14">
            <div className="mx-auto w-full max-w-md px-6">
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-8 sm:p-10">
                    <div className="flex flex-col items-center text-center">
                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[var(--line)] text-[var(--accent)]">
                            <LockClosedIcon className="h-6 w-6" aria-hidden="true" />
                        </div>

                        <p className="mt-5 font-mono text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                            Admin area
                        </p>

                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text)]">
                            Sign in
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                            Authenticate to manage projects, technologies and monitors.
                        </p>
                    </div>

                    <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]"
                            >
                                Username
                            </label>

                            <div className="relative mt-2">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted)]">
                                    <UserIcon className="h-5 w-5" aria-hidden="true" />
                                </span>

                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    value={username}
                                    onChange={(event) =>
                                        dispatch({
                                            type: 'SET_USERNAME',
                                            payload: event.target.value,
                                        })
                                    }
                                    className={inputCls}
                                    placeholder="admin"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]"
                            >
                                Password
                            </label>

                            <div className="relative mt-2">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted)]">
                                    <LockClosedIcon className="h-5 w-5" aria-hidden="true" />
                                </span>

                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(event) =>
                                        dispatch({
                                            type: 'SET_PASSWORD',
                                            payload: event.target.value,
                                        })
                                    }
                                    className={`${inputCls} pr-12`}
                                    placeholder="••••••••"
                                />

                                <button
                                    type="button"
                                    onClick={() => dispatch({ type: 'TOGGLE_PASSWORD_VISIBILITY' })}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--muted)] transition hover:text-[var(--text)]"
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                                    ) : (
                                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="rounded-md px-4 py-3 text-sm"
                                style={{
                                    background: 'color-mix(in srgb, var(--down) 10%, transparent)',
                                    color: 'var(--down)',
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting || !username || !password}
                            className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-[var(--text)] px-6 py-3 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? (
                                <span className="inline-flex items-center gap-2">
                                    <svg
                                        className="h-4 w-4 animate-spin"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
                                        />
                                    </svg>
                                    Signing in…
                                </span>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-[var(--muted)]">
                        Not an admin?{' '}
                        <Link
                            to="/"
                            className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
                        >
                            Back to homepage
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
