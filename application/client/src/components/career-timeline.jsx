import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import {
    BriefcaseIcon,
    AcademicCapIcon,
    PencilSquareIcon,
    PlusIcon,
    TrashIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { chipProps } from '../utils/tech-color.js';
import { authHeaders, isAdmin } from '../utils/auth.js';
import { badgeState } from '../utils/availability.js';
import AvailabilityBadge from './availability-badge.jsx';

// The career track only ever shows as one of these two lanes — 'military',
// 'available' and 'unavailable' are availability-only kinds on the same enum
// (see the schema's `kind` field) and have no lane to render into here.
const CAREER_KINDS = [
    { id: 'work', labelId: 'career.kind.work', defaultLabel: 'Work' },
    { id: 'education', labelId: 'career.kind.education', defaultLabel: 'Education' },
];

const EMPTY_FORM = {
    _id: null,
    title: '',
    organisation: '',
    location: '',
    description: '',
    startDate: '',
    endDate: '',
    kind: 'work',
    published: true,
    tags: [],
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
        organisation: entry.organisation || '',
        location: entry.location || '',
        description: entry.description || '',
        startDate: toDateInput(entry.startDate),
        endDate: toDateInput(entry.endDate),
        tags: (entry.tags || []).map((t) => t.tech),
    };
}

/**
 * `track: 'career'` is hard-set here, never read from `form` — that's what
 * keeps a career row from ever satisfying `currentEntry()`/`badgeState()`
 * (see utils/availability.js), which only look at `track: 'availability'`
 * rows. Tags are kept as plain tech-name strings in form state and only
 * expanded to the schema's {tech, color} shape here, at submit time, by
 * looking each one up in the fetched technologies list.
 */
function toPayload(form, technologies) {
    return {
        title: form.title.trim(),
        organisation: form.organisation.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        startDate: form.startDate,
        // An empty end date means still ongoing, not "epoch".
        endDate: form.endDate || null,
        kind: form.kind,
        published: Boolean(form.published),
        track: 'career',
        tags: form.tags
            .map((techName) => technologies.find((t) => t.tech === techName))
            .filter(Boolean)
            .map((t) => ({ tech: t.tech, color: t.color })),
    };
}

/**
 * Career/education history, `track=career` rows from the same Availability
 * collection the homepage's availability rail reads (see that model's `track`
 * field). Rendered as two lanes either side of one shared rail — the same
 * shape LinkedIn's experience/education lists and standardresume.co/
 * brittanychiang.com's rail-plus-cards use — because HTL Villach's 2021–2026
 * span and the internships that sit inside it genuinely overlap, and a single
 * merged list can't show that overlap as parallel the way two lanes can.
 *
 * The lane split is CSS grid placement only (`sm:col-start-1` / `-3` per
 * item): the <ol> itself stays one flat reverse-chronological list, so DOM
 * order — and screen-reader order — always matches reading order.
 *
 * On the homepage the list is owned by the page — the hero badge and the
 * availability rail already read the same array, and a second, independent
 * `?track=career` fetch could disagree with it about what's published.
 * Anywhere else (a future standalone mount) nothing else needs it, so the
 * component fetches for itself when no list is handed down. Mirrors the
 * `standalone` prop contract in availability-timeline.jsx verbatim.
 */
