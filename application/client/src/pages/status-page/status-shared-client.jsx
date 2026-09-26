// Shared status-page COMPONENTS only (react-refresh/only-export-components
// forbids mixing components with plain functions/constants in one file) —
// the pure logic these components rely on (formatting, range-state) lives in
// status-shared.js. Both status-page.jsx and incidents-page.jsx import from
// here so the picker and the status dot render identically on both pages.
import { FormattedMessage } from 'react-intl';
import { CalendarIcon } from '@heroicons/react/24/outline';
import {
    BADGE,
    RANGE_PRESETS,
    MIN_RANGE_DATE,
    todayUTC,
    inputCls,
    labelCls,
} from './status-shared.js';

// Live dot: pulses when up, solid when idle (at rest) or down.
export function StatusDot({ status, size = 'sm' }) {
    const dim = size === 'lg' ? 'h-3 w-3' : 'h-2 w-2';

    if (status === 'down') {
        return (
            <span
                className={`inline-flex shrink-0 ${dim} rounded-full`}
                style={{ background: 'var(--down)' }}
            />
        );
    }
    if (status === 'idle') {
        // A hollow ring, not a filled dot: healthy but at rest. Reads as the
        // outline of "operational" rather than a dimmer copy of it — a scaled
        // to-zero app is up, just not doing anything.
        return (
            <span
                className={`inline-flex shrink-0 ${dim} rounded-full border`}
                style={{
                    borderColor: 'var(--live)',
                    background: 'color-mix(in srgb, var(--live) 15%, transparent)',
                }}
            />
        );
    }

    const color = BADGE[status]?.color ?? 'var(--muted)';
    return (
        <span className={`relative inline-flex shrink-0 ${dim}`}>
            <span
                className="absolute inline-flex h-full w-full rounded-full opacity-70 motion-safe:animate-ping"
                style={{ background: color }}
            />
            <span
                className={`relative inline-flex ${dim} rounded-full`}
                style={{ background: color }}
            />
        </span>
    );
}

// The row of preset pills + the "Custom…" toggle that reveals two native
// date inputs. Presentational only — the page owns the range state, URL
// sync, and validation (see useRangeState in status-shared.js); this just
// renders it and reports clicks/edits back up.
export function RangeSelector({
    activePreset,
    onPreset,
    customOpen,
    onToggleCustom,
    draftFrom,
    draftTo,
    onDraftFromChange,
    onDraftToChange,
    onFromBlur,
    onToBlur,
    onApplyCustom,
    fromError,
    toError,
}) {
    const pillCls = (active) =>
        `cursor-pointer rounded-md border px-3 py-1.5 font-mono text-2xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
            active
                ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--text)]'
                : 'border-[var(--line)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]'
        }`;

    return (
        <div className="mb-6">
            <div
                role="group"
                aria-label="Status date range"
                className="flex flex-wrap items-center gap-2"
            >
                <button
                    type="button"
                    aria-pressed={activePreset === 'default'}
                    onClick={() => onPreset('default')}
                    className={pillCls(activePreset === 'default')}
                >
                    <FormattedMessage id="status.range.live" defaultMessage="Current" />
                </button>

                {RANGE_PRESETS.map((preset) => (
                    <button
                        key={preset.id}
                        type="button"
                        aria-pressed={activePreset === preset.id}
                        onClick={() => onPreset(preset.id)}
                        className={pillCls(activePreset === preset.id)}
                    >
                        <FormattedMessage id={preset.labelId} defaultMessage={preset.label} />
                    </button>
                ))}

                <button
                    type="button"
                    aria-pressed={activePreset === 'all'}
                    onClick={() => onPreset('all')}
                    className={pillCls(activePreset === 'all')}
                >
                    <FormattedMessage id="status.range.all" defaultMessage="Whole period" />
                </button>

                <button
                    type="button"
                    aria-pressed={customOpen || activePreset === 'custom'}
                    aria-expanded={customOpen}
                    onClick={onToggleCustom}
                    className={`${pillCls(customOpen || activePreset === 'custom')} inline-flex items-center gap-1.5`}
                >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <FormattedMessage id="status.range.custom" defaultMessage="Custom…" />
                </button>
            </div>

            {customOpen && (
                <form
                    onSubmit={onApplyCustom}
                    className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)] p-4"
                >
                    <label className="flex-1 basis-40">
                        <span className={labelCls}>
                            <FormattedMessage id="status.range.from" defaultMessage="From" />
                        </span>
                        <input
                            type="date"
                            value={draftFrom}
                            min={MIN_RANGE_DATE}
                            max={todayUTC()}
                            required
                            onChange={(e) => onDraftFromChange(e.target.value)}
                            onBlur={onFromBlur}
                            className={inputCls}
                        />
                        {fromError && (
                            <p className="mt-1 text-xs text-[var(--down)]">{fromError}</p>
                        )}
                    </label>

                    <label className="flex-1 basis-40">
                        <span className={labelCls}>
                            <FormattedMessage id="status.range.to" defaultMessage="To" />
                        </span>
                        <input
                            type="date"
                            value={draftTo}
                            min={MIN_RANGE_DATE}
                            max={todayUTC()}
                            required
                            onChange={(e) => onDraftToChange(e.target.value)}
                            onBlur={onToBlur}
                            className={inputCls}
                        />
                        {toError && <p className="mt-1 text-xs text-[var(--down)]">{toError}</p>}
                    </label>

                    <button
                        type="submit"
                        className="inline-flex cursor-pointer items-center rounded-md bg-[var(--text)] px-5 py-2.5 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                        <FormattedMessage id="status.range.apply" defaultMessage="Apply" />
                    </button>
                </form>
            )}
        </div>
    );
}
