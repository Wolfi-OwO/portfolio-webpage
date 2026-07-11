import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { authHeaders, isAdmin } from '../utils/auth.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// An open-ended entry ("available from …") has no width of its own. Give it a
// share of the rail so it can still be seen, and fade its right edge — the bar
// has to look like it continues, not like it stops at an invented date.
const OPEN_ENDED_SHARE = 0.28;

const KINDS = [
    { id: 'work', labelId: 'availability.kind.work', defaultLabel: 'Work', color: 'var(--accent)' },
    {
        id: 'military',
        labelId: 'availability.kind.military',
        defaultLabel: 'Military service',
        color: 'var(--muted)',
    },
    {
        id: 'education',
        labelId: 'availability.kind.education',
        defaultLabel: 'Education',
        color: 'var(--accent)',
    },
    {
        id: 'available',
        labelId: 'availability.kind.available',
        defaultLabel: 'Available',
        color: 'var(--live)',
    },
];

const EMPTY_FORM = {
    _id: null,
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    kind: 'work',
    published: true,
};

/** yyyy-mm-dd, the only format <input type="date"> accepts. */
function toDateInput(value) {
    if (!value) return '';
    return new Date(value).toISOString().slice(0, 10);
}

function toForm(entry) {
    return {
        ...EMPTY_FORM,
        ...entry,
        description: entry.description || '',
        startDate: toDateInput(entry.startDate),
        endDate: toDateInput(entry.endDate),
    };
}

function toPayload(form) {
    return {
        title: form.title.trim(),
        description: form.description.trim(),
        startDate: form.startDate,
        // An empty end date means open-ended, not "epoch".
        endDate: form.endDate || null,
        kind: form.kind,
        published: Boolean(form.published),
    };
}

/** Whole months, rounded — "2 months" reads better than "78 days". */
function durationLabel(entry, intl) {
    if (!entry.endDate) {
        return intl.formatMessage({
            id: 'availability.openEnded',
            defaultMessage: 'open-ended',
        });
    }

    const days = Math.max(
        1,
        Math.round((new Date(entry.endDate) - new Date(entry.startDate)) / DAY_MS),
    );

    if (days < 45) {
        return intl.formatMessage(
            {
                id: 'availability.weeks',
                defaultMessage: '{count, plural, one {# week} other {# weeks}}',
            },
            { count: Math.max(1, Math.round(days / 7)) },
        );
    }

    return intl.formatMessage(
        {
            id: 'availability.months',
            defaultMessage: '{count, plural, one {# month} other {# months}}',
        },
        { count: Math.round(days / 30.44) },
    );
}

/**
 * Lays the entries out on one rail: each segment's width is its share of the
 * total span, so a six-month block genuinely looks twice as long as a three-month
 * one. Returns the entries plus their width in percent and their state relative
 * to today.
 */
function layout(entries, now = new Date()) {
    if (!entries.length) return { segments: [], todayPercent: null };

    const starts = entries.map((e) => new Date(e.startDate).getTime());
    const ends = entries.map((e) => (e.endDate ? new Date(e.endDate).getTime() : null));

    const first = Math.min(...starts);
    const lastClosed = Math.max(...ends.filter(Boolean), first);
    const closedSpan = Math.max(lastClosed - first, DAY_MS);

    const hasOpenEnded = ends.some((end) => !end);
    // The open-ended tail extends the rail beyond the last real date.
    const totalSpan = hasOpenEnded ? closedSpan / (1 - OPEN_ENDED_SHARE) : closedSpan;

    const segments = entries.map((entry, i) => {
        const start = starts[i];
        const end = ends[i] ?? first + totalSpan;
        const width = ((end - start) / totalSpan) * 100;

        const nowMs = now.getTime();
        const state = nowMs < start ? 'future' : nowMs > (ends[i] ?? Infinity) ? 'past' : 'current';

        return { entry, width, state, openEnded: !ends[i] };
    });

    const nowMs = now.getTime();
    const todayPercent =
        nowMs >= first && nowMs <= first + totalSpan ? ((nowMs - first) / totalSpan) * 100 : null;

    return { segments, todayPercent };
}

/**
 * On the homepage the list is owned by the page — the hero badge reads the same
 * array, and two independent fetches could disagree about whether I am free right
 * now. Anywhere else (the contact page) nothing else needs it, so the component
 * fetches for itself when no list is handed down.
 */
