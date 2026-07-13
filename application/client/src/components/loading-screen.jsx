import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BOOT_SESSION_KEY } from '../utils/boot.js';

/**
 * The real boot of this app, not invented shell poetry. The command is the
 * `CMD` from the dockerfile, and the log lines are what utils/logger.js
 * actually prints on startup (the Mongo URI redacted, obviously).
 *
 * Delays are uneven on purpose: real output doesn't arrive on a metronome.
 * They are also slower than the real thing — a boot you can't read is just a
 * flicker.
 */
const LINES = [
    { after: 0, kind: 'cmd', text: 'node server/src/server.js' },
    { after: 480, kind: 'log', text: 'Backend - Starting configuration...' },
    { after: 340, kind: 'log', text: 'Backend - Starting up ...' },
    { after: 540, kind: 'log', text: 'DB - Setting up connection using mongodb+srv://***' },
    { after: 600, kind: 'log', text: 'DB - Connection established.' },
    { after: 380, kind: 'log', text: 'Backend - Running on port 8080...' },
    { after: 480, kind: 'ready', text: 'ready' },
];

const TOTAL_MS = LINES.reduce((sum, l) => sum + l.after, 0);
// Let the finished output sit on screen before it fades.
const HOLD_MS = 700;
const FADE_MS = 320;

/** Wall-clock stamp of the client, in the log format the backend uses: HH:MM:SS.mmm */
function stamp(date = new Date()) {
    const pad = (n, width = 2) => String(n).padStart(width, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(
        date.getMilliseconds(),
        3,
    )}`;
}

function Line({ line, at }) {
    if (line.kind === 'cmd') {
        return (
            <p>
                <span className="text-[var(--accent)]">woofi@portfolio</span>
                <span className="text-[var(--muted)]">:~$</span>{' '}
                <span className="text-[var(--text)]">{line.text}</span>
            </p>
        );
    }

    if (line.kind === 'ready') {
        return <p className="text-[var(--live)]">{line.text}</p>;
    }

    return (
        <p className="text-[var(--muted)]">
            <span className="text-[var(--line)]">[{at}]</span>{' '}
            <span className="text-[var(--muted)]">info:</span>{' '}
            <span className="text-[var(--text)]">{line.text}</span>
        </p>
    );
}

export default function LoadingScreen({ onDone }) {
    // Each entry is the index into LINES plus the client's clock time at the
    // moment that line was printed — the timestamps are the visitor's own, not
    // a canned transcript.
    const [printed, setPrinted] = useState([]);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        sessionStorage.setItem(BOOT_SESSION_KEY, '1');
    }, []);

    // Print the next line after its own (uneven) delay.
    useEffect(() => {
        const next = printed.length;
        if (next >= LINES.length) return undefined;
        const id = setTimeout(
            () => setPrinted((rows) => [...rows, { index: next, at: stamp() }]),
            LINES[next].after,
        );
        return () => clearTimeout(id);
    }, [printed]);

    useEffect(() => {
        const fade = setTimeout(() => setLeaving(true), TOTAL_MS + HOLD_MS);
        const done = setTimeout(onDone, TOTAL_MS + HOLD_MS + FADE_MS);
        return () => {
            clearTimeout(fade);
            clearTimeout(done);
        };
    }, [onDone]);

    // Portalled to <body>: the homepage renders inside <main>, which is its own
    // stacking context (`relative z-10`), so a z-index here could never lift the
    // overlay above the layout's z-40 header. Outside that context, it can.
    return createPortal(
        <div
            role="status"
            aria-label="Starting"
            className={`fixed inset-0 z-[100] overflow-hidden bg-[var(--bg)] p-6 transition-opacity duration-300 sm:p-10 ${
                leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
        >
            <div className="space-y-0.5 font-mono text-sm leading-relaxed">
                {printed.map((row) => (
                    <Line key={row.index} line={LINES[row.index]} at={row.at} />
                ))}

                <span
                    aria-hidden="true"
                    className="animate-caret inline-block h-[1.05em] w-[0.6em] translate-y-[0.18em] bg-[var(--text)]"
                />
            </div>
        </div>,
        document.body,
    );
}
