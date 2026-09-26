import { useEffect, useState } from 'react';
import { FormattedDate, FormattedMessage } from 'react-intl';
import { BriefcaseIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { chipProps } from '../utils/tech-color.js';

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
 */
export default function CareerTimeline() {
    const [entries, setEntries] = useState(null); // null = still loading
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let active = true;

        fetch('/api/availability?track=career')
            .then((res) =>
                res.ok ? res.json() : Promise.reject(new Error(`status ${res.status}`)),
            )
            .then((list) => {
                if (active) setEntries(list);
            })
            .catch(() => {
                if (active) setFailed(true);
            });

        return () => {
            active = false;
        };
    }, []);

    const visible = (entries || [])
        .filter((entry) => entry.published)
        .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    return (
        <section className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-9">
            <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                <span className="text-[var(--accent)]">//</span>{' '}
                <FormattedMessage id="career.heading" defaultMessage="Career & education" />
            </h2>

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
                <ol className="relative mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-[1fr_2px_1fr]">
                    {/* The rail. Explicitly placed in the middle column and spanning
                        every row the grid ends up with, so it never affects where the
                        auto-placed cards land in columns 1 and 3. */}
                    <div
                        aria-hidden="true"
                        className="hidden sm:col-start-2 sm:row-span-full sm:block sm:w-px sm:justify-self-center sm:bg-[var(--line)]"
                    />

                    {visible.map((entry) => (
                        <CareerEntry key={entry._id} entry={entry} />
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

    if (src) {
        // A missing/broken same-origin file still isn't a legal risk, but it would
        // be a blank box — there is no monogram fallback path once <img> commits to
        // a src, so this only ever runs for a path that is known-good today.
        return (
            <img
                src={src}
                alt=""
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

function CareerEntry({ entry }) {
    const isWork = entry.kind !== 'education';
    const Icon = isWork ? BriefcaseIcon : AcademicCapIcon;
    const isCurrent = entry.endDate == null;

    return (
        <li
            className={`flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 ${
                isWork ? 'sm:col-start-1 sm:flex-row-reverse' : 'sm:col-start-3'
            }`}
        >
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

                <p className="mt-1 font-mono text-2xs uppercase tracking-wider text-[var(--muted)]">
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