export default function AvailabilityTimeline({
    entries: providedEntries,
    setEntries: providedSetEntries,
    showIntro = true,
    showServicesLink = true,
}) {
    const intl = useIntl();
    const [ownEntries, setOwnEntries] = useState([]);

    const standalone = providedEntries === undefined;
    const entries = standalone ? ownEntries : providedEntries;
    const setEntries = standalone ? setOwnEntries : providedSetEntries;

    const [admin] = useState(() => isAdmin());
    const [form, setForm] = useState(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!standalone) return undefined;

        let active = true;

        fetch('/api/availability')
            .then((res) => (res.ok ? res.json() : []))
            .then((list) => {
                if (active) setOwnEntries(list);
            })
            .catch(() => {
                // Silent: the contact page is still perfectly usable without the
                // timeline, and an error box here would just be noise.
            });

        return () => {
            active = false;
        };
    }, [standalone]);

    async function handleSubmit(event) {
        event.preventDefault();

        if (!form.title.trim() || !form.startDate) {
            setError(
                intl.formatMessage({
                    id: 'availability.error.required',
                    defaultMessage: 'Title and start date are required.',
                }),
            );
            return;
        }

        if (form.endDate && form.endDate < form.startDate) {
            setError(
                intl.formatMessage({
                    id: 'availability.error.dateOrder',
                    defaultMessage: 'The end date cannot be before the start date.',
                }),
            );
            return;
        }

        setSaving(true);
        setError('');

        const editing = Boolean(form._id);
        const url = editing ? `/api/availability/${form._id}` : '/api/availability';

        try {
            const res = await fetch(url, {
                method: editing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify(toPayload(form)),
            });

            if (!res.ok) {
                const payload = await res.json().catch(() => ({}));
                setError(payload.message || 'Saving failed.');
                return;
            }

            const saved = await res.json();

            setEntries((current) => {
                const next = editing
                    ? current.map((e) => (e._id === saved._id ? saved : e))
                    : [...current, saved];

                return next.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
            });

            setForm(null);
        } catch (_err) {
            setError('Could not reach the server.');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(entry) {
        if (!window.confirm(`Delete "${entry.title}"?`)) return;

        try {
            const res = await fetch(`/api/availability/${entry._id}`, {
                method: 'DELETE',
                headers: { ...authHeaders() },
            });

            if (!res.ok && res.status !== 204) {
                setError('Deleting failed.');
                return;
            }

            setEntries((current) => current.filter((e) => e._id !== entry._id));
        } catch (_err) {
            setError('Could not reach the server.');
        }
    }

    const visible = admin ? entries : entries.filter((e) => e.published);
    const { segments, todayPercent } = layout(visible);

    // Nothing to say and nothing to edit: don't render an empty box.
    if (!visible.length && !admin) return null;

    return (
        <section className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    <span className="text-[var(--accent)]">//</span>{' '}
                    <FormattedMessage id="availability.heading" defaultMessage="Availability" />
                </h2>

                {admin && !form && (
                    <button
                        type="button"
                        onClick={() => setForm({ ...EMPTY_FORM })}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)]"
                    >
                        <PlusIcon className="h-3.5 w-3.5" />
                        <FormattedMessage id="availability.new" defaultMessage="New entry" />
                    </button>
                )}
            </div>

            {showIntro && (
                <p className="mt-4 leading-7 text-[var(--muted)]">
                    <FormattedMessage
                        id="availability.intro"
                        defaultMessage="I am open to work, but I want to be straight about the timing: I am on an internship until the end of September, and from October I do my six months with the Austrian Armed Forces. Smaller freelance jobs are possible alongside both — anything larger realistically starts in April 2027."
                    />
                </p>
            )}

            {error && (
                <p className="mt-4 rounded-lg border border-[var(--down)] px-4 py-2 text-sm text-[var(--down)]">
                    {error}
                </p>
            )}

            {admin && form && (
                <EntryForm
                    form={form}
                    setForm={setForm}
                    saving={saving}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setForm(null);
                        setError('');
                    }}
                />
            )}

            {segments.length > 0 && (
                <Rail
                    segments={segments}
                    todayPercent={todayPercent}
                    admin={admin}
                    intl={intl}
                    onEdit={(entry) => setForm(toForm(entry))}
                    onDelete={handleDelete}
                />
            )}

            {showServicesLink && (
                <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                        to="/services"
                        className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]"
                    >
                        <FormattedMessage
                            id="availability.servicesButton"
                            defaultMessage="What I build and what it costs"
                        />
                    </Link>
                </div>
            )}
        </section>
    );
}

