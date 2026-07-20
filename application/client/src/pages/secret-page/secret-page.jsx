import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { EyeIcon, EyeSlashIcon, HeartIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { elapsedSince } from './elapsed.js';

// 25.12.2025, 15:37:48 - local time, the way it was actually lived.
const SINCE = new Date(2025, 11, 25, 15, 37, 48);

const UNLOCK_KEY = 'portfolio.secretUnlocked';

export default function SecretPage() {
    const intl = useIntl();
    const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCK_KEY) === 'true');

    usePageMeta(
        intl.formatMessage({
            id: 'secret.meta.title',
            defaultMessage: 'For Helmi (aka. the love of my life)',
        }),
        intl.formatMessage({
            id: 'secret.meta.description',
            defaultMessage: 'A little something that was never meant to be found by accident.',
        }),
    );

    function handleUnlocked() {
        sessionStorage.setItem(UNLOCK_KEY, 'true');
        setUnlocked(true);
    }

    return unlocked ? <LovePage /> : <PasswordGate onUnlocked={handleUnlocked} />;
}

// The gate. Password only - `POST /auth/unlock` answers "is this the admin
// password" without minting a token, so finding this page grants nothing.
function PasswordGate({ onUnlocked }) {
    const intl = useIntl();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const response = await fetch('/auth/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (!response.ok) {
                setPassword('');
                setError(
                    intl.formatMessage({
                        id: 'secret.gate.error',
                        defaultMessage: 'Not quite. Try again.',
                    }),
                );
                return;
            }

            onUnlocked();
        } catch (_err) {
            setError(
                intl.formatMessage({
                    id: 'secret.gate.offline',
                    defaultMessage: 'Could not reach the server. Try again.',
                }),
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
            <div className="animate-fade-up w-full max-w-sm px-6">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center [box-shadow:var(--shadow-float)]">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] text-[var(--accent)]">
                        <LockClosedIcon className="h-5 w-5" aria-hidden="true" />
                    </div>

                    <h1 className="mt-5 text-2xl font-semibold tracking-tight">
                        <FormattedMessage
                            id="secret.gate.title"
                            defaultMessage="You found something"
                        />
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        <FormattedMessage
                            id="secret.gate.subtitle"
                            defaultMessage="It's locked, though. You know the word."
                        />
                    </p>

                    <form className="mt-6 space-y-3" onSubmit={handleSubmit} noValidate>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                // Not a login form: `current-password` makes the
                                // password manager offer to save the admin password
                                // against /secret and autofill it here, which is
                                // both noise and a second place it gets stored.
                                autoComplete="off"
                                autoFocus
                                required
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="••••••••"
                                aria-label={intl.formatMessage({
                                    id: 'secret.gate.password',
                                    defaultMessage: 'Password',
                                })}
                                className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] py-3 pl-4 pr-12 text-center text-sm tracking-widest text-[var(--text)] placeholder-[var(--muted)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword((shown) => !shown)}
                                aria-label={intl.formatMessage(
                                    showPassword
                                        ? {
                                              id: 'secret.gate.hide',
                                              defaultMessage: 'Hide password',
                                          }
                                        : {
                                              id: 'secret.gate.show',
                                              defaultMessage: 'Show password',
                                          },
                                )}
                                className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-4 text-[var(--muted)] transition hover:text-[var(--text)]"
                            >
                                {showPassword ? (
                                    <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                                ) : (
                                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                                )}
                            </button>
                        </div>

                        {error && (
                            <p role="alert" className="text-sm" style={{ color: 'var(--down)' }}>
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={submitting || !password}
                            className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-[var(--text)] px-6 py-3 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <FormattedMessage id="secret.gate.submit" defaultMessage="Open it" />
                        </button>
                    </form>
                </div>

                <p className="mt-5 text-center text-xs text-[var(--muted)]">
                    <Link
                        to="/"
                        className="underline-offset-4 transition hover:text-[var(--text)] hover:underline"
                    >
                        <FormattedMessage
                            id="secret.gate.back"
                            defaultMessage="Never mind, take me back"
                        />
                    </Link>
                </p>
            </div>
        </div>
    );
}

function LovePage() {
    const [elapsed, setElapsed] = useState(() => elapsedSince(SINCE, new Date()));

    // One interval, ticking on the wall clock rather than accumulating - so the
    // seconds stay honest even if the tab gets throttled in the background.
    useEffect(() => {
        const id = setInterval(() => setElapsed(elapsedSince(SINCE, new Date())), 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="animate-fade-up mx-auto max-w-4xl pb-10">
            <figure className="overflow-hidden rounded-3xl border border-[var(--line)] [box-shadow:var(--shadow-float)]">
                <img
                    src="/us.webp"
                    alt=""
                    className="w-full object-cover"
                    // The art is the point of the page - don't let it arrive late.
                    fetchPriority="high"
                />
            </figure>

            <div className="mt-10 text-center">
                <HeartSolidIcon
                    className="animate-heartbeat mx-auto h-14 w-14 text-[#e5675b] drop-shadow-[0_6px_18px_rgba(229,103,91,0.45)]"
                    aria-hidden="true"
                />

                <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
                    <FormattedMessage
                        id="secret.heading"
                        defaultMessage="For Helmi (aka. the love of my life)"
                    />
                </h1>

                <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[var(--muted)]">
                    <FormattedMessage
                        id="secret.message"
                        defaultMessage="Some things you can't build, no matter how good you get at building things. You just get lucky once, and then you spend every day after that being grateful you did. You are the best part of my life - the person I want to tell everything to first, the one who makes an ordinary evening feel like somewhere I'd choose to be. Thank you for being mine."
                    />
                </p>

                <p className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--muted)]">
                    <HeartIcon className="h-4 w-4 text-[#e5675b]" aria-hidden="true" />
                    <FormattedMessage
                        id="secret.since"
                        defaultMessage="Together since 25.12.2025, 15:37:48"
                    />
                </p>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-6">
                <TimeCell value={elapsed.years} labelId="secret.unit.years" label="Years" />
                <TimeCell value={elapsed.months} labelId="secret.unit.months" label="Months" />
                <TimeCell value={elapsed.days} labelId="secret.unit.days" label="Days" />
                <TimeCell value={elapsed.hours} labelId="secret.unit.hours" label="Hours" />
                <TimeCell value={elapsed.minutes} labelId="secret.unit.minutes" label="Minutes" />
                <TimeCell value={elapsed.seconds} labelId="secret.unit.seconds" label="Seconds" />
            </div>

            <p className="mt-8 text-center text-sm text-[var(--muted)]">
                <FormattedMessage
                    id="secret.stillCounting"
                    defaultMessage="…and still counting. I love you ❤️"
                />
            </p>
        </div>
    );
}

// One unit of the counter. `tabular-nums` keeps the digits from jittering as
// the seconds roll over.
function TimeCell({ value, labelId, label }) {
    return (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-2 py-4 text-center [box-shadow:var(--shadow-float)]">
            <div className="font-mono text-2xl font-semibold tabular-nums text-[var(--text)] sm:text-3xl">
                {String(value).padStart(2, '0')}
            </div>
            <div className="mt-1 text-2xs uppercase tracking-[0.18em] text-[var(--muted)]">
                <FormattedMessage id={labelId} defaultMessage={label} />
            </div>
        </div>
    );
}
