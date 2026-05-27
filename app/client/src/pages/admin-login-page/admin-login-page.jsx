import { useReducer } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import { initialState, reducer } from './adminLoginReducer.js';
import { TOKEN_STORAGE_KEY } from '../../utils/auth.js';

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
            dispatch({
                type: 'SUBMIT_ERROR',
                payload: 'Could not reach the server. Try again.',
            });
        }
    }

    return (
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-10 lg:py-14">
            <div className="mx-auto w-full max-w-md px-6">
                <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-10">
                    <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 blur-3xl dark:from-slate-800 dark:to-slate-900" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-gradient-to-tr from-slate-100 to-slate-50 blur-3xl dark:from-slate-900 dark:to-slate-950" />

                    <div className="relative">
                        <div className="flex flex-col items-center text-center">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950">
                                <LockClosedIcon className="h-6 w-6" aria-hidden="true" />
                            </div>

                            <p className="mt-5 text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                                Admin Area
                            </p>

                            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                                Sign in
                            </h1>

                            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                Authenticate to manage projects and technologies.
                            </p>
                        </div>

                        <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
                            <div>
                                <label
                                    htmlFor="username"
                                    className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
                                >
                                    Username
                                </label>

                                <div className="relative mt-2">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                                        <UserIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>

                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        autoComplete="username"
                                        required
                                        value={username}
                                        onChange={event =>
                                            dispatch({ type: 'SET_USERNAME', payload: event.target.value })
                                        }
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-950 placeholder-slate-400 transition focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 dark:focus:border-white dark:focus:bg-slate-900 dark:focus:ring-white/10"
                                        placeholder="admin"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
                                >
                                    Password
                                </label>

                                <div className="relative mt-2">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                                        <LockClosedIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>

                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={event =>
                                            dispatch({ type: 'SET_PASSWORD', payload: event.target.value })
                                        }
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-12 text-sm text-slate-950 placeholder-slate-400 transition focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 dark:focus:border-white dark:focus:bg-slate-900 dark:focus:ring-white/10"
                                        placeholder="••••••••"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => dispatch({ type: 'TOGGLE_PASSWORD_VISIBILITY' })}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
                                    >
                                        {showPassword
                                            ? <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                                            : <EyeIcon className="h-5 w-5" aria-hidden="true" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div
                                    role="alert"
                                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                                >
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting || !username || !password}
                                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:focus-visible:ring-white dark:focus-visible:ring-offset-slate-950"
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
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
                                        </svg>
                                        Signing in…
                                    </span>
                                ) : 'Sign in'}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                            Not an admin?{' '}
                            <Link to="/" className="font-medium text-slate-700 underline-offset-4 hover:underline dark:text-slate-200">
                                Back to homepage
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