export default function CareerTimeline({
    entries: providedEntries,
    setEntries: providedSetEntries,
}) {
    const intl = useIntl();
    const [ownEntries, setOwnEntries] = useState(null); // null = still loading
    const [failed, setFailed] = useState(false);

    const standalone = providedEntries === undefined;
    const entries = standalone ? ownEntries : providedEntries;
    const setEntries = standalone ? setOwnEntries : providedSetEntries;

    const [admin] = useState(() => isAdmin());
    const [form, setForm] = useState(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [technologies, setTechnologies] = useState([]);

    useEffect(() => {
        if (!standalone) return undefined;

        let active = true;

        fetch('/api/availability?track=career')
            .then((res) =>
                res.ok ? res.json() : Promise.reject(new Error(`status ${res.status}`)),
            )
            .then((list) => {
                if (active) setOwnEntries(list);
            })
            .catch(() => {
                if (active) setFailed(true);
            });

        return () => {
            active = false;
        };
    }, [standalone]);

    useEffect(() => {
        let active = true;

        fetch('/api/technologies')
            .then((res) => (res.ok ? res.json() : []))
            .then((list) => {
                if (active) setTechnologies(list);
            })
            .catch(() => {
                // The tag multi-select just renders empty — the rest of the form,
                // and the rest of the page, still works without it.
            });

        return () => {
            active = false;
        };
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();

        if (!form.title.trim() || !form.startDate) {
            setError(
                intl.formatMessage({
                    id: 'career.error.required',
                    defaultMessage: 'Title and start date are required.',
                }),
            );
            return;
        }

        if (form.endDate && form.endDate < form.startDate) {
            setError(
                intl.formatMessage({
                    id: 'career.error.dateOrder',
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
                body: JSON.stringify(toPayload(form, technologies)),
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

    // Belt-and-suspenders with the `?track=career` fetch above: entries handed
    // down as props (the homepage passes its unfiltered list) still need
    // availability rows kept off this timeline. `published` is only enforced
    // for non-admins, matching availability-timeline.jsx's own rail.
    const career = (entries || []).filter((entry) => entry.track === 'career');
    const visible = (admin ? career : career.filter((entry) => entry.published)).sort(
        (a, b) => new Date(b.startDate) - new Date(a.startDate),
    );

    return (
        <section className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    <span className="text-[var(--accent)]">//</span>{' '}
                    <FormattedMessage id="career.heading" defaultMessage="Career & education" />
                </h2>

                {admin && !form && (
                    <button
                        type="button"
                        onClick={() => setForm({ ...EMPTY_FORM })}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)]"
                    >
                        <PlusIcon className="h-3.5 w-3.5" />
                        <FormattedMessage id="career.new" defaultMessage="New entry" />
                    </button>
                )}
            </div>

            {/* Relocated from the standalone "// AVAILABILITY" box (now removed from
                the homepage): the status pill, the timing prose and the services link
                all need a home that survives that removal. Sits above the two-lane
                grid as its sibling, so it renders regardless of career data — even
                with zero career rows, a visitor still sees whether I'm available. */}
            <div className="mt-4 flex flex-col gap-4 border-b border-[var(--line)] pb-6">
                <AvailabilityBadge badge={badgeState(entries || [])} />

                <p className="leading-7 text-[var(--muted)]">
                    <FormattedMessage
                        id="availability.intro"
                        defaultMessage="I am open to work, but I want to be straight about the timing: I am on an internship until the end of September, and from October I do my six months with the Austrian Armed Forces. Smaller freelance jobs are possible alongside both — anything larger realistically starts in April 2027."
                    />
                </p>

                <div>
                    <Link
                        to="/services"
                        className="inline-flex rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]"
                    >
                        <FormattedMessage
                            id="availability.servicesButton"
                            defaultMessage="What I build and what it costs"
                        />
                    </Link>
                </div>
            </div>

            {error && (
                <p className="mt-4 rounded-lg border border-[var(--down)] px-4 py-2 text-sm text-[var(--down)]">
                    {error}
                </p>
            )}

            {admin && form && (
                <CareerEntryForm
                    form={form}
                    setForm={setForm}
                    saving={saving}
                    technologies={technologies}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setForm(null);
                        setError('');
                    }}
                />
            )}

            {failed && (
                <p className="mt-4 text-sm text-[var(--muted)]">
                    <FormattedMessage
                        id="career.error"
                        defaultMessage="Couldn't load career history right now."
                    />
                </p>
            )}

            {!failed && entries === null && (
                <p className="mt-4 font-mono text-2xs uppercase tracking-wider text-[var(--muted)]">
                    <FormattedMessage id="career.loading" defaultMessage="loading…" />
                </p>
            )}

            {!failed && entries !== null && visible.length === 0 && (
                <p className="mt-4 text-sm text-[var(--muted)]">
                    <FormattedMessage id="career.empty" defaultMessage="Nothing published yet." />
                </p>
            )}

            {visible.length > 0 && (
                <ol className="relative mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-[1fr_2px_1fr]">
                    {/* The spine. Explicitly placed in the middle column and spanning
                        every row the grid ends up with, so it never affects where the
                        auto-placed cards land in columns 1 and 3. Each entry then draws
                        its own connector + node reaching into this same column (see
                        CareerEntry below) — that's what turns this from a decorative
                        divider into a line every card actually attaches to. */}
                    <div
                        aria-hidden="true"
                        className="hidden sm:col-start-2 sm:row-span-full sm:block sm:w-px sm:justify-self-center sm:bg-[var(--line)]"
                    />

                    {visible.map((entry) => (
                        <CareerEntry
                            key={entry._id}
                            entry={entry}
                            admin={admin}
                            onEdit={(e) => setForm(toForm(e))}
                            onDelete={handleDelete}
                        />
                    ))}
                </ol>
            )}
        </section>
    );
}

/** Same-origin path only — a career entry can't be used to hotlink or track. */
function safeLogo(logo) {
    return typeof logo === 'string' && logo.startsWith('/') && !logo.startsWith('//') ? logo : null;
}

/** "Infineon Technologies" → "IT", "HTL Villach" → "HV", "BG/BRG Peraugymnasium" → "BB". */
function initials(organisation) {
    const words = (organisation || '').split(/[\s/]+/).filter(Boolean);
    if (!words.length) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
}

function Avatar({ organisation, logo }) {
    const src = safeLogo(logo);
    const [failed, setFailed] = useState(false);

    // Avatar itself doesn't remount when `logo` changes (its parent re-renders
    // it in place), so `failed` from a previous, different src would otherwise
    // stick around forever. Adjusting state during render (React's documented
    // pattern for this — see "Adjusting some state when a prop changes") beats
    // a useEffect here, which would set state after an extra, unnecessary render.
    const [prevLogo, setPrevLogo] = useState(logo);
    if (logo !== prevLogo) {
        setPrevLogo(logo);
        setFailed(false);
    }

    if (src && !failed) {
        // A missing/broken same-origin file falls back to the monogram below via
        // onError.
        return (
            <img
                src={src}
                alt=""
                onError={() => setFailed(true)}
                className="h-10 w-10 shrink-0 rounded-full border border-[var(--line)] object-cover"
            />
        );
    }

    return (
        <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] font-mono text-xs font-semibold text-[var(--muted)]"
        >
            {initials(organisation)}
        </span>
    );
}

function CareerEntry({ entry, admin, onEdit, onDelete }) {
    const isWork = entry.kind !== 'education';
    const Icon = isWork ? BriefcaseIcon : AcademicCapIcon;
    const isCurrent = entry.endDate == null;

    // Work cards flip to flex-row-reverse (avatar on the right, facing the
    // spine); education cards keep the default order (avatar on the left,
    // also facing the spine — it sits in column 3). Either way the avatar's
    // outer edge is the one that needs to reach across `gap-x-6` (24px) to the
    // shared line, so the connector/node just mirror whichever edge that is.
    const facingSpine = isWork
        ? 'left-full' // card's right edge — spine sits 24px further right
        : 'right-full'; // card's left edge — spine sits 24px further left
    const nodeOffset = isWork ? 'ml-6 -translate-x-1/2' : 'mr-6 translate-x-1/2';

    return (
        <li
            className={`relative flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-5 ${
                isWork ? 'sm:col-start-1 sm:flex-row-reverse' : 'sm:col-start-3'
            }`}
        >
            {/* Connector + node bridging this card to the shared spine. Both are
                sized off real values: `w-6`/`ml-6`/`mr-6` match the grid's own
                `gap-x-6` exactly, and `top-10` lands on the avatar's vertical
                centre (p-5 padding + half of the h-10 avatar = 2.5rem). Hidden
                below `sm` along with the spine itself — collapsed to one column
                there's no left/right split left to reconnect. */}
            <span
                aria-hidden="true"
                className={`absolute top-10 hidden h-px w-6 -translate-y-1/2 bg-[var(--line)] sm:block ${facingSpine}`}
            />
            <span
                aria-hidden="true"
                className={`absolute top-10 hidden -translate-y-1/2 rounded-full sm:block ${facingSpine} ${nodeOffset} ${
                    isCurrent
                        ? 'h-3 w-3 animate-live border-2 border-[var(--live)] bg-[var(--live)]'
                        : 'h-2.5 w-2.5 border-2 border-[var(--line)] bg-[var(--surface)]'
                }`}
            />

            <Avatar organisation={entry.organisation} logo={entry.logo} />

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[var(--text)]">{entry.title}</span>

                    {isCurrent && (
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
                                className="cursor-pointer rounded-md border border-[var(--line)] p-1 text-[var(--muted)] transition hover:text-[var(--text)]"
                            >
                                <PencilSquareIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(entry)}
                                aria-label={`Delete ${entry.title}`}
                                className="cursor-pointer rounded-md border border-[var(--line)] p-1 text-[var(--muted)] transition hover:text-[var(--down)]"
                            >
                                <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                        </span>
                    )}
                </div>

                {/* Icon + label, not just lane position — the mobile single column
                    has no "left vs right" left to read, and it shouldn't be color-only
                    either. */}
                <p className="mt-1 flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wider text-[var(--accent)]">
                    <Icon className="h-3.5 w-3.5" />
                    {isWork ? (
                        <FormattedMessage id="career.kind.work" defaultMessage="Work" />
                    ) : (
                        <FormattedMessage id="career.kind.education" defaultMessage="Education" />
                    )}
                </p>

                <p className="mt-1 text-sm text-[var(--muted)]">
                    {entry.organisation}
                    {entry.location ? ` · ${entry.location}` : ''}
                </p>

                {/* Plain (not uppercase/wide-tracked like the kind eyebrow above) so
                    the two mono lines don't read as duplicate labels — this one is
                    data to scan, not a tag. */}
                <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                    <FormattedDate
                        value={entry.startDate}
                        day="2-digit"
                        month="2-digit"
                        year="numeric"
                    />
                    {entry.endDate ? (
                        <>
                            {' – '}
                            <FormattedDate
                                value={entry.endDate}
                                day="2-digit"
                                month="2-digit"
                                year="numeric"
                            />
                        </>
                    ) : (
                        ' →'
                    )}
                </p>

                {entry.description && (
                    <p className="mt-2 text-sm text-[var(--muted)]">{entry.description}</p>
                )}

                {entry.tags?.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                        {entry.tags.map(({ tech, color }, i) => {
                            const { className, style } = chipProps(color);
                            return (
                                <li
                                    key={i}
                                    style={style}
                                    className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ring-black/10 dark:ring-white/10 ${className || ''}`}
                                >
                                    {tech}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </li>
    );
}

// Duplicated from availability-timeline.jsx rather than imported: that file
// only has a default export today, and turning it into a mixed default+named
// export just to share ~15 lines isn't worth the coupling between two
// otherwise-independent admin forms.
const INPUT =
    'w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]';

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

function CareerEntryForm({ form, setForm, saving, technologies, onSubmit, onCancel }) {
    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

    return (
        <form
            onSubmit={onSubmit}
            className="mt-6 space-y-5 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-5"
        >
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[var(--text)]">
                    {form._id ? (
                        <FormattedMessage id="career.form.edit" defaultMessage="Edit entry" />
                    ) : (
                        <FormattedMessage id="career.form.new" defaultMessage="New entry" />
                    )}
                </h3>

                <button
                    type="button"
                    onClick={onCancel}
                    aria-label="Close"
                    className="cursor-pointer rounded-md border border-[var(--line)] p-1.5 text-[var(--muted)] transition hover:text-[var(--text)]"
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
                        {CAREER_KINDS.map((k) => (
                            <option key={k.id} value={k.id}>
                                {k.defaultLabel}
                            </option>
                        ))}
                    </select>
                </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Organisation">
                    <input
                        value={form.organisation}
                        onChange={(e) => set('organisation', e.target.value)}
                        className={INPUT}
                    />
                </Field>

                <Field label="Location">
                    <input
                        value={form.location}
                        onChange={(e) => set('location', e.target.value)}
                        className={INPUT}
                    />
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

                <Field label="End (empty = ongoing)">
                    <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => set('endDate', e.target.value)}
                        className={INPUT}
                    />
                </Field>
            </div>

            <Field label="Tags">
                <select
                    multiple
                    value={form.tags}
                    onChange={(e) =>
                        set(
                            'tags',
                            Array.from(e.target.selectedOptions, (option) => option.value),
                        )
                    }
                    className={`${INPUT} h-32`}
                >
                    {technologies.map((t) => (
                        <option key={t._id} value={t.tech}>
                            {t.tech}
                        </option>
                    ))}
                </select>
            </Field>

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
                    className="cursor-pointer rounded-md bg-[var(--text)] px-4 py-2 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90 disabled:opacity-50"
                >
                    {saving ? 'Saving…' : 'Save'}
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    className="cursor-pointer rounded-md border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