function Rail({ segments, todayPercent, admin, intl, onEdit, onDelete }) {
    return (
        <div className="mt-8">
            {/* The rail itself: one bar per block, widths proportional to real duration. */}
            <div className="relative">
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--line)]">
                    {segments.map(({ entry, width, state, openEnded }) => {
                        const kind = KINDS.find((k) => k.id === entry.kind) || KINDS[0];

                        return (
                            <div
                                key={entry._id}
                                title={entry.title}
                                style={{
                                    width: `${width}%`,
                                    background: openEnded
                                        ? `linear-gradient(to right, ${kind.color}, transparent)`
                                        : kind.color,
                                    opacity: state === 'past' ? 0.35 : 1,
                                }}
                                className="h-full border-r border-[var(--surface)] last:border-r-0"
                            />
                        );
                    })}
                </div>

                {/* Today. Only drawn when it actually falls inside the span. */}
                {todayPercent !== null && (
                    <div
                        className="absolute -top-1.5 h-5 w-px bg-[var(--text)]"
                        style={{ left: `${todayPercent}%` }}
                    >
                        <span className="absolute -top-5 -translate-x-1/2 font-mono text-2xs uppercase tracking-wider text-[var(--text)]">
                            <FormattedMessage id="availability.today" defaultMessage="today" />
                        </span>
                    </div>
                )}
            </div>

            {/* Tick marks, one per block, sitting under the start of their segment. */}
            <div className="mt-0 flex w-full">
                {segments.map(({ entry, width }) => (
                    <div key={entry._id} style={{ width: `${width}%` }} className="min-w-0">
                        <div className="h-3 w-px bg-[var(--line)]" />
                    </div>
                ))}
            </div>

            {/* The legend: name, duration and dates for each block. */}
            <ol className="mt-4 space-y-px overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--line)]">
                {segments.map(({ entry, state, openEnded }) => {
                    const kind = KINDS.find((k) => k.id === entry.kind) || KINDS[0];

                    return (
                        <li
                            key={entry._id}
                            className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-[var(--surface)] px-4 py-3"
                        >
                            <span
                                aria-hidden="true"
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{
                                    background: kind.color,
                                    opacity: state === 'past' ? 0.35 : 1,
                                }}
                            />

                            <span className="font-semibold text-[var(--text)]">
                                {entry.title}
                                {!entry.published && (
                                    <span className="ml-2 font-mono text-2xs uppercase text-[var(--muted)]">
                                        draft
                                    </span>
                                )}
                            </span>

                            <span className="font-mono text-2xs uppercase tracking-wider text-[var(--accent)]">
                                {durationLabel(entry, intl)}
                            </span>

                            <span className="font-mono text-2xs uppercase tracking-wider text-[var(--muted)]">
                                <FormattedDate
                                    value={entry.startDate}
                                    day="2-digit"
                                    month="2-digit"
                                    year="numeric"
                                />
                                {openEnded ? (
                                    ' →'
                                ) : (
                                    <>
                                        {' – '}
                                        <FormattedDate
                                            value={entry.endDate}
                                            day="2-digit"
                                            month="2-digit"
                                            year="numeric"
                                        />
                                    </>
                                )}
                            </span>

                            {entry.description && (
                                <span className="basis-full text-sm text-[var(--muted)] sm:basis-auto">
                                    {entry.description}
                                </span>
                            )}

                            {state === 'current' && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--live)] px-2 py-0.5 font-mono text-2xs uppercase tracking-wider text-[var(--live)]">
                                    <span className="animate-live h-1.5 w-1.5 rounded-full bg-[var(--live)]" />
                                    <FormattedMessage id="availability.now" defaultMessage="now" />
                                </span>
                            )}

                            {admin && (
                                <span className="ml-auto flex shrink-0 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => onEdit(entry)}
                                        aria-label={`Edit ${entry.title}`}
                                        className="rounded-md border border-[var(--line)] p-1 text-[var(--muted)] transition hover:text-[var(--text)]"
                                    >
                                        <PencilSquareIcon className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDelete(entry)}
                                        aria-label={`Delete ${entry.title}`}
                                        className="rounded-md border border-[var(--line)] p-1 text-[var(--muted)] transition hover:text-[var(--down)]"
                                    >
                                        <TrashIcon className="h-3.5 w-3.5" />
                                    </button>
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

const INPUT =
    'w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]';

function EntryForm({ form, setForm, saving, onSubmit, onCancel }) {
    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

    return (
        <form
            onSubmit={onSubmit}
            className="mt-6 space-y-5 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-5"
        >
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[var(--text)]">
                    {form._id ? (
                        <FormattedMessage id="availability.form.edit" defaultMessage="Edit entry" />
                    ) : (
                        <FormattedMessage id="availability.form.new" defaultMessage="New entry" />
                    )}
                </h3>

                <button
                    type="button"
                    onClick={onCancel}
                    aria-label="Close"
                    className="rounded-md border border-[var(--line)] p-1.5 text-[var(--muted)] transition hover:text-[var(--text)]"
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title" required>
                    <input
                        value={form.title}
                        onChange={(e) => set('title', e.target.value)}
                        className={INPUT}
                    />
                </Field>

                <Field label="Kind">
                    <select
                        value={form.kind}
                        onChange={(e) => set('kind', e.target.value)}
                        className={INPUT}
                    >
                        {KINDS.map((k) => (
                            <option key={k.id} value={k.id}>
                                {k.defaultLabel}
                            </option>
                        ))}
                    </select>
                </Field>
            </div>

            <Field label="Description">
                <input
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    className={INPUT}
                />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Start" required>
                    <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => set('startDate', e.target.value)}
                        className={INPUT}
                    />
                </Field>

                <Field label="End (empty = open-ended)">
                    <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => set('endDate', e.target.value)}
                        className={INPUT}
                    />
                </Field>
            </div>

            <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => set('published', e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--line)]"
                />
                Published
            </label>

            <div className="flex gap-3 border-t border-[var(--line)] pt-4">
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-[var(--text)] px-4 py-2 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90 disabled:opacity-50"
                >
                    {saving ? 'Saving…' : 'Save'}
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-md border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

function Field({ label, required, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                {label}
                {required && <span className="text-[var(--down)]"> *</span>}
            </span>
            {children}
        </label>
    );
}
