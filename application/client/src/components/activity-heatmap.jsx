import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { SiGithub, SiGitlab } from 'react-icons/si';

const DAY_MS = 24 * 60 * 60 * 1000;

// One week is one column. Cell + gap must match the CSS below exactly, because the
// month and year rules are positioned by arithmetic, not by flow — a mismatch here
// would slide every label off its column.
const CELL = 10;
const GAP = 3;
const COLUMN = CELL + GAP;

// How close to the left edge the scroller has to get before the previous year is
// fetched. Roughly three weeks of runway, so the data lands before you arrive.
const PREFETCH_PX = 3 * COLUMN * 5;

const SOURCES = [
    { id: 'all', labelId: 'activity.source.all', defaultLabel: 'All' },
    { id: 'github', labelId: 'activity.source.github', defaultLabel: 'GitHub' },
    { id: 'gitlab', labelId: 'activity.source.gitlab', defaultLabel: 'GitLab' },
];

// Intl's German short months give "Jan"; Austrian usage is "Jän". Spelled out here
// rather than fought with locale tags.
const MONTHS_DE = ['Jän', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Five buckets, quantised against the busiest day in the window rather than fixed
 * thresholds — a quiet year would otherwise render as one flat grey field.
 */
function levelOf(count, max) {
    if (!count) return 0;
    if (max <= 1) return 4;

    const ratio = count / max;
    if (ratio > 0.66) return 4;
    if (ratio > 0.4) return 3;
    if (ratio > 0.16) return 2;
    return 1;
}

const LEVEL_STYLE = [
    'bg-[var(--line)]',
    'bg-[color-mix(in_srgb,var(--accent)_28%,var(--line))]',
    'bg-[color-mix(in_srgb,var(--accent)_52%,var(--line))]',
    'bg-[color-mix(in_srgb,var(--accent)_76%,var(--line))]',
    'bg-[var(--accent)]',
];

function isoDay(date) {
    return date.toISOString().slice(0, 10);
}

/** Monday of the week a date falls in — the grid is built column by column. */
function mondayOf(date) {
    const copy = new Date(date);
    const weekday = (copy.getUTCDay() + 6) % 7;
    copy.setUTCDate(copy.getUTCDate() - weekday);
    copy.setUTCHours(0, 0, 0, 0);
    return copy;
}

/**
 * Turns the flat day series into week columns and derives, from the same column
 * indices, where each month starts and where each year starts and ends. Doing it
 * in one pass is what keeps the three rows in lockstep while the window grows.
 */
function buildGrid(days) {
    if (!days.length) return { weeks: [], months: [], years: [] };

    const byDate = new Map(days.map(day => [day.date, day]));

    const first = mondayOf(new Date(days[0].date));
    const last = new Date(days[days.length - 1].date);

    const weeks = [];

    for (let cursor = new Date(first); cursor <= last; cursor.setUTCDate(cursor.getUTCDate() + 7)) {
        const column = [];

        for (let i = 0; i < 7; i += 1) {
            const date = new Date(cursor.getTime() + i * DAY_MS);
            column.push(byDate.get(isoDay(date)) || null);
        }

        weeks.push({ start: new Date(cursor), days: column });
    }

    // A month label sits on the first column whose Monday belongs to that month.
    const months = [];
    const years = [];

    weeks.forEach((week, index) => {
        const month = week.start.getUTCMonth();
        const year = week.start.getUTCFullYear();

        const previousMonth = months[months.length - 1];
        if (!previousMonth || previousMonth.month !== month || previousMonth.year !== year) {
            months.push({ month, year, index });
        }

        const previousYear = years[years.length - 1];
        if (!previousYear || previousYear.year !== year) {
            years.push({ year, index, span: 1 });
        } else {
            previousYear.span += 1;
        }
    });

    // Trailing width for each month, so a label can be hidden when its month is
    // only a column or two wide and would collide with the next one.
    months.forEach((entry, i) => {
        const next = months[i + 1];
        entry.span = (next ? next.index : weeks.length) - entry.index;
    });

    return { weeks, months, years };
}

/**
 * Where a day's work can be inspected. GitHub's profile takes a from/to range and
 * renders exactly that slice; GitLab has no per-day view, so it gets the activity
 * feed. A day with contributions on both forges links to the busier one — an empty
 * day links nowhere, because there is nothing to look at.
 */
function dayLink(day, meta) {
    if (!day.count || !meta) return null;

    const github = meta.sources.github;
    const gitlab = meta.sources.gitlab;

    if (day.github > 0 && day.github >= day.gitlab && github.ok) {
        return `${github.profileUrl}?tab=overview&from=${day.date}&to=${day.date}`;
    }

    if (day.gitlab > 0 && gitlab.ok) {
        return `${gitlab.profileUrl}/-/activity`;
    }

    return null;
}

export default function ActivityHeatmap() {
    const intl = useIntl();
    const monthNames = intl.locale?.startsWith('de') ? MONTHS_DE : MONTHS_EN;

    const [windows, setWindows] = useState([]); // newest first, one entry per fetched year
    const [meta, setMeta] = useState(null); // sources + repos, from the newest window
    const [source, setSource] = useState('all');
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const [exhausted, setExhausted] = useState(false);
    const [hovered, setHovered] = useState(null);

    const rowRef = useRef(null);
    const scrollerRef = useRef(null);
    // Scroll position is measured from the *right* edge: prepending a year pushes
    // everything rightwards, and anchoring to the left would teleport the view.
    const anchorRef = useRef(null);
    const loadingRef = useRef(false);

    const load = useCallback(async to => {
        if (loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);

        const from = new Date(to.getTime() - 364 * DAY_MS);

        try {
            const res = await fetch(
                `/api/activity?from=${isoDay(from)}&to=${isoDay(to)}`,
            );

            if (!res.ok) throw new Error(`status ${res.status}`);

            const payload = await res.json();

            setWindows(current => {
                // Guard against a double-fire appending the same year twice.
                if (current.some(w => w.from === payload.from)) return current;
                return [...current, payload];
            });

            setMeta(current => current || payload);

            // A window with nothing in it means we have scrolled past the start of
            // the account's history: stop asking for more.
            if (payload.days.every(day => day.count === 0)) setExhausted(true);
        } catch (_err) {
            if (!meta) setFailed(true);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [meta]);

    useEffect(() => {
        // Queued rather than called straight from the effect body: load() flips the
        // loading flag immediately, and a synchronous setState here would cascade a
        // render before the first paint.
        queueMicrotask(() => load(new Date()));
    }, [load]);

    // Days across every window, oldest first — the grid wants one dense series.
    const days = useMemo(() => {
        const merged = new Map();

        for (const window of windows) {
            for (const day of window.days) {
                merged.set(day.date, day);
            }
        }

        return [...merged.values()]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(day => ({
                ...day,
                count: source === 'all' ? day.github + day.gitlab : day[source],
            }));
    }, [windows, source]);

    const { weeks, months, years } = useMemo(() => buildGrid(days), [days]);
    const max = useMemo(() => days.reduce((m, d) => Math.max(m, d.count), 0), [days]);
    const total = useMemo(() => days.reduce((sum, d) => sum + d.count, 0), [days]);

    const width = weeks.length * COLUMN;

    // Start at the right (today), and after a prepend keep the same day under the
    // cursor by restoring the distance to the right edge.
    useLayoutEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        if (anchorRef.current === null) {
            scroller.scrollLeft = scroller.scrollWidth;
        } else {
            scroller.scrollLeft = scroller.scrollWidth - anchorRef.current;
        }
    }, [width]);

    // On a wide screen a single year fits without overflowing, and a pane that
    // cannot scroll never fires a scroll event — the past would be unreachable.
    // Keep pulling older years until there is something to scroll through.
    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller || !windows.length || exhausted || loadingRef.current) return;

        if (scroller.scrollWidth <= scroller.clientWidth + PREFETCH_PX) {
            anchorRef.current = scroller.scrollWidth - scroller.scrollLeft;

            const oldest = windows.reduce(
                (min, w) => (w.from < min ? w.from : min),
                windows[0].from,
            );

            load(new Date(new Date(oldest).getTime() - DAY_MS));
        }
    }, [windows, width, exhausted, load]);

    // The card is positioned against the row, so the cell's viewport rect has to be
    // rebased onto it — the scroller underneath moves independently.
    const showTooltip = (event, day) => {
        const row = rowRef.current;
        if (!row) return;

        const cell = event.currentTarget.getBoundingClientRect();
        const box = row.getBoundingClientRect();

        setHovered({
            day,
            x: cell.left - box.left + cell.width / 2,
            y: cell.top - box.top,
        });
    };

    const handleScroll = () => {
        // A card pinned to a cell that has just slid away would lie about which day
        // it describes.
        setHovered(null);

        const scroller = scrollerRef.current;
        if (!scroller || loadingRef.current || exhausted || !windows.length) return;

        if (scroller.scrollLeft < PREFETCH_PX) {
            anchorRef.current = scroller.scrollWidth - scroller.scrollLeft;

            const oldest = windows.reduce((min, w) => (w.from < min ? w.from : min), windows[0].from);
            load(new Date(new Date(oldest).getTime() - DAY_MS));
        }
    };

    if (failed) return null;

    return (
        <section className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    <span className="text-[var(--accent)]">//</span>{' '}
                    <FormattedMessage
                        id="activity.heading"
                        defaultMessage="What I have been building"
                    />
                </h2>

                <div className="flex gap-1 rounded-lg border border-[var(--line)] p-0.5">
                    {SOURCES.map(option => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => setSource(option.id)}
                            className={`rounded-md px-2.5 py-1 font-mono text-2xs uppercase tracking-wider transition ${
                                source === option.id
                                    ? 'bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--text)]'
                                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                            }`}
                        >
                            <FormattedMessage
                                id={option.labelId}
                                defaultMessage={option.defaultLabel}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <p className="mt-4 text-sm text-[var(--muted)]">
                <FormattedMessage
                    id="activity.total"
                    defaultMessage="{count} contributions since {since}"
                    values={{
                        count: total,
                        since: days.length ? (
                            <FormattedDate value={days[0].date} month="long" year="numeric" />
                        ) : (
                            '—'
                        ),
                    }}
                />
                {loading && (
                    <span className="ml-2 font-mono text-2xs uppercase tracking-wider text-[var(--accent)]">
                        <FormattedMessage id="activity.loading" defaultMessage="loading…" />
                    </span>
                )}
            </p>

            <p className="mt-1 font-mono text-2xs uppercase tracking-wider text-[var(--muted)]">
                {exhausted ? (
                    <FormattedMessage
                        id="activity.startReached"
                        defaultMessage="beginning of history"
                    />
                ) : (
                    <FormattedMessage
                        id="activity.scrollHint"
                        defaultMessage="← scroll for older years"
                    />
                )}
            </p>

            <div ref={rowRef} className="relative mt-5 flex gap-2">
                {/* The hover card. Anchored to this row (not to the scroller), so it
                    can overhang the grid's edges instead of being clipped by the
                    overflow that makes the years scrollable in the first place. */}
                {hovered && (
                    <div
                        role="tooltip"
                        className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 [box-shadow:var(--shadow-float)]"
                        style={{ left: hovered.x, top: hovered.y - 8 }}
                    >
                        <p className="whitespace-nowrap text-sm font-semibold text-[var(--text)]">
                            <FormattedMessage
                                id="activity.contributions"
                                defaultMessage="{count} contributions"
                                values={{ count: hovered.day.count }}
                            />
                        </p>

                        <p className="whitespace-nowrap font-mono text-2xs uppercase tracking-wider text-[var(--muted)]">
                            <FormattedDate
                                value={hovered.day.date}
                                weekday="long"
                                day="2-digit"
                                month="long"
                                year="numeric"
                            />
                        </p>

                        {/* Where the day's work actually happened — the combined cell
                            would otherwise hide which forge it came from. */}
                        {hovered.day.count > 0 && (
                            <p className="mt-1 whitespace-nowrap font-mono text-2xs text-[var(--muted)]">
                                {hovered.day.github > 0 && `GitHub ${hovered.day.github}`}
                                {hovered.day.github > 0 && hovered.day.gitlab > 0 && ' · '}
                                {hovered.day.gitlab > 0 && `GitLab ${hovered.day.gitlab}`}
                            </p>
                        )}
                    </div>
                )}

                {/* Weekday gutter: outside the scroller, so it stays put while the
                    years slide past it. */}
                <div className="flex shrink-0 flex-col pt-[34px] font-mono text-2xs text-[var(--muted)]">
                    <span style={{ height: COLUMN }}>Mo</span>
                    <span style={{ height: COLUMN }} />
                    <span style={{ height: COLUMN }}>Mi</span>
                    <span style={{ height: COLUMN }} />
                    <span style={{ height: COLUMN }}>Fr</span>
                </div>

                <div
                    ref={scrollerRef}
                    onScroll={handleScroll}
                    className="app-scroll overflow-x-auto pb-2"
                >
                    <div className="relative" style={{ width }}>
                        {/* Year band: |—— 2025 ——|—— 2026 ——| */}
                        <div className="relative h-5">
                            {years.map(year => (
                                <div
                                    key={year.year}
                                    className="absolute top-1 flex items-center gap-1.5 px-1"
                                    style={{
                                        left: year.index * COLUMN,
                                        width: year.span * COLUMN,
                                    }}
                                >
                                    <span className="h-2 w-px shrink-0 bg-[var(--line)]" />
                                    <span className="h-px flex-1 bg-[var(--line)]" />
                                    <span className="shrink-0 font-mono text-2xs font-semibold tracking-wider text-[var(--text)]">
                                        {year.year}
                                    </span>
                                    <span className="h-px flex-1 bg-[var(--line)]" />
                                    <span className="h-2 w-px shrink-0 bg-[var(--line)]" />
                                </div>
                            ))}
                        </div>

                        {/* Month row. Labels for very narrow months are dropped rather
                            than allowed to overlap their neighbour. */}
                        <div className="relative h-4">
                            {months.map(month => (
                                <span
                                    key={`${month.year}-${month.month}`}
                                    className="absolute font-mono text-2xs text-[var(--muted)]"
                                    style={{ left: month.index * COLUMN }}
                                >
                                    {month.span >= 3 ? monthNames[month.month] : ''}
                                </span>
                            ))}
                        </div>

                        {/* The grid itself. */}
                        <div className="flex" style={{ gap: GAP }}>
                            {weeks.map(week => (
                                <div
                                    key={week.start.toISOString()}
                                    className="flex flex-col"
                                    style={{ gap: GAP }}
                                >
                                    {week.days.map((day, i) => {
                                        if (!day) {
                                            return (
                                                <span
                                                    key={i}
                                                    style={{ width: CELL, height: CELL }}
                                                />
                                            );
                                        }

                                        const target = dayLink(day, meta);

                                        return (
                                            <button
                                                key={day.date}
                                                type="button"
                                                disabled={!target}
                                                aria-label={`${day.count} · ${day.date}`}
                                                onMouseEnter={e => showTooltip(e, day)}
                                                onFocus={e => showTooltip(e, day)}
                                                onMouseLeave={() => setHovered(null)}
                                                onBlur={() => setHovered(null)}
                                                onClick={() => {
                                                    if (target) {
                                                        window.open(
                                                            target,
                                                            '_blank',
                                                            'noopener,noreferrer',
                                                        );
                                                    }
                                                }}
                                                style={{ width: CELL, height: CELL }}
                                                className={`rounded-[2px] transition ${
                                                    LEVEL_STYLE[levelOf(day.count, max)]
                                                } ${
                                                    target
                                                        ? 'cursor-pointer hover:ring-2 hover:ring-[var(--text)]'
                                                        : 'cursor-default'
                                                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text)]`}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-2 font-mono text-2xs uppercase tracking-wider text-[var(--muted)]">
                <FormattedMessage id="activity.less" defaultMessage="less" />
                {LEVEL_STYLE.map((style, i) => (
                    <span
                        key={i}
                        style={{ width: CELL, height: CELL }}
                        className={`rounded-[2px] ${style}`}
                    />
                ))}
                <FormattedMessage id="activity.more" defaultMessage="more" />
            </div>

            {meta && <Sources sources={meta.sources} intl={intl} />}
            {meta?.repos?.length > 0 && <Repos repos={meta.repos} />}
        </section>
    );
}

function Sources({ sources, intl }) {
    const entries = [
        { id: 'github', Icon: SiGithub, ...sources.github },
        { id: 'gitlab', Icon: SiGitlab, ...sources.gitlab },
    ];

    return (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {entries.map(({ id, Icon, ok, reason, total, user, profileUrl }) => (
                <a
                    key={id}
                    href={profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-[var(--line)] px-4 py-3 transition hover:border-[var(--accent)]"
                >
                    <Icon className="h-5 w-5 shrink-0 text-[var(--text)]" />

                    <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[var(--text)]">
                            @{user}
                        </span>

                        {/* An unconfigured source says so, instead of quietly reading as "0 commits". */}
                        <span className="block font-mono text-2xs uppercase tracking-wider text-[var(--muted)]">
                            {ok
                                ? intl.formatMessage(
                                      {
                                          id: 'activity.contributions',
                                          defaultMessage: '{count} contributions',
                                      },
                                      { count: total },
                                  )
                                : intl.formatMessage({
                                      id: 'activity.unavailable',
                                      defaultMessage: 'not connected',
                                  })}
                            {!ok && reason === 'no-token' ? ' · token missing' : ''}
                        </span>
                    </span>

                    <ArrowTopRightOnSquareIcon className="ml-auto h-4 w-4 shrink-0 text-[var(--muted)]" />
                </a>
            ))}
        </div>
    );
}

function Repos({ repos }) {
    return (
        <div className="mt-6">
            <h3 className="font-mono text-2xs uppercase tracking-[0.2em] text-[var(--muted)]">
                <FormattedMessage id="activity.recent" defaultMessage="Recently touched" />
            </h3>

            <ul className="mt-3 grid gap-px overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
                {repos.map(repo => {
                    const Icon = repo.host === 'gitlab' ? SiGitlab : SiGithub;

                    return (
                        <li key={`${repo.host}-${repo.name}`} className="bg-[var(--surface)]">
                            <a
                                href={repo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-3 transition hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                            >
                                <Icon className="h-4 w-4 shrink-0 text-[var(--muted)]" />

                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold text-[var(--text)]">
                                        {repo.name}
                                    </span>

                                    {repo.lastActivity && (
                                        <span className="block font-mono text-2xs uppercase tracking-wider text-[var(--muted)]">
                                            <FormattedDate
                                                value={repo.lastActivity}
                                                day="2-digit"
                                                month="2-digit"
                                                year="numeric"
                                            />
                                            {repo.language ? ` · ${repo.language}` : ''}
                                        </span>
                                    )}
                                </span>

                                <ArrowTopRightOnSquareIcon className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                            </a>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
