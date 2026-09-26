import { useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { ArrowLeftIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { StatusDot, RangeSelector } from './status-shared-client.jsx';
import {
    useRangeState,
    fmtDate,
    fmtDateTime,
    fmtDuration,
    presetDateRange,
    toApiRange,
} from './status-shared.js';
import { collectIncidents, sortByStartedAtDesc, groupByDay } from './incidents-shared.js';

// Every real incident this page can ever show is already auto-detected and
// stored by Metrion's own `refresh_uptime_rollup` job (mona repo, migrations
// 0014/0015) — this page is display-only, sourced entirely from the same
// `/api/status` response status-page.jsx already fetches. No polling here
// (unlike StatusPage): a retrospective incident list has no "live" reason to
// refetch every 15s, only a range change or an explicit refresh click.
const DEFAULT_RANGE_DAYS = 30;

export default function IncidentsPage() {
    usePageMeta('Incidents', 'Incident history for Woofi Developments and its monitored services.');
    const intl = useIntl();

    const [report, setReport] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Everything about the picker itself (URL sync, back/forward, custom-date
    // validation) is shared with StatusPage — see status-shared.js.
    // `rangeParam` is `null` until a visitor picks something; unlike
    // StatusPage there's no "live" view to fall back to, so a null param
    // still resolves to a concrete window (the trailing 30 days) below.
    const {
        rangeParam,
        activePreset,
        rangeError,
        setRangeError,
        customOpen,
        draftFrom,
        draftTo,
        setDraftFrom,
        setDraftTo,
        fromError,
        toError,
        handlePreset,
        handleToggleCustom,
        handleFromBlur,
        handleToBlur,
        handleApplyCustom,
    } = useRangeState();

    const effectiveRange = rangeParam ?? presetDateRange(DEFAULT_RANGE_DAYS);

    const load = useCallback(() => {
        const apiRange = toApiRange(effectiveRange);
        const url = new URL('/api/status', window.location.origin);
        url.searchParams.set('from', apiRange.from);
        url.searchParams.set('to', apiRange.to);

        return fetch(url)
            .then((response) => {
                if (response.ok) return response.json();
                if (response.status === 400) throw new Error('range');
                return null;
            })
            .then((data) => {
                if (data) {
                    setReport(data);
                    setLoadError(false);
                    setRangeError('');
                } else if (data !== undefined) {
                    setLoadError(true);
                }
            })
            .catch((err) => {
                if (err?.message === 'range') {
                    setRangeError(
                        intl.formatMessage({
                            id: 'status.range.error.invalid',
                            defaultMessage:
                                'This date range could not be loaded — pick a different one.',
                        }),
                    );
                    return;
                }
                setLoadError(true);
            });
        // effectiveRange is derived fresh from rangeParam every render (never
        // itself stored in state), so depending on its two primitive fields
        // is what actually reacts to a picker change here.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveRange.from, effectiveRange.to, intl, setRangeError]);

    useEffect(() => {
        load();
    }, [load]);

    async function handleRefresh() {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }

    const groups = report?.groups ?? [];
    const ungrouped = report?.ungrouped ?? [];
    const monitors = [...groups.flatMap((g) => g.monitors), ...ungrouped];

    // ponytail: Metrion caps incidents at 100 per application
    // (MAX_INCIDENTS) — a monitor past that ceiling for the selected window
    // only shows its most recent 100 here too, same honest truncation
    // status-page.jsx's own IncidentList already surfaces per-monitor. A
    // dedicated `/uptime/incidents` endpoint (paginated, not range-bounded)
    // is the upgrade path if anyone ever needs to see past it.
    const allIncidents = collectIncidents(monitors);
    const ongoing = sortByStartedAtDesc(allIncidents.filter((inc) => inc.endedAt == null));
    const ended = sortByStartedAtDesc(allIncidents.filter((inc) => inc.endedAt != null));
    const dayGroups = groupByDay(ended);
    const isEmpty = Boolean(report) && ongoing.length === 0 && ended.length === 0;

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
            <div className="mx-auto max-w-4xl px-6 py-12 lg:py-16">
                <div className="mb-6 flex items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)]">
                        <FormattedMessage
                            id="status.incidents.pageTitle"
                            defaultMessage="Incidents"
                        />
                    </h1>

                    <div className="flex-1" />

                    <button
                        type="button"
                        onClick={handleRefresh}
                        aria-label="Refresh"
                        title="Refresh"
                        className="cursor-pointer rounded-md p-2 text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                        <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <RangeSelector
                    activePreset={activePreset}
                    onPreset={handlePreset}
                    customOpen={customOpen}
                    onToggleCustom={handleToggleCustom}
                    draftFrom={draftFrom}
                    draftTo={draftTo}
                    onDraftFromChange={setDraftFrom}
                    onDraftToChange={setDraftTo}
                    onFromBlur={handleFromBlur}
                    onToBlur={handleToBlur}
                    onApplyCustom={handleApplyCustom}
                    fromError={fromError}
                    toError={toError}
                />

                {rangeError && (
                    <p
                        className="mb-6 flex items-center gap-2 rounded-md border px-4 py-2 font-mono text-xs"
                        style={{
                            borderColor: `color-mix(in srgb, var(--down) 35%, var(--line))`,
                            background: `color-mix(in srgb, var(--down) 8%, var(--surface))`,
                            color: 'var(--down)',
                        }}
                    >
                        <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
                        {rangeError}
                    </p>
                )}

                {loadError && !report && (
                    <div
                        className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border p-5"
                        style={{
                            borderColor: `color-mix(in srgb, var(--down) 35%, var(--line))`,
                            background: `color-mix(in srgb, var(--down) 8%, var(--surface))`,
                        }}
                    >
                        <span className="h-3 w-3 shrink-0 rounded-full bg-[var(--down)]" />
                        <p className="text-sm font-semibold text-[var(--text)]">
                            <FormattedMessage
                                id="status.incidents.loadError"
                                defaultMessage="Couldn't load incidents"
                            />
                        </p>
                    </div>
                )}

                {ongoing.length > 0 && (
                    <div className="mb-6">
                        <p
                            className="mb-2 font-mono text-2xs font-semibold uppercase tracking-[0.14em]"
                            style={{ color: 'var(--down)' }}
                        >
                            <FormattedMessage
                                id="status.incidents.ongoingHeading"
                                defaultMessage="Ongoing"
                            />
                        </p>
                        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
                            {ongoing.map((inc, index) => (
                                <IncidentRow key={index} incident={inc} />
                            ))}
                        </div>
                    </div>
                )}

                {dayGroups.map((group) => (
                    <div key={group.key} className="mb-6">
                        <p className="mb-2 font-mono text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                            {fmtDate(group.dayMs)}
                        </p>
                        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)]">
                            {group.incidents.map((inc, index) => (
                                <IncidentRow key={index} incident={inc} />
                            ))}
                        </div>
                    </div>
                ))}

                {isEmpty && (
                    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[var(--line)] px-6 py-16 text-center">
                        <p className="text-sm font-medium text-[var(--text)]">
                            <FormattedMessage
                                id="status.incidents.empty"
                                defaultMessage="No incidents in this period."
                            />
                        </p>
                    </div>
                )}

                {!report && !loadError && (
                    <div className="mb-6 flex animate-pulse items-center gap-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
                        <span className="h-3 w-3 shrink-0 rounded-full bg-[var(--line)]" />
                        <p className="font-mono text-sm text-[var(--muted)]">
                            <FormattedMessage
                                id="status.incidents.loading"
                                defaultMessage="Loading…"
                            />
                        </p>
                    </div>
                )}

                <a
                    href="/"
                    className="mt-6 inline-flex items-center gap-1.5 text-xs text-[var(--muted)] transition hover:text-[var(--accent)]"
                >
                    <ArrowLeftIcon className="h-3.5 w-3.5" />
                    <FormattedMessage
                        id="status.incidents.backToStatus"
                        defaultMessage="Back to status"
                    />
                </a>
            </div>
        </div>
    );
}

// One incident line: monitor name, start → end (or "Ongoing"), duration.
function IncidentRow({ incident }) {
    const ongoing = incident.endedAt == null;
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--line)] px-4 py-3 font-mono text-2xs last:border-0">
            <StatusDot status="down" />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--text)]">
                {incident.monitorName}
            </span>
            <span className="text-[var(--text)]">
                {fmtDateTime(Date.parse(incident.startedAt))}
            </span>
            <span className="text-[var(--muted)]">→</span>
            <span style={ongoing ? { color: 'var(--down)' } : undefined}>
                {ongoing ? (
                    <FormattedMessage id="status.incidents.ongoing" defaultMessage="ongoing" />
                ) : (
                    fmtDateTime(Date.parse(incident.endedAt))
                )}
            </span>
            <span className="text-[var(--muted)]">
                · {fmtDuration(incident.durationSeconds * 1000)}
            </span>
        </div>
    );
}
