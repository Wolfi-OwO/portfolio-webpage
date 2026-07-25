import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import {
    ArrowDownTrayIcon,
    EyeIcon,
    EyeSlashIcon,
    GiftIcon,
    HeartIcon,
    LockClosedIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { elapsedSince, monthlyMilestone } from './elapsed.js';

// 25.12.2025, 15:37:48 - local time, the way it was actually lived.
const SINCE = new Date(2025, 11, 25, 15, 37, 48);

const UNLOCK_KEY = 'portfolio.secretUnlocked';
const UNLOCK_TOKEN_KEY = 'portfolio.secretToken';

// The voucher was a seven-month present, so it rides along with that one
// milestone and no other - a gift that reappears every month isn't a gift.
const GIFT_MILESTONE = 7;

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

    function handleUnlocked(token) {
        sessionStorage.setItem(UNLOCK_KEY, 'true');

        // Held for the download, which is gated server-side. Revealing the page
        // never depended on this - the token is not what proves the password.
        if (token) {
            sessionStorage.setItem(UNLOCK_TOKEN_KEY, token);
        }

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

            const { token } = await response.json().catch(() => ({}));

            onUnlocked(token);
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
    const [now, setNow] = useState(() => new Date());

    // One interval, ticking on the wall clock rather than accumulating - so the
    // seconds stay honest even if the tab gets throttled in the background.
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const elapsed = elapsedSince(SINCE, now);
    const milestone = monthlyMilestone(SINCE, now);

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

            {/* Only shows up on the day itself - the rest of the month the
                counter below says it well enough on its own. */}
            {milestone !== null && (
                <div className="animate-fade-up mx-auto mt-10 max-w-xl rounded-2xl border border-[#e5675b]/30 bg-[#e5675b]/5 px-6 py-6 text-center">
                    <p className="font-mono text-2xs uppercase tracking-[0.18em] text-[#e5675b]">
                        <FormattedMessage
                            id="secret.milestone.badge"
                            defaultMessage="{months} months today"
                            values={{ months: milestone }}
                        />
                    </p>

                    <p className="mt-3 text-base leading-7 text-[var(--text)]">
                        <FormattedMessage
                            id="secret.milestone.message"
                            defaultMessage="I kept thinking this sort of thing wears off after a while. It doesn't. Your name shows up on my phone and I'm still happy about it, every time. And honestly, the best days were the ones where we didn't really do anything."
                        />
                    </p>

                    <FireworkHeart />

                    {milestone === GIFT_MILESTONE && <Gift />}
                </div>
            )}

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

// The delivery note, rebuilt rather than screenshotted: it has to survive both
// themes, stay legible at any width and be translatable. The recipient's email
// address is deliberately left off - this repo is public.
function Gift() {
    return (
        <div className="mt-8 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 text-left">
            <p className="flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.18em] text-[var(--muted)]">
                <GiftIcon className="h-4 w-4 text-[#e5675b]" aria-hidden="true" />
                <FormattedMessage id="secret.gift.badge" defaultMessage="A present for you" />
            </p>

            <div className="mt-4 flex items-start gap-4">
                {/* The voucher art, cut out of its white product-shot backdrop so
                    it carries over into dark mode. */}
                <img
                    src="/voucher.webp"
                    alt=""
                    width="480"
                    height="324"
                    className="-mt-1 w-24 shrink-0 object-contain sm:w-28"
                />

                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-4">
                        <p className="font-semibold text-[var(--text)]">
                            <FormattedMessage
                                id="secret.gift.title"
                                defaultMessage="Virtual gift voucher"
                            />
                        </p>
                        <p className="shrink-0 font-mono text-sm text-[var(--text)]">65,00 €</p>
                    </div>

                    <p className="mt-1 text-sm text-[var(--muted)]">
                        <FormattedMessage
                            id="secret.gift.delivered"
                            defaultMessage="Delivered Saturday, 25 July, to {name}"
                            values={{ name: 'Helmi' }}
                        />
                    </p>
                </div>
            </div>

            <div className="mt-4 space-y-3 border-t border-[var(--line)] pt-4 text-sm leading-6 text-[var(--text)]">
                {/* His words, quoted exactly as they went out with the voucher.
                    `<3` rides in as a value because ICU would try to read the
                    `<` as the start of a tag. */}
                <p>
                    <FormattedMessage
                        id="secret.gift.line1"
                        defaultMessage="I love you so fucking much {heart}"
                        values={{ heart: '<3' }}
                    />
                </p>

                <p>
                    <FormattedMessage
                        id="secret.gift.line2"
                        defaultMessage="I never knew that an person like you could make my life so colorful again and give it a purpose again. I wanna live with you forever and also die together."
                    />
                </p>

                <p>
                    <FormattedMessage
                        id="secret.gift.line3"
                        defaultMessage="I never ever wanna loose you..."
                    />
                </p>
            </div>

            <ReceiptDownload />
        </div>
    );
}

// The receipt lives in a private Azure container and is proxied by the server,
// so it cannot be a plain <a href>: the request has to carry the unlock token.
// Fetch it, hand the browser a blob URL, revoke it again.
function ReceiptDownload() {
    const intl = useIntl();
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState('');

    async function handleDownload() {
        setDownloading(true);
        setError('');

        try {
            const token = sessionStorage.getItem(UNLOCK_TOKEN_KEY);

            const response = await fetch('/api/secret/voucher', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (!response.ok) {
                setError(
                    intl.formatMessage({
                        id: 'secret.gift.downloadError',
                        defaultMessage: 'That did not work. Try unlocking the page again.',
                    }),
                );
                return;
            }

            const url = URL.createObjectURL(await response.blob());
            const link = document.createElement('a');

            link.href = url;
            link.download = 'gutschein-beleg.pdf';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (_err) {
            setError(
                intl.formatMessage({
                    id: 'secret.gift.downloadOffline',
                    defaultMessage: 'Could not reach the server. Try again.',
                }),
            );
        } finally {
            setDownloading(false);
        }
    }

    return (
        <div className="mt-4 border-t border-[var(--line)] pt-4">
            <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[#e5675b] hover:text-[#e5675b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
            >
                <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                {downloading ? (
                    <FormattedMessage id="secret.gift.downloading" defaultMessage="Fetching…" />
                ) : (
                    <FormattedMessage
                        id="secret.gift.download"
                        defaultMessage="Download the receipt"
                    />
                )}
            </button>

            {error && (
                <p role="alert" className="mt-2 text-sm" style={{ color: 'var(--down)' }}>
                    {error}
                </p>
            )}
        </div>
    );
}

// A heart drawn around its own origin, so it can be dropped anywhere in the
// burst with nothing but a translate.
const HEART =
    'M0 4 C -2 1.6 -5 0 -5 -1.8 C -5 -3.8 -2.4 -4.6 0 -1.8 C 2.4 -4.6 5 -3.8 5 -1.8 C 5 0 2 1.6 0 4 Z';

const RAY_COUNT = 12;

/** A point on the circle around the middle of the 120×120 viewBox. */
function pointAt(degrees, radius) {
    const radians = (degrees * Math.PI) / 180;
    return [
        Number((60 + Math.cos(radians) * radius).toFixed(2)),
        Number((60 + Math.sin(radians) * radius).toFixed(2)),
    ];
}

// The firework. Rays on a clock face and a ring of sparks half a beat behind
// them, generated from angles rather than hand-written paths so the burst stays
// symmetrical and the markup stays short. Purely decorative - the milestone is
// already stated in words above it, so this is hidden from screen readers.
function FireworkHeart() {
    const angles = Array.from({ length: RAY_COUNT }, (_, index) => (index * 360) / RAY_COUNT);

    return (
        <svg
            viewBox="0 0 120 120"
            aria-hidden="true"
            className="mx-auto mt-8 h-28 w-28 sm:h-32 sm:w-32"
        >
            <g className="animate-burst" strokeLinecap="round" strokeWidth="2.5">
                {angles.map((angle, index) => {
                    const [x1, y1] = pointAt(angle, 20);
                    const [x2, y2] = pointAt(angle, 34);

                    return (
                        <line
                            key={angle}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={index % 2 ? 'var(--accent)' : '#e5675b'}
                        />
                    );
                })}
            </g>

            <g className="animate-burst animate-burst-late">
                {angles.map((angle, index) => {
                    const [x, y] = pointAt(angle + 15, 40);

                    return index % 2 ? (
                        <path
                            key={angle}
                            d={HEART}
                            fill="#e5675b"
                            transform={`translate(${x} ${y}) scale(0.8)`}
                        />
                    ) : (
                        <circle key={angle} cx={x} cy={y} r="2.2" fill="var(--accent)" />
                    );
                })}
            </g>

            <path
                d={HEART}
                fill="#e5675b"
                transform="translate(60 60) scale(1.9)"
                className="drop-shadow-[0_4px_12px_rgba(229,103,91,0.45)]"
            />
        </svg>
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
